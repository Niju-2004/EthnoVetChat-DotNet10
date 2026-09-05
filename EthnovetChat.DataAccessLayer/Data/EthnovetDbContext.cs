using Microsoft.EntityFrameworkCore;
using EthnovetChat.DataAccessLayer.Models;

namespace EthnovetChat.DataAccessLayer.Data
{
    public class EthnovetDbContext : DbContext
    {
        public EthnovetDbContext(DbContextOptions<EthnovetDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<PersistentSession> Sessions => Set<PersistentSession>();
        public DbSet<PersistentMessage> Messages => Set<PersistentMessage>();
        public DbSet<DiseaseAnalytic> DiseaseAnalytics => Set<DiseaseAnalytic>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Users indexes
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // Session indexes & relationships
            modelBuilder.Entity<PersistentSession>()
                .HasIndex(s => s.SessionId)
                .IsUnique();

            modelBuilder.Entity<PersistentSession>()
                .HasOne(s => s.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Message relationships
            modelBuilder.Entity<PersistentMessage>()
                .HasOne(m => m.Session)
                .WithMany(s => s.Messages)
                .HasForeignKey(m => m.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Disease analytics
            modelBuilder.Entity<DiseaseAnalytic>()
                .HasIndex(d => d.DiseaseName)
                .IsUnique();
        }
    }
}

