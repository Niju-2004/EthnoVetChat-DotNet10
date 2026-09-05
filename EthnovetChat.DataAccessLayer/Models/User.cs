using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EthnovetChat.DataAccessLayer.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(50)]
        [Column("username")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [EmailAddress]
        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("password_hash")]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("role")]
        public string Role { get; set; } = "Farmer";

        [Required]
        [MaxLength(5)]
        [Column("preferred_language")]
        public string PreferredLanguage { get; set; } = "en";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("last_login_at")]
        public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;

        public ICollection<PersistentSession> Sessions { get; set; } = new List<PersistentSession>();
    }
}

