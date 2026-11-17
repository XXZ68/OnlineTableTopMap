using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using GameMapBackend.Hubs;

namespace GameMapBackend.Features.Character;

/// <summary>
/// Manages campaign characters and player character sheets.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CharacterController : ControllerBase
{
    private readonly ICharacterService _characterService;
    private readonly IHubContext<MapHub, IMapClient> _hubContext;

    public CharacterController(
        ICharacterService characterService,
        IHubContext<MapHub, IMapClient> hubContext)
    {
        _characterService = characterService;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Retrieves all characters created within a specific game session.
    /// </summary>
    /// <param name="sessionId">The unique identifier of the game session.</param>
    [HttpGet("session/{sessionId:guid}")]
    public async Task<ActionResult<List<CharacterDto>>> GetBySession(Guid sessionId) =>
        Ok(await _characterService.GetCharactersBySessionAsync(sessionId));

    /// <summary>
    /// Retrieves a character sheet by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the character.</param>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CharacterDto>> GetById(Guid id)
    {
        var character = await _characterService.GetCharacterByIdAsync(id);
        return character == null ? NotFound() : Ok(character);
    }

    /// <summary>
    /// Creates a new character for a game session.
    /// </summary>
    /// <param name="dto">The initial character configuration data.</param>
    [HttpPost]
    public async Task<ActionResult<CharacterDto>> Create([FromBody] CreateCharacterDto dto)
    {
        var created = await _characterService.CreateCharacterAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Updates an existing character sheet (e.g., stats, Max HP, AC).
    /// </summary>
    /// <param name="id">The unique identifier of the character.</param>
    /// <param name="dto">The updated sheet values.</param>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CharacterDto>> UpdateSheet(Guid id, [FromBody] UpdateCharacterSheetDto dto)
    {
        var updated = await _characterService.UpdateCharacterSheetAsync(id, dto);
        return updated == null ? NotFound() : Ok(updated);
    }

    /// <summary>
    /// Updates the current HP of a character owned by the specified player.
    /// </summary>
    [HttpPatch("{id:guid}/hp")]
    public async Task<ActionResult<CharacterDto>> UpdateHp(
        Guid id,
        [FromQuery] string playerId,
        [FromBody] UpdateCharacterHpDto dto)
    {
        var updated = await _characterService.UpdateCurrentHpAsync(id, playerId, dto.NewHp);
        if (updated == null) return NotFound();

        await _hubContext.Clients.Group(updated.GameSessionId.ToString()).CharacterUpdated(updated);
        return Ok(updated);
    }

    [HttpGet("token-images")]
    public ActionResult<IReadOnlyList<string>> ListTokenImages() =>
    Ok(_characterService.ListTokenImages());

    [HttpPut("{id:guid}/token-image")]
    public async Task<ActionResult<CharacterDto>> SetTokenImage(
        Guid id,
        [FromQuery] string playerId,
        [FromBody] SetTokenImageDto dto)
    {
        var updated = await _characterService.SetTokenImageAsync(id, playerId, dto.Path);
        if (updated == null) return NotFound();

        await _hubContext.Clients.Group(updated.GameSessionId.ToString()).CharacterUpdated(updated);
        return Ok(updated);
    }
    public record SetTokenImageDto(string? Path);

    /// <summary>
    /// Levels up a character and increases its HP by a server-rolled class Hit Die.
    /// </summary>
    [HttpPost("{id:guid}/level-up")]
    public async Task<ActionResult<LevelUpCharacterResult>> LevelUp(
        Guid id,
        [FromQuery] string playerId)
    {
        var result = await _characterService.LevelUpAsync(id, playerId);
        if (result == null) return NotFound("Character not found, not owned by player, or already at level 20.");

        await _hubContext.Clients.Group(result.Character.GameSessionId.ToString())
            .CharacterUpdated(result.Character);
        return Ok(result);
    }

    /// <summary>
    /// Permanently deletes a character from the campaign.
    /// </summary>
    /// <param name="id">The unique identifier of the character.</param>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _characterService.DeleteCharacterAsync(id);
        return success ? NoContent() : NotFound();
    }
}
