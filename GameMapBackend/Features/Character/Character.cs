using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GameMapBackend.Features.Character;

[Table("Characters")]
public class CharacterEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid GameSessionId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? TokenImageUrl { get; set; }

    [Required]
    [MaxLength(100)]
    public string OwnerPlayerId { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? PasswordHash { get; set; }

    public string? ClassIndex { get; set; }
    public string? RaceIndex { get; set; }

    public int Level { get; set; } = 1;
    public int MaxHp { get; set; } = 10;
    public int CurrentHp { get; set; } = 10;
    public int ArmorClass { get; set; } = 10;
    public int SpeedInFeet { get; set; } = 30;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
