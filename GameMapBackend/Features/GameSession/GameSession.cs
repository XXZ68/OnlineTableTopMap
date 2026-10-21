using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using GameMapBackend.Features.Map;
using GameMapBackend.Features.User;

namespace GameMapBackend.Features.GameSession;

[Table("GameSessions")]
public class GameSessionEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string SessionName { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string JoinCode { get; set; } = string.Empty;

    public Guid DungeonMasterId { get; set; }

    [ForeignKey(nameof(DungeonMasterId))]
    public UserEntity? DungeonMaster { get; set; }

    public Guid? ActiveMapId { get; set; }

    [ForeignKey(nameof(ActiveMapId))]
    public MapEntity? ActiveMap { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<SessionParticipantEntity> Participants { get; set; } = new();
}

[Table("SessionParticipants")]
public class SessionParticipantEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid GameSessionId { get; set; }

    [ForeignKey(nameof(GameSessionId))]
    public GameSessionEntity? GameSession { get; set; }

    [Required]
    [MaxLength(100)]
    public string PlayerId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string PlayerName { get; set; } = string.Empty;

    public Guid? SelectedCharacterId { get; set; }

    public bool IsDungeonMaster { get; set; } = false;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
