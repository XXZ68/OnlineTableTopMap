using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using GameMapBackend.Data;

namespace GameMapBackend.Features.Character;

public interface ICharacterService
{
    Task<List<CharacterDto>> GetCharactersBySessionAsync(Guid sessionId);
    Task<CharacterDto?> GetCharacterByIdAsync(Guid id);
    Task<CharacterDto> CreateCharacterAsync(CreateCharacterDto dto);
    Task<CharacterDto?> UpdateCharacterSheetAsync(Guid id, UpdateCharacterSheetDto dto);
    Task<CharacterDto?> UpdateCurrentHpAsync(Guid id, string playerId, int newHp);
    Task<LevelUpCharacterResult?> LevelUpAsync(Guid id, string playerId);
    Task<bool> DeleteCharacterAsync(Guid id);
    IReadOnlyList<string> ListTokenImages();
    Task<CharacterDto?> SetTokenImageAsync(Guid id, string playerId, string? path);
}

public class CharacterService : ICharacterService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly PasswordHasher<CharacterEntity> _passwordHasher = new();

    public CharacterService(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    public async Task<List<CharacterDto>> GetCharactersBySessionAsync(Guid sessionId)
    {
        return await _context.Characters
            .AsNoTracking()
            .Where(c => c.GameSessionId == sessionId)
            .Select(c => MapToDto(c))
            .ToListAsync();
    }

    public async Task<CharacterDto?> GetCharacterByIdAsync(Guid id)
    {
        var entity = await _context.Characters.FindAsync(id);
        return entity == null ? null : MapToDto(entity);
    }

    public async Task<CharacterDto> CreateCharacterAsync(CreateCharacterDto dto)
    {
        var entity = new CharacterEntity
        {
            GameSessionId = dto.GameSessionId,
            Name = dto.Name,
            TokenImageUrl = NormalizeImage(dto.TokenImageUrl),
            OwnerPlayerId = dto.OwnerPlayerId,
            ClassIndex = dto.ClassIndex,
            RaceIndex = dto.RaceIndex,
            MaxHp = dto.MaxHp,
            CurrentHp = dto.MaxHp,
            ArmorClass = dto.ArmorClass,
            SpeedInFeet = dto.SpeedInFeet
        };
        entity.PasswordHash = _passwordHasher.HashPassword(entity, dto.CharacterPassword);

        _context.Characters.Add(entity);
        await _context.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<CharacterDto?> UpdateCharacterSheetAsync(Guid id, UpdateCharacterSheetDto dto)
    {
        var character = await _context.Characters.FindAsync(id);
        if (character == null) return null;

        character.Name = dto.Name;
        character.MaxHp = dto.MaxHp;
        character.ArmorClass = dto.ArmorClass;
        character.SpeedInFeet = dto.SpeedInFeet;

        await _context.SaveChangesAsync();
        return MapToDto(character);
    }

    public async Task<CharacterDto?> UpdateCurrentHpAsync(Guid id, string playerId, int newHp)
    {
        var character = await _context.Characters.FindAsync(id);
        if (character == null || !await IsSelectedByPlayerAsync(character, playerId)) return null;

        character.CurrentHp = Math.Clamp(newHp, 0, character.MaxHp);
        await SyncCharacterTokensAsync(character);
        await _context.SaveChangesAsync();
        return MapToDto(character);
    }

    public async Task<LevelUpCharacterResult?> LevelUpAsync(Guid id, string playerId)
    {
        var character = await _context.Characters.FindAsync(id);
        if (character == null || !await IsSelectedByPlayerAsync(character, playerId) || character.Level >= 20)
            return null;

        var hitDie = await _context.Classes
            .Where(dndClass => dndClass.Index == character.ClassIndex)
            .Select(dndClass => dndClass.HitDie)
            .FirstOrDefaultAsync();
        if (hitDie <= 0) return null;

        var hitPointRoll = Random.Shared.Next(1, hitDie + 1);
        character.Level++;
        character.MaxHp += hitPointRoll;
        character.CurrentHp += hitPointRoll;

        await SyncCharacterTokensAsync(character);
        await _context.SaveChangesAsync();

        return new LevelUpCharacterResult(MapToDto(character), hitDie, hitPointRoll);
    }

    //  token images for characters

    private static readonly string[] AllowedExt = { ".png", ".jpg", ".jpeg", ".webp" };

    private string ImageDir => Path.Combine(
        string.IsNullOrWhiteSpace(_env.WebRootPath)
            ? Path.Combine(_env.ContentRootPath, "wwwroot")
            : _env.WebRootPath,
        "tokens", "characters");

    public IReadOnlyList<string> ListTokenImages()
    {
        if (!Directory.Exists(ImageDir)) return Array.Empty<string>();

        return Directory.EnumerateFiles(ImageDir)
            .Where(f => AllowedExt.Contains(Path.GetExtension(f).ToLowerInvariant()))
            .Select(f => $"/tokens/characters/{Path.GetFileName(f)}")
            .OrderBy(p => p)
            .ToList();
    }

    private string? NormalizeImage(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;

        var fileName = Path.GetFileName(path);   // strips any "../"
        if (!AllowedExt.Contains(Path.GetExtension(fileName).ToLowerInvariant())) return null;
        if (!File.Exists(Path.Combine(ImageDir, fileName))) return null;

        return $"/tokens/characters/{fileName}";
    }

    public async Task<CharacterDto?> SetTokenImageAsync(Guid id, string playerId, string? path)
    {
        var character = await _context.Characters.FindAsync(id);
        if (character == null) return null;

        var allowed = character.OwnerPlayerId == playerId
                      || await IsSelectedByPlayerAsync(character, playerId);
        if (!allowed) return null;

        character.TokenImageUrl = NormalizeImage(path);  

        var tokens = await _context.MapTokens
            .Where(t => t.CharacterId == character.Id)
            .ToListAsync();
        foreach (var token in tokens)
            token.TokenImageUrl = character.TokenImageUrl;

        await _context.SaveChangesAsync();
        return MapToDto(character);
    }

    // exists

    private Task<bool> IsSelectedByPlayerAsync(CharacterEntity character, string playerId) =>
        _context.SessionParticipants.AnyAsync(participant =>
            participant.GameSessionId == character.GameSessionId &&
            participant.PlayerId == playerId &&
            participant.SelectedCharacterId == character.Id);

    private async Task SyncCharacterTokensAsync(CharacterEntity character)
    {
        var tokens = await _context.MapTokens
            .Where(token => token.CharacterId == character.Id)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.CurrentHp = character.CurrentHp;
            token.MaxHp = character.MaxHp;
        }
    }

    public async Task<bool> DeleteCharacterAsync(Guid id)
    {
        var entity = await _context.Characters.FindAsync(id);
        if (entity == null) return false;

        _context.Characters.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    private static CharacterDto MapToDto(CharacterEntity c) => new(
        c.Id,
        c.GameSessionId,
        c.Name,
        c.TokenImageUrl,
        c.OwnerPlayerId,
        c.ClassIndex,
        c.RaceIndex,
        c.Level,
        c.MaxHp,
        c.CurrentHp,
        c.ArmorClass,
        c.SpeedInFeet
    );
}