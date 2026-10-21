using Microsoft.EntityFrameworkCore;
using GameMapBackend.Data;
using GameMapBackend.Features.Map;

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
            JoinCode = GenerateJoinCode(),
            ActiveMapId = dto.InitialMapId
        };

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
        var originalMap = await _context.Maps
            .Include(m => m.Grid)
            .FirstOrDefaultAsync(m => m.Id == mapId);

        if (session == null)
            throw new KeyNotFoundException("Spiel-Sitzung nicht gefunden.");
        
        if (originalMap == null)
            throw new KeyNotFoundException("Original-Map in der Bibliothek nicht gefunden.");

        var sessionMap = new SessionMapEntity
        {
            GameSessionId = sessionId,
            OriginalMapId = mapId,
            Title = originalMap.Title,
            ImageUrl = originalMap.ImageUrl,
            GridJson = System.Text.Json.JsonSerializer.Serialize(originalMap.Grid),
            TokensJson = "[]"
        };

        _context.SessionMaps.Add(sessionMap);
        await _context.SaveChangesAsync();

        session.ActiveMapId = sessionMap.Id;
        await _context.SaveChangesAsync();

        return sessionMap.Id;
    }

    public async Task<bool> SwitchActiveMapAsync(Guid sessionId, Guid newMapId)
    {
        var session = await _context.GameSessions.FindAsync(sessionId);
        if (session == null) return false;

        session.ActiveMapId = newMapId;
        await _context.SaveChangesAsync();
        return true;
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
