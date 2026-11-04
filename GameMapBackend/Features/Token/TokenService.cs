using Microsoft.EntityFrameworkCore;
using GameMapBackend.Data;

namespace GameMapBackend.Features.Token;

public interface ITokenService
{
    Task<List<MapTokenDto>> GetTokensByMapAsync(Guid mapId, Guid sessionId);
    Task<MapTokenDto?> PlaceCharacterTokenAsync(Guid mapId, PlaceCharacterTokenDto dto);
    Task<MapTokenDto?> SpawnMonsterTokenAsync(Guid mapId, SpawnMonsterTokenDto dto);
    Task<MapTokenDto?> MoveTokenAsync(Guid tokenId, int targetX, int targetY);
    Task<MapTokenDto?> UpdateHpAsync(Guid tokenId, int newHp);
    Task<bool> DeleteTokenAsync(Guid tokenId);
}

public class TokenService : ITokenService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public TokenService(
        AppDbContext context,
        IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }
    private string? GetExistingImageUrl(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return null;

        // Keep external image URLs unchanged.
        if (Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp ||
                uri.Scheme == Uri.UriSchemeHttps))
        {
            return imageUrl;
        }

        var webRootPath = string.IsNullOrWhiteSpace(_env.WebRootPath)
            ? Path.Combine(_env.ContentRootPath, "wwwroot")
            : _env.WebRootPath;

        var relativePath = imageUrl
            .TrimStart('/', '\\')
            .Replace('/', Path.DirectorySeparatorChar);

        var rootPath = Path.GetFullPath(webRootPath);
        var filePath = Path.GetFullPath(
            Path.Combine(rootPath, relativePath));

        // Ensure the path stays inside wwwroot.
        var relativeToRoot = Path.GetRelativePath(rootPath, filePath);

        if (relativeToRoot == ".." ||
            relativeToRoot.StartsWith(
                $"..{Path.DirectorySeparatorChar}",
                StringComparison.Ordinal) ||
            Path.IsPathRooted(relativeToRoot))
        {
            return null;
        }

        return File.Exists(filePath) ? $"/{relativePath.Replace('\\', '/')}" : null;
    }


    public async Task<List<MapTokenDto>> GetTokensByMapAsync(Guid mapId, Guid sessionId)
    {
        var tokens = await _context.MapTokens
            .AsNoTracking()
            .Where(t => t.MapId == mapId && t.GameSessionId == sessionId)
            .ToListAsync();

        return tokens.Select(MapToDto).ToList();
    }


    public async Task<MapTokenDto?> PlaceCharacterTokenAsync(Guid mapId, PlaceCharacterTokenDto dto)
    {
        if (!await _context.SessionMaps.AnyAsync(map => map.Id == mapId && map.GameSessionId == dto.GameSessionId))
            return null;

        var character = await _context.Characters.FindAsync(dto.CharacterId);
        if (character == null) return null;

        var token = new MapTokenEntity
        {
            MapId = mapId,
            GameSessionId = dto.GameSessionId,
            CharacterId = character.Id,
            Name = character.Name,
            TokenImageUrl = character.TokenImageUrl,
            GridX = dto.GridX,
            GridY = dto.GridY,
            SizeInCells = 1,
            CurrentHp = character.CurrentHp,
            MaxHp = character.MaxHp,
            ArmorClass = character.ArmorClass
        };

        _context.MapTokens.Add(token);
        await _context.SaveChangesAsync();
        return MapToDto(token);
    }

    public async Task<MapTokenDto?> SpawnMonsterTokenAsync(Guid mapId, SpawnMonsterTokenDto dto)
    {
        if (!await _context.SessionMaps.AnyAsync(map => map.Id == mapId && map.GameSessionId == dto.GameSessionId))
            return null;

        var monster = await _context.Monsters
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Index == dto.MonsterIndex.ToLower());

        if (monster == null) return null;

        int size = monster.Size?.ToLower() switch
        {
            "large" => 2,
            "huge" => 3,
            "gargantuan" => 4,
            _ => 1
        };

        var token = new MapTokenEntity
        {
            MapId = mapId,
            GameSessionId = dto.GameSessionId,
            MonsterIndex = monster.Index,
            Name = dto.CustomName ?? monster.Name,
            TokenImageUrl = $"/tokens/monsters/{monster.Index}.png",
            GridX = dto.GridX,
            GridY = dto.GridY,
            SizeInCells = size,
            MaxHp = monster.HitPoints,
            CurrentHp = monster.HitPoints,
            ArmorClass = monster.ArmorClass
        };

        _context.MapTokens.Add(token);
        await _context.SaveChangesAsync();
        return MapToDto(token);
    }

    public async Task<MapTokenDto?> MoveTokenAsync(Guid tokenId, int targetX, int targetY)
    {
        var token = await _context.MapTokens.FindAsync(tokenId);
        if (token == null || token.IsLocked) return null;

        token.GridX = targetX;
        token.GridY = targetY;
        await _context.SaveChangesAsync();
        return MapToDto(token);
    }

    public async Task<MapTokenDto?> UpdateHpAsync(Guid tokenId, int newHp)
    {
        var token = await _context.MapTokens.FindAsync(tokenId);
        if (token == null) return null;

        token.CurrentHp = Math.Clamp(newHp, 0, token.MaxHp);

        if (token.CharacterId.HasValue)
        {
            var character = await _context.Characters.FindAsync(token.CharacterId.Value);
            if (character != null)
            {
                character.CurrentHp = token.CurrentHp;
            }
        }

        await _context.SaveChangesAsync();
        return MapToDto(token);
    }

    public async Task<bool> DeleteTokenAsync(Guid tokenId)
    {
        var token = await _context.MapTokens.FindAsync(tokenId);
        if (token == null) return false;

        _context.MapTokens.Remove(token);
        await _context.SaveChangesAsync();
        return true;
    }

    private MapTokenDto MapToDto(MapTokenEntity t) => new(
        t.Id,
        t.MapId,
        t.CharacterId,
        t.GameSessionId,
        t.MonsterIndex,
        t.Name,
        GetExistingImageUrl(t.TokenImageUrl),
        t.GridX,
        t.GridY,
        t.SizeInCells,
        t.CurrentHp,
        t.MaxHp,
        t.ArmorClass,
        t.IsVisibleToPlayers,
        t.IsLocked
    );
}


