using Microsoft.EntityFrameworkCore;
using PatiLink.Api.Models;

namespace PatiLink.Api.Data;

/// <summary>
/// PatiLink database context class.
/// Provides the bridge between Entity Framework Core and SQL Server / SQLite.
/// All database tables are represented by the DbSet properties here.
/// </summary>
public class PatiLinkDbContext : DbContext
{
    public PatiLinkDbContext(DbContextOptions<PatiLinkDbContext> options) : base(options)
    {
    }

    // --- Database Tables ---
    public DbSet<UserProfile> Users => Set<UserProfile>();
    public DbSet<LocationPoint> Locations => Set<LocationPoint>();
    public DbSet<Animal> Animals => Set<Animal>();
    public DbSet<CareTask> Tasks => Set<CareTask>();
    public DbSet<TaskLog> TaskLogs => Set<TaskLog>();
    public DbSet<HealthLog> HealthLogs => Set<HealthLog>();
    public DbSet<Need> Needs => Set<Need>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<NotificationItem> Notifications => Set<NotificationItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Email uniqueness constraint
        modelBuilder.Entity<UserProfile>()
            .HasIndex(u => u.Email)
            .IsUnique();
    }
}
