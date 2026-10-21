using Microsoft.EntityFrameworkCore;
using GameMapBackend.Features.Character;
using GameMapBackend.Features.Compendium;
using GameMapBackend.Features.GameSession;
using GameMapBackend.Features.Grid;
using GameMapBackend.Features.Map;
using GameMapBackend.Features.Spell;
using GameMapBackend.Features.Token;
using GameMapBackend.Features.User;

namespace GameMapBackend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<SessionMapEntity> SessionMaps => Set<SessionMapEntity>();
    public DbSet<MapEntity> Maps => Set<MapEntity>();
    public DbSet<GridEntity> Grids => Set<GridEntity>();
    public DbSet<GameSessionEntity> GameSessions => Set<GameSessionEntity>();
    public DbSet<SessionParticipantEntity> SessionParticipants => Set<SessionParticipantEntity>();

    public DbSet<CharacterEntity> Characters => Set<CharacterEntity>();
    public DbSet<MapTokenEntity> MapTokens => Set<MapTokenEntity>();
    public DbSet<ActiveSpellEffectEntity> ActiveSpellEffects => Set<ActiveSpellEffectEntity>();

    public DbSet<DndSpellEntity> Spells => Set<DndSpellEntity>();
    public DbSet<DndMonsterEntity> Monsters => Set<DndMonsterEntity>();
    public DbSet<DndClassEntity> Classes => Set<DndClassEntity>();
    public DbSet<DndRaceEntity> Races => Set<DndRaceEntity>();
    public DbSet<DndConditionEntity> Conditions => Set<DndConditionEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<MapEntity>()
            .HasOne(m => m.Grid)
            .WithOne(g => g.Map)
            .HasForeignKey<GridEntity>(g => g.MapId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MapEntity>()
            .HasMany(m => m.Tokens)
            .WithOne(t => t.Map)
            .HasForeignKey(t => t.MapId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MapEntity>()
            .HasMany(m => m.ActiveSpells)
            .WithOne(s => s.Map)
            .HasForeignKey(s => s.MapId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GameSessionEntity>()
            .HasOne(session => session.DungeonMaster)
            .WithMany(user => user.GameSessions)
            .HasForeignKey(session => session.DungeonMasterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
