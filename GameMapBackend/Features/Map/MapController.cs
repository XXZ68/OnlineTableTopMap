using Microsoft.AspNetCore.Mvc;
using SkiaSharp;

namespace GameMapBackend.Features.Map;

/// <summary>
/// Manages battlemaps, file uploads, and map data retrieval.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MapController : ControllerBase
{
    private readonly IMapService _mapService;

    public MapController(IMapService mapService)
    {
        _mapService = mapService;
    }

    /// <summary>
    /// Retrieves a list of all uploaded maps (summary metadata).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<MapSummaryDto>>> GetAll() =>
        Ok(await _mapService.GetAllMapsAsync());

    /// <summary>
    /// Retrieves full map details including its grid, tokens, and active spells.
    /// </summary>
    /// <param name="id">The unique identifier of the map.</param>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MapDetailDto>> GetById(Guid id)
    {
        var map = await _mapService.GetMapByIdAsync(id);
        return map == null ? NotFound() : Ok(map);
    }

    /// <summary>
    /// Uploads a new battlemap image file and generates its default grid configuration.
    /// </summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<MapDetailDto>> Create([FromForm] CreateMapDto dto, IFormFile image)
    {
        var allowedExtensions = new[] { ".jpg", ".png", ".webp", ".jpeg" };

        if (image == null || image.Length == 0)
        {
            return BadRequest("Please upload an image for the map.");
        }

        if (image.Length > 20 * 1024 * 1024) // 20MB
        {
            return BadRequest("File size exceeds limit. MAX: 20MB");
        }

        string fileExtension = Path.GetExtension(image.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return BadRequest("Not supported image format. Pleas use JPG, JPEG, PNG or WebP.");
        }

        if (dto.InitialCellSize <= 0)
        {
            return BadRequest("Cell size must be bigger than 0.");
        }

        await using (var stream = image.OpenReadStream())
        {
            using var codec = SKCodec.Create(stream);
            if (codec is null)
            {
                return BadRequest("Invalid or corrupted image.");
            }

            var allowedFormats = new[]
            {
                SKEncodedImageFormat.Jpeg,
                SKEncodedImageFormat.Png,
                SKEncodedImageFormat.Webp
            };

            if (!allowedFormats.Contains(codec.EncodedFormat))
            {
                return BadRequest("Not supported image format. Pleas use JPG, JPEG, PNG or WebP.");
            }
        }

        var created = await _mapService.CreateMapAsync(dto, image);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Deletes a battlemap and cascades the removal of its grid, tokens, and spells.
    /// </summary>
    /// <param name="id">The unique identifier of the map.</param>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _mapService.DeleteMapAsync(id);
        return success ? NoContent() : NotFound();
    }
}
