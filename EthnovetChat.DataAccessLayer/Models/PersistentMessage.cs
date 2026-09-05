using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EthnovetChat.DataAccessLayer.Models
{
    [Table("chat_messages")]
    public class PersistentMessage
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("session_id")]
        public Guid SessionId { get; set; }

        [ForeignKey("SessionId")]
        public PersistentSession? Session { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("role")]
        public string Role { get; set; } = "user";

        [Required]
        [Column("content")]
        public string Content { get; set; } = string.Empty;

        [Column("relevant_remedies_json", TypeName = "jsonb")]
        public string? RelevantRemediesJson { get; set; }

        [Column("is_ai_generated")]
        public bool IsAiGenerated { get; set; } = false;

        [Column("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}

