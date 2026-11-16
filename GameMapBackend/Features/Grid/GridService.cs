using Microsoft.EntityFrameworkCore;
using GameMapBackend.Data;

namespace GameMapBackend.Features.Grid;

public interface IGridService
{
    Task<GridDto?> GetGridByMapIdAsync(Guid mapId);
    Task<GridDto?> UpdateGridAsync(Guid mapId, UpdateGridDto dto);
}

public class GridService : IGridService
{
    private readonly AppDbContext _context;

    public GridService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<GridDto?> GetGridByMapIdAsync(Guid mapId)
    {
        var grid = await _context.Grids
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.MapId == mapId);

        return grid == null ? null : MapToDto(grid);
    }

    public async Task<GridDto?> UpdateGridAsync(Guid mapId, UpdateGridDto dto)
    {
        var grid = await _context.Grids.FirstOrDefaultAsync(g => g.MapId == mapId);
        if (grid == null) return null;

        var map = await _context.Maps.FindAsync(mapId);
        int mapWidth = map?.WidthInPixels ?? 2000;
        int mapHeight = map?.HeightInPixels ?? 2000;

        int safeCellSize = Math.Max(20, dto.CellSizeInPixels);

        grid.CellSizeInPixels = safeCellSize;
        grid.Columns = (int)Math.Ceiling((double)mapWidth / safeCellSize);
        grid.Rows = (int)Math.Ceiling((double)mapHeight / safeCellSize);
        grid.LineColor = dto.LineColor;
        grid.LineOpacity = Math.Clamp(dto.LineOpacity, 0.0, 1.0);
        grid.OffsetX = dto.OffsetX;
        grid.OffsetY = dto.OffsetY;


        await _context.SaveChangesAsync();
        return MapToDto(grid);
    }

    private static GridDto MapToDto(GridEntity g) => new(
        g.Id,
        g.MapId,
        g.CellSizeInPixels,
        g.Columns,
        g.Rows,
        g.LineColor,
        g.LineOpacity,
        g.OffsetX,
        g.OffsetY
    );
}
