using Microsoft.EntityFrameworkCore;
using GameMapBackend.Data;
using GameMapBackend.Features.Grid;
using GameMapBackend.Features.Spell;
using GameMapBackend.Features.Token;

namespace GameMapBackend.Features.Map;

public interface IMapService
{
    Task<List<MapSummaryDto>> GetAllMapsAsync();
    Task<MapDetailDto?> GetMapByIdAsync(Guid id);
    Task<MapDetailDto> CreateMapAsync(CreateMapDto dto, IFormFile imageFile);
    Task<bool> DeleteMapAsync(Guid id);
}

public class MapService : IMapService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public MapService(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    public async Task<List<MapSummaryDto>> GetAllMapsAsync()
    {
        var maps = await _context.Maps
            .AsNoTracking()
            .Where(map => !_context.SessionMaps.Any(copy => copy.Id == map.Id))
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new MapSummaryDto(
                m.Id,
                m.Title,
                m.ImageUrl,
                m.WidthInPixels,
                m.HeightInPixels,
                m.CreatedAt))
            .ToListAsync();

        var missingMapIds = new List<Guid>();

        foreach (var map in maps)
        {
            var filePath = Path.Combine(
                _env.WebRootPath,
                map.ImageUrl.TrimStart('/')
            );

            if (!File.Exists(filePath))
            {
                missingMapIds.Add(map.Id);
            }
        }

        if (missingMapIds.Count > 0)
        {
            await _context.Maps
                .Where(m => missingMapIds.Contains(m.Id))
                .ExecuteDeleteAsync();

            maps = maps
                .Where(m => !missingMapIds.Contains(m.Id))
                .ToList();
        }

        return maps;
    }

    public async Task<MapDetailDto?> GetMapByIdAsync(Guid id)
    {
        var map = await _context.Maps
            .AsNoTracking()
            .Include(m => m.Grid)
            .Include(m => m.Tokens)
            .Include(m => m.ActiveSpells)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (map == null) return null;

        var filePath = Path.Combine(
            _env.WebRootPath,
            map.ImageUrl.TrimStart('/')
        );
        if (!File.Exists(filePath))
        {
            _context.Maps.Remove(map);
            await _context.SaveChangesAsync();
            return null;
        }

        return new MapDetailDto(
            map.Id,
            map.Title,
            map.ImageUrl,
            map.WidthInPixels,
            map.HeightInPixels,
            map.Grid == null ? null : new GridDto(
                map.Grid.Id,
                map.Grid.MapId,
                map.Grid.CellSizeInPixels,
                map.Grid.Columns,
                map.Grid.Rows,
                map.Grid.LineColor,
                map.Grid.LineOpacity,
                map.Grid.OffsetX,
                map.Grid.OffsetY
            ),
            map.Tokens.Select(t => new MapTokenDto(
                t.Id,
                t.MapId,
                t.CharacterId,
                t.GameSessionId,
                t.MonsterIndex,
                t.Name,
                t.TokenImageUrl,
                t.GridX,
                t.GridY,
                t.SizeInCells,
                t.CurrentHp,
                t.MaxHp,
                t.ArmorClass,
                t.IsVisibleToPlayers,
                t.IsLocked
            )).ToList(),
            map.ActiveSpells.Select(s => new ActiveSpellDto(
                s.Id,
                s.MapId,
                s.SpellIndex,
                s.SpellName,
                s.OriginGridX,
                s.OriginGridY,
                s.RadiusInCells,
                s.Shape,
                s.ColorHex,
                s.RequiresConcentration,
                s.CasterCharacterId
            )).ToList()
        );
    }

    public async Task<MapDetailDto> CreateMapAsync(CreateMapDto dto, IFormFile imageFile)
    {
        var uploadsFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "maps");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var fileExtension = Path.GetExtension(imageFile.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await imageFile.CopyToAsync(stream);
        }

        int defaultWidth = 2000;
        int defaultHeight = 2000;
        int cellSize = dto.InitialCellSize > 0 ? dto.InitialCellSize : 70;

        var map = new MapEntity
        {
            Title = dto.Title,
            ImageUrl = $"/maps/{uniqueFileName}",
            WidthInPixels = defaultWidth,
            HeightInPixels = defaultHeight
        };

        var grid = new GridEntity
        {
            MapId = map.Id,
            CellSizeInPixels = cellSize,
            Columns = defaultWidth / cellSize,
            Rows = defaultHeight / cellSize,
            LineColor = "#000000",
            LineOpacity = 0.4,
            OffsetX = 0,
            OffsetY = 0
        };

        map.Grid = grid;
        _context.Maps.Add(map);
        await _context.SaveChangesAsync();

        return (await GetMapByIdAsync(map.Id))!;
    }

    public async Task<bool> DeleteMapAsync(Guid id)
    {
        var map = await _context.Maps.FindAsync(id);
        if (map == null) return false;
        var filePath = Path.Combine(
            _env.WebRootPath,
            map.ImageUrl.TrimStart('/')
        );
        if (!File.Exists(filePath)) return false;

        _context.Maps.Remove(map);
        await _context.SaveChangesAsync();
        return true;
    }
}
