using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EthnovetChat.DataAccessLayer.Models
{
    [Table("disease_analytics")]
    public class DiseaseAnalytic
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("disease_name")]
        public string DiseaseName { get; set; } = string.Empty;

        [Column("query_count")]
        public int QueryCount { get; set; } = 1;

        [Column("last_queried_at")]
        public DateTime LastQueriedAt { get; set; } = DateTime.UtcNow;
    }
}

