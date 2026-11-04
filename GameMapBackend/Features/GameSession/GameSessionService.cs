using Microsoft.EntityFrameworkCore;
using GameMapBackend.Data;
using GameMapBackend.Features.Map;
using GameMapBackend.Features.Grid;

namespace GameMapBackend.Features.GameSession;

public interface IGameSessionService
{
    Task<GameSessionDto> CreateSessionAsync(CreateSessionDto dto);
    Task<GameSessionDto?> GetSessionByIdAsync(Guid sessionId);
    Task<GameSessionDto?> JoinSessionAsync(JoinSessionDto dto);
    Task<Guid> CopyMapToSessionAsync(Guid sessionId, Guid mapId);
    Task<bool> SwitchActiveMapAsync(Guid sessionId, Guid newMapId);
    Task<List<GameSessionDto>> GetSessionsByDungeonMasterIdAsync(Guid dungeonMasterId);
}

public class GameSessionService : IGameSessionService
{
    private readonly AppDbContext _context;

    public GameSessionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<GameSessionDto> CreateSessionAsync(
        CreateSessionDto dto)
    {
        var dungeonMaster = await _context.Users
            .SingleOrDefaultAsync(u => u.Id == dto.DungeonMasterId);

        if (dungeonMaster == null)
        {
            throw new KeyNotFoundException(
                "Gamemaster nicht gefunden.");
        }

        var session = new GameSessionEntity
        {
            SessionName = dto.SessionName,
            DungeonMasterId = dungeonMaster.Id,
            DungeonMaster = dungeonMaster,
            JoinCode = GenerateJoinCode()
        };

        if (dto.InitialMapId.HasValue)
        {
            var originalMap = await GetLibraryMapAsync(dto.InitialMapId.Value);
            session.ActiveMap = CreatePlayableMap(session, originalMap);
            session.ActiveMapId = session.ActiveMap.Id;
        }

        session.Participants.Add(new SessionParticipantEntity
        {
            PlayerId = dungeonMaster.Id.ToString(),
            PlayerName = dungeonMaster.Username,
            IsDungeonMaster = true
        });

        _context.GameSessions.Add(session);

        await _context.SaveChangesAsync();

        return MapToDto(session);
    }
    public async Task<List<GameSessionDto>>GetSessionsByDungeonMasterIdAsync(Guid dungeonMasterId)
    {
        var sessions = await _context.GameSessions
            .AsNoTracking()
            .Include(s => s.Participants)
            .Where(s => s.DungeonMasterId == dungeonMasterId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return sessions
            .Select(MapToDto)
            .ToList();
    }

    public async Task<GameSessionDto?> GetSessionByIdAsync(Guid sessionId)
    {
        var session = await _context.GameSessions
            .AsNoTracking()
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        return session == null ? null : MapToDto(session);
    }

    public async Task<GameSessionDto?> JoinSessionAsync(JoinSessionDto dto)
    {
        var joinCode = dto.JoinCode.Trim().ToUpperInvariant();

        var session = await _context.GameSessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.JoinCode == joinCode);

        if (session == null)
            return null;

        var existing = session.Participants
            .FirstOrDefault(p => p.PlayerId == dto.PlayerId);

        if (existing != null)
        {
            existing.PlayerName = dto.PlayerName;

            if (dto.CharacterId.HasValue)
            {
                existing.SelectedCharacterId = dto.CharacterId;
            }

            await _context.SaveChangesAsync();

            return MapToDto(session);
        }

        var participant = new SessionParticipantEntity
        {
            Id = Guid.NewGuid(),
            GameSessionId = session.Id,
            PlayerId = dto.PlayerId,
            PlayerName = dto.PlayerName,
            SelectedCharacterId = dto.CharacterId,
            IsDungeonMaster = false,
            JoinedAt = DateTime.UtcNow
        };

        session.Participants.Add(participant);

        _context.Entry(participant).State = EntityState.Added;

        await _context.SaveChangesAsync();

        return MapToDto(session);
    }

    public async Task<Guid> CopyMapToSessionAsync(Guid sessionId, Guid mapId)
    {
        var session = await _context.GameSessions.FindAsync(sessionId);
        if (session == null)
            throw new KeyNotFoundException("Spiel-Sitzung nicht gefunden.");

        var existing = await _context.SessionMaps
            .FirstOrDefaultAsync(map => map.GameSessionId == sessionId
                && (map.Id == mapId || map.OriginalMapId == mapId));

        if (existing != null && await _context.Maps.AnyAsync(map => map.Id == existing.Id))
        {
            return existing.Id;
        }

        var originalMap = await GetLibraryMapAsync(mapId);
        var playableMap = CreatePlayableMap(session, originalMap);
        await _context.SaveChangesAsync();

        return playableMap.Id;
    }

    public async Task<bool> SwitchActiveMapAsync(Guid sessionId, Guid newMapId)
    {
        var session = await _context.GameSessions.FindAsync(sessionId);
        if (session == null) return false;

        try
        {
            session.ActiveMapId = await CopyMapToSessionAsync(sessionId, newMapId);
        }
        catch (KeyNotFoundException)
        {
            return false;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<MapEntity> GetLibraryMapAsync(Guid mapId)
    {
        var originalMap = await _context.Maps
            .AsNoTracking()
            .Include(map => map.Grid)
            .FirstOrDefaultAsync(map => map.Id == mapId
                && !_context.SessionMaps.Any(copy => copy.Id == map.Id));

        return originalMap ?? throw new KeyNotFoundException("Original-Map in der Bibliothek nicht gefunden.");
    }

    private MapEntity CreatePlayableMap(GameSessionEntity session, MapEntity originalMap)
    {
        var map = new MapEntity
        {
            Title = originalMap.Title,
            ImageUrl = originalMap.ImageUrl,
            WidthInPixels = originalMap.WidthInPixels,
            HeightInPixels = originalMap.HeightInPixels
        };

        if (originalMap.Grid is { } originalGrid)
        {
            map.Grid = new GridEntity
            {
                MapId = map.Id,
                CellSizeInPixels = originalGrid.CellSizeInPixels,
                Columns = originalGrid.Columns,
                Rows = originalGrid.Rows,
                LineColor = originalGrid.LineColor,
                LineOpacity = originalGrid.LineOpacity,
                OffsetX = originalGrid.OffsetX,
                OffsetY = originalGrid.OffsetY
            };
        }

        var gridSnapshot = map.Grid == null ? null : new GridDto(
            map.Grid.Id, map.Id, map.Grid.CellSizeInPixels,
            map.Grid.Columns, map.Grid.Rows, map.Grid.LineColor,
            map.Grid.LineOpacity, map.Grid.OffsetX, map.Grid.OffsetY);

        _context.SessionMaps.Add(new SessionMapEntity
        {
            Id = map.Id,
            GameSession = session,
            GameSessionId = session.Id,
            OriginalMapId = originalMap.Id,
            Title = map.Title,
            ImageUrl = map.ImageUrl,
            GridJson = System.Text.Json.JsonSerializer.Serialize(gridSnapshot),
            TokensJson = "[]"
        });
        _context.Maps.Add(map);
        return map;
    }

    private static string GenerateJoinCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 6).Select(s => s[random.Next(s.Length)]).ToArray());
    }

    private static GameSessionDto MapToDto(GameSessionEntity s) => new(
        s.Id,
        s.SessionName,
        s.JoinCode,
        s.DungeonMasterId,
        s.ActiveMapId,
        s.Participants.Select(p => new ParticipantDto(
            p.Id,
            p.PlayerId,
            p.PlayerName,
            p.SelectedCharacterId,
            p.IsDungeonMaster
        )).ToList()
    );
}
