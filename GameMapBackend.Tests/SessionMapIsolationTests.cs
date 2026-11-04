using GameMapBackend.Data;
using GameMapBackend.Features.Compendium;
using GameMapBackend.Features.GameSession;
using GameMapBackend.Features.Grid;
using GameMapBackend.Features.Map;
using GameMapBackend.Features.Spell;
using GameMapBackend.Features.Token;
using GameMapBackend.Features.User;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Xunit;

namespace GameMapBackend.Tests;

public sealed class SessionMapIsolationTests : IDisposable
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private readonly string _webRoot = Path.Combine(Path.GetTempPath(), $"GameMapTests-{Guid.NewGuid()}");
    private readonly AppDbContext _context;
    private readonly GameSessionService _sessions;
    private readonly MapService _maps;
    private readonly TokenService _tokens;
    private readonly UserEntity _user = new() { Username = "Host", PasswordHash = "test-only" };
    private readonly MapEntity _original = new()
    {
        Title = "Forest", ImageUrl = "/map.png", WidthInPixels = 800, HeightInPixels = 600
    };
    private readonly MapEntity _otherOriginal = new()
    {
        Title = "Castle", ImageUrl = "/map.png", WidthInPixels = 800, HeightInPixels = 600
    };

    public SessionMapIsolationTests()
    {
        Directory.CreateDirectory(_webRoot);
        File.WriteAllBytes(Path.Combine(_webRoot, "map.png"), [1, 2, 3]);
        _connection.Open();
        _context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection).Options);
        _context.Database.EnsureCreated();

        _original.Grid = new GridEntity
        {
            MapId = _original.Id, CellSizeInPixels = 70, Columns = 11, Rows = 8,
            LineColor = "#123456", LineOpacity = 0.6, OffsetX = 8, OffsetY = 12
        };
        _otherOriginal.Grid = new GridEntity { MapId = _otherOriginal.Id };
        _original.Tokens.Add(new MapTokenEntity { Name = "Legacy token", CurrentHp = 5, MaxHp = 5 });
        _original.ActiveSpells.Add(new ActiveSpellEffectEntity { SpellIndex = "fog", SpellName = "Legacy fog" });
        _context.Users.Add(_user);
        _context.Maps.AddRange(_original, _otherOriginal);
        _context.Monsters.Add(new DndMonsterEntity
        {
            Index = "goblin", Name = "Goblin", HitPoints = 7, ArmorClass = 15, Size = "Small"
        });
        _context.SaveChanges();

        _sessions = new GameSessionService(_context);
        _maps = new MapService(_context, new TestEnvironment(_webRoot));
        _tokens = new TokenService(_context);
    }

    [Fact]
    public async Task NewGamesHaveIndependentMapsGridsTokensAndSpells()
    {
        var first = await CreateSessionAsync("First");
        var second = await CreateSessionAsync("Second");
        var firstMapId = first.ActiveMapId!.Value;
        var secondMapId = second.ActiveMapId!.Value;

        Assert.NotEqual(_original.Id, firstMapId);
        Assert.NotEqual(firstMapId, secondMapId);
        var firstMap = await _maps.GetMapByIdAsync(firstMapId);
        var secondMap = await _maps.GetMapByIdAsync(secondMapId);
        Assert.NotNull(firstMap);
        Assert.NotNull(secondMap);
        Assert.Equal(_original.ImageUrl, firstMap.ImageUrl);
        Assert.Equal(_original.WidthInPixels, firstMap.WidthInPixels);
        Assert.Equal(_original.HeightInPixels, firstMap.HeightInPixels);
        Assert.NotNull(firstMap.Grid);
        Assert.NotNull(secondMap.Grid);
        Assert.NotEqual(_original.Grid!.Id, firstMap.Grid.Id);
        Assert.NotEqual(firstMap.Grid.Id, secondMap.Grid.Id);
        Assert.Equal(8, firstMap.Grid.OffsetX);
        Assert.Equal(12, firstMap.Grid.OffsetY);
        Assert.Equal("#123456", firstMap.Grid.LineColor);
        Assert.Equal(0.6, firstMap.Grid.LineOpacity);
        Assert.Empty(firstMap.Tokens);
        Assert.Empty(firstMap.ActiveSpells);
        Assert.Empty(secondMap.Tokens);

        var grid = await _context.Grids.SingleAsync(item => item.MapId == firstMapId);
        grid.CellSizeInPixels = 35;
        grid.OffsetX = 42;
        _context.ActiveSpellEffects.Add(new ActiveSpellEffectEntity
        {
            MapId = firstMapId, SpellIndex = "fire", SpellName = "Session fire"
        });
        await _context.SaveChangesAsync();
        var token = await _tokens.SpawnMonsterTokenAsync(firstMapId,
            new SpawnMonsterTokenDto("goblin", first.Id, 3, 4));
        Assert.NotNull(token);
        await _tokens.MoveTokenAsync(token.Id, 6, 7);
        await _tokens.UpdateHpAsync(token.Id, 2);

        firstMap = await _maps.GetMapByIdAsync(firstMapId);
        secondMap = await _maps.GetMapByIdAsync(secondMapId);
        var original = await _maps.GetMapByIdAsync(_original.Id);
        Assert.Equal(35, firstMap!.Grid!.CellSizeInPixels);
        Assert.Equal(42, firstMap.Grid.OffsetX);
        var movedToken = Assert.Single(firstMap.Tokens);
        Assert.Equal(6, movedToken.GridX);
        Assert.Equal(2, movedToken.CurrentHp);
        Assert.Single(firstMap.ActiveSpells);
        Assert.Equal(70, secondMap!.Grid!.CellSizeInPixels);
        Assert.Equal(8, secondMap.Grid.OffsetX);
        Assert.Empty(secondMap.Tokens);
        Assert.Empty(secondMap.ActiveSpells);
        Assert.Equal(70, original!.Grid!.CellSizeInPixels);
        Assert.Equal("Legacy token", Assert.Single(original.Tokens).Name);
        Assert.Equal("Legacy fog", Assert.Single(original.ActiveSpells).SpellName);
        var library = await _maps.GetAllMapsAsync();
        Assert.Equal(2, library.Count);
        Assert.DoesNotContain(library, map => map.Id == firstMapId || map.Id == secondMapId);
        Assert.Equal(new byte[] { 1, 2, 3 }, File.ReadAllBytes(Path.Combine(_webRoot, "map.png")));
        Assert.Single(Directory.GetFiles(_webRoot));
    }

    [Fact]
    public async Task SwitchingMapsReusesOnlyTheCurrentSessionsCopies()
    {
        var session = await CreateSessionAsync("First");
        var otherSession = await CreateSessionAsync("Second");
        var firstMapId = session.ActiveMapId!.Value;
        var auxiliaryMapId = await _sessions.CopyMapToSessionAsync(session.Id, _otherOriginal.Id);

        Assert.Equal(firstMapId, (await _sessions.GetSessionByIdAsync(session.Id))!.ActiveMapId);
        Assert.NotEqual(_otherOriginal.Id, auxiliaryMapId);
        Assert.True(await _sessions.SwitchActiveMapAsync(session.Id, _otherOriginal.Id));
        Assert.Equal(auxiliaryMapId, (await _sessions.GetSessionByIdAsync(session.Id))!.ActiveMapId);
        Assert.True(await _sessions.SwitchActiveMapAsync(session.Id, _original.Id));
        Assert.Equal(firstMapId, (await _sessions.GetSessionByIdAsync(session.Id))!.ActiveMapId);
        Assert.True(await _sessions.SwitchActiveMapAsync(session.Id, auxiliaryMapId));
        Assert.Equal(2, await _context.SessionMaps.CountAsync(map => map.GameSessionId == session.Id));
        Assert.False(await _sessions.SwitchActiveMapAsync(otherSession.Id, auxiliaryMapId));
        Assert.Equal(otherSession.ActiveMapId, (await _sessions.GetSessionByIdAsync(otherSession.Id))!.ActiveMapId);
    }

    [Fact]
    public async Task TokenPlacementRejectsLibraryMapsAndOtherSessionsCopies()
    {
        var first = await CreateSessionAsync("First");
        var second = await CreateSessionAsync("Second");
        var spawn = new SpawnMonsterTokenDto("goblin", second.Id, 1, 1);
        var place = new PlaceCharacterTokenDto(Guid.NewGuid(), second.Id, 1, 1);

        Assert.Null(await _tokens.SpawnMonsterTokenAsync(_original.Id, spawn));
        Assert.Null(await _tokens.SpawnMonsterTokenAsync(first.ActiveMapId!.Value, spawn));
        Assert.Null(await _tokens.PlaceCharacterTokenAsync(_original.Id, place));
        Assert.Null(await _tokens.PlaceCharacterTokenAsync(first.ActiveMapId.Value, place));
        Assert.NotNull(await _tokens.SpawnMonsterTokenAsync(second.ActiveMapId!.Value, spawn));
    }

    [Fact]
    public async Task InvalidInitialMapDoesNotCreateAHalfFinishedSession()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sessions.CreateSessionAsync(
            new CreateSessionDto("Invalid", _user.Id, Guid.NewGuid())));

        Assert.Empty(await _context.GameSessions.ToListAsync());
        Assert.Empty(await _context.SessionMaps.ToListAsync());
        var session = await _sessions.CreateSessionAsync(new CreateSessionDto("Empty", _user.Id));
        Assert.Null(session.ActiveMapId);
        Assert.True(await _sessions.SwitchActiveMapAsync(session.Id, _original.Id));
        Assert.NotEqual(_original.Id, (await _sessions.GetSessionByIdAsync(session.Id))!.ActiveMapId);
    }

    private Task<GameSessionDto> CreateSessionAsync(string name) =>
        _sessions.CreateSessionAsync(new CreateSessionDto(name, _user.Id, _original.Id));

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
        Directory.Delete(_webRoot, true);
    }

    private sealed class TestEnvironment(string root) : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "GameMapBackend.Tests";
        public string EnvironmentName { get; set; } = "Development";
        public string ContentRootPath { get; set; } = root;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = root;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    }
}