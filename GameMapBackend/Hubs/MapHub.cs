using Microsoft.AspNetCore.SignalR;
using GameMapBackend.Features.Grid;
using GameMapBackend.Features.Spell;
using GameMapBackend.Features.Token;

namespace GameMapBackend.Hubs;

/// <summary>
/// Real-time SignalR Hub managing live multiplayer synchronization across battlemaps and sessions.
/// </summary>
public class MapHub : Hub<IMapClient>
{
    private readonly ITokenService _tokenService;
    private readonly IGridService _gridService;
    private readonly ISpellService _spellService;

    public MapHub(
        ITokenService tokenService,
        IGridService gridService,
        ISpellService spellService)
    {
        _tokenService = tokenService;
        _gridService = gridService;
        _spellService = spellService;
    }

    // =========================================================================
    // SESSION MANAGEMENT
    // =========================================================================

    public async Task JoinSession(string sessionId, string playerId, string playerName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        await Clients.OthersInGroup(sessionId).PlayerJoined(playerId, playerName);
    }

    public async Task LeaveSession(string sessionId, string playerId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
        await Clients.OthersInGroup(sessionId).PlayerLeft(playerId);
    }

    // =========================================================================
    // TOKEN ACTIONS
    // =========================================================================

    /// <summary>
    /// Places a player character token on the map and broadcasts TokenSpawned.
    /// </summary>
    public async Task PlaceCharacterToken(string sessionId, Guid mapId, PlaceCharacterTokenDto dto)
    {
        var token = await _tokenService.PlaceCharacterTokenAsync(mapId, dto);
        if (token != null)
        {
            await Clients.Group(sessionId).TokenSpawned(token);
        }
    }

    /// <summary>
    /// Spawns a monster token from the compendium and broadcasts TokenSpawned.
    /// </summary>
    public async Task SpawnMonsterToken(string sessionId, Guid mapId, SpawnMonsterTokenDto dto)
    {
        var token = await _tokenService.SpawnMonsterTokenAsync(mapId, dto);
        if (token != null)
        {
            await Clients.Group(sessionId).TokenSpawned(token);
        }
    }

    /// <summary>
    /// Moves a token to new grid coordinates and broadcasts TokenMoved.
    /// </summary>
    public async Task MoveToken(string sessionId, Guid tokenId, int targetX, int targetY)
    {
        var updated = await _tokenService.MoveTokenAsync(tokenId, targetX, targetY);
        if (updated != null)
        {
            await Clients.Group(sessionId).TokenMoved(tokenId, targetX, targetY);
        }
    }

    /// <summary>
    /// Updates a token's HP (clamped between 0 and MaxHp) and broadcasts TokenHpChanged.
    /// </summary>
    public async Task UpdateTokenHp(string sessionId, Guid tokenId, int newHp)
    {
        var updated = await _tokenService.UpdateHpAsync(tokenId, newHp);
        if (updated != null)
        {
            await Clients.Group(sessionId).TokenHpChanged(tokenId, updated.CurrentHp);
        }
    }

    /// <summary>
    /// Deletes a token from the map and broadcasts TokenRemoved.
    /// </summary>
    public async Task RemoveToken(string sessionId, Guid tokenId)
    {
        var deleted = await _tokenService.DeleteTokenAsync(tokenId);
        if (deleted)
        {
            await Clients.Group(sessionId).TokenRemoved(tokenId);
        }
    }

    // =========================================================================
    // SPELL ACTIONS
    // =========================================================================

    /// <summary>
    /// Triggers a spell cast, calculates areas/concentration, and broadcasts SpellCasted.
    /// </summary>
    public async Task CastSpell(string sessionId, Guid mapId, CastSpellDto dto)
    {
        var spellEvent = await _spellService.CastSpellAsync(mapId, dto);
        if (spellEvent != null)
        {
            await Clients.Group(sessionId).SpellCasted(spellEvent);
        }
    }

    /// <summary>
    /// Dismisses an active concentration/persistent spell and broadcasts SpellDismissed.
    /// </summary>
    public async Task DismissSpell(string sessionId, Guid activeSpellEffectId)
    {
        var dismissed = await _spellService.DismissActiveSpellAsync(activeSpellEffectId);
        if (dismissed)
        {
            await Clients.Group(sessionId).SpellDismissed(activeSpellEffectId);
        }
    }

    // =========================================================================
    // GRID & MAP ACTIONS
    // =========================================================================

    /// <summary>
    /// Modifies grid parameters (offsets, opacity, size) and broadcasts GridUpdated.
    /// </summary>
    public async Task UpdateGrid(string sessionId, Guid mapId, UpdateGridDto dto)
    {
        var updatedGrid = await _gridService.UpdateGridAsync(mapId, dto);
        if (updatedGrid != null)
        {
            await Clients.Group(sessionId).GridUpdated(updatedGrid);
        }
    }

    /// <summary>
    /// Broadcasts to all players in the session that the active battlemap changed.
    /// </summary>
    public async Task ChangeMap(string sessionId, Guid newMapId)
    {
        await Clients.Group(sessionId).MapChanged(newMapId);
    }
}
