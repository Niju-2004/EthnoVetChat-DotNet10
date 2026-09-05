using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EthnovetChat.DataAccessLayer.Models
{
    [Table("chat_sessions")]
    public class PersistentSession
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        [Column("session_id")]
        public string SessionId { get; set; } = string.Empty;

        [Column("user_id")]
        public Guid? UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("title")]
        public string Title { get; set; } = "New Consultation";

        [MaxLength(50)]
        [Column("persisted_animal")]
        public string? PersistedAnimal { get; set; }

        [Required]
        [MaxLength(5)]
        [Column("persisted_language")]
        public string PersistedLanguage { get; set; } = "en";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("last_active_at")]
        public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

        public ICollection<PersistentMessage> Messages { get; set; } = new List<PersistentMessage>();
    }
}

