using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using GameMapBackend.Hubs;

namespace GameMapBackend.Features.GameSession;

/// <summary>
/// Manages multiplayer game lobbies, participant joins, and active map transitions.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GameSessionController : ControllerBase
{
    private readonly IGameSessionService _sessionService;
    private readonly IHubContext<MapHub, IMapClient> _hubContext;

    public GameSessionController(IGameSessionService sessionService, IHubContext<MapHub, IMapClient> hubContext)
    {
        _sessionService = sessionService;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Creates a new game session with a generated 6-character room code.
    /// </summary>
    /// <param name="dto">The session configuration details.</param>
    [HttpPost]
    public async Task<ActionResult<GameSessionDto>> Create(
        [FromBody] CreateSessionDto dto)
    {
        try
        {
            var created = await _sessionService.CreateSessionAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = created.Id },
                created);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Returns all game sessions belonging to a Gamemaster.
    /// </summary>
    [HttpGet("by-dungeon-master/{dungeonMasterId:guid}")]
    public async Task<ActionResult<List<GameSessionDto>>>
        GetByDungeonMaster(Guid dungeonMasterId)
    {
        var sessions =
            await _sessionService.GetSessionsByDungeonMasterIdAsync(
                dungeonMasterId);

        return Ok(sessions);
    }

    /// <summary>
    /// Retrieves a game session by its unique ID, including connected participants.
    /// </summary>
    /// <param name="id">The unique identifier of the game session.</param>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GameSessionDto>> GetById(Guid id)
    {
        var session = await _sessionService.GetSessionByIdAsync(id);
        return session == null ? NotFound() : Ok(session);
    }

    /// <summary>
    /// Joins an existing game session using the 6-character room code.
    /// </summary>
    /// <param name="dto">The join parameters (code, player ID, display name, optional character).</param>
    [HttpPost("join")]
    public async Task<ActionResult<GameSessionDto>> Join([FromBody] JoinSessionDto dto)
    {
        var session = await _sessionService.JoinSessionAsync(dto);
        if (session == null) return NotFound("Ungültiger Join-Code.");

        await _hubContext.Clients.Group(session.Id.ToString()).PlayerJoined(dto.PlayerId, dto.PlayerName);
        return Ok(session);
    }


    [HttpPost("{sessionId:guid}/add-map/{mapId:guid}")]
    public async Task<IActionResult> AddMapToSession(Guid sessionId, Guid mapId)
    {
        try
        {
            var sessionMapId = await _sessionService.CopyMapToSessionAsync(sessionId, mapId);
            return Ok(new { SessionMapId = sessionMapId });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Switches the currently displayed battlemap for all players in the session.
    /// </summary>
    /// <param name="id">The unique identifier of the game session.</param>
    /// <param name="newMapId">The unique identifier of the new active map.</param>
    [HttpPatch("{id:guid}/active-map")]
    public async Task<IActionResult> SwitchActiveMap(Guid id, [FromQuery] Guid newMapId)
    {
        var success = await _sessionService.SwitchActiveMapAsync(id, newMapId);
        if (!success) return BadRequest("Kartenwechsel fehlgeschlagen.");

        await _hubContext.Clients.Group(id.ToString()).MapChanged(newMapId);
        return NoContent();
    }
}
