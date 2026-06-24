using Microsoft.EntityFrameworkCore;
using PatiLink.Api.Data;
using PatiLink.Api.Models;

namespace PatiLink.Api.Services;

/// <summary>
/// 6-Hour Care Rule Background Service:
/// Runs every 15 minutes, checks locations that haven't been fed in the last 6 hours,
/// marks their status as "Hungry" and sets their urgency to "Critical".
/// Also creates a notification for the administrator.
/// </summary>
public class CareStatusBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CareStatusBackgroundService> _logger;

    // Check interval: Runs every 15 minutes
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(15);

    // Hunger threshold: Animals not fed for 6 hours become "Hungry"
    private static readonly TimeSpan HungerThreshold = TimeSpan.FromHours(6);

    public CareStatusBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<CareStatusBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🐾 CareStatusBackgroundService started. Check interval: {Interval} minutes", CheckInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndUpdateCareStatusAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while running CareStatusBackgroundService.");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }

    private async Task CheckAndUpdateCareStatusAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PatiLinkDbContext>();

        var now = DateTime.UtcNow;
        var threshold = now - HungerThreshold;

        // Fetch all locations
        var locations = await db.Locations.ToListAsync(ct);
        var updatedCount = 0;

        foreach (var location in locations)
        {
            // Check the last completed feeding task log for this location
            var lastFeedingLog = await db.TaskLogs
                .Join(db.Tasks, log => log.TaskId, task => task.Id, (log, task) => new { log, task })
                .Where(x => x.task.LocationId == location.Id
                         && x.task.TaskType.ToLower().Contains("feed")
                         && x.log.QrVerified)
                .OrderByDescending(x => x.log.CompletedAt)
                .Select(x => x.log.CompletedAt)
                .FirstOrDefaultAsync(ct);

            // If there is no completed feeding task, or it is older than 6 hours
            bool isHungry = lastFeedingLog == default || lastFeedingLog < threshold;

            if (isHungry && location.CareStatus != "Hungry")
            {
                location.CareStatus = "Hungry";
                location.LastCareAt = lastFeedingLog == default ? null : lastFeedingLog;

                // Update all animals at this location
                var animalsAtLocation = await db.Animals
                    .Where(a => a.LocationId == location.Id && a.CareStatus != "In Treatment")
                    .ToListAsync(ct);

                foreach (var animal in animalsAtLocation)
                {
                    if (animal.CareStatus != "Hungry")
                    {
                        animal.CareStatus = "Hungry";
                        animal.Urgency = "Critical";
                        updatedCount++;
                    }

                    // Automatically create a "Food" need if it does not already exist
                    bool hasPendingFoodNeed = await db.Needs.AnyAsync(n => n.AnimalId == animal.Id && n.NeedType == "Food" && n.Status != "Fulfilled", ct);
                    if (!hasPendingFoodNeed)
                    {
                        string amount = animal.Species.Contains("Dog", StringComparison.OrdinalIgnoreCase) ? "4 kg" : "2 kg";
                        db.Needs.Add(new Need
                        {
                            AnimalId = animal.Id,
                            NeedType = "Food",
                            Description = "Automatic Alert: Urgent food needed because the animal has not been fed for 6 hours.",
                            Amount = amount,
                            Urgency = "Critical",
                            Status = "Pending",
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // Automatically create a "Feeding" task if it does not already exist
                    bool hasOpenFeedingTask = await db.Tasks.AnyAsync(t => t.AnimalId == animal.Id && t.TaskType.ToLower().Contains("feed") && t.Status != "Completed", ct);
                    if (!hasOpenFeedingTask)
                    {
                        db.Tasks.Add(new CareTask
                        {
                            AnimalId = animal.Id,
                            LocationId = location.Id,
                            TaskType = "Emergency Feeding",
                            Status = "Open",
                            AssignedUserId = null,
                            DueAt = DateTime.UtcNow.AddHours(2),
                            CreatedAt = DateTime.UtcNow,
                            Note = "Automatic Task: Urgent feeding task created because the animal has not been fed for 6 hours."
                        });
                    }
                }

                // Create a notification for the administrator
                db.Notifications.Add(new NotificationItem
                {
                    UserId = 1, // Admin user
                    Title = "⚠️ Emergency Feeding Required",
                    Message = $"No feeding has been done at {location.Name} for more than 6 hours! {animalsAtLocation.Count} animals are hungry.",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Automatic Water need refresh (every 6 hours)
        var allAnimals = await db.Animals.ToListAsync(ct);
        foreach (var animal in allAnimals)
        {
            bool hasPendingWaterNeed = await db.Needs.AnyAsync(n => 
                n.AnimalId == animal.Id && 
                (n.NeedType == "Water" || n.NeedType == "water") && 
                n.Status != "Fulfilled", ct);
            
            if (!hasPendingWaterNeed)
            {
                var lastWaterNeedCreated = await db.Needs
                    .Where(n => n.AnimalId == animal.Id && (n.NeedType == "Water" || n.NeedType == "water") && n.Status == "Fulfilled")
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => n.CreatedAt)
                    .FirstOrDefaultAsync(ct);
                
                if (lastWaterNeedCreated == default || lastWaterNeedCreated < now.AddHours(-6))
                {
                    db.Needs.Add(new Need
                    {
                        AnimalId = animal.Id,
                        NeedType = "Water",
                        Description = "Routine Notification: Clean the water bowl and fill it with fresh water.",
                        Amount = "Every 6 hours",
                        Urgency = "Routine",
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow
                    });
                    updatedCount++;
                }
            }
        }

        if (updatedCount > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogWarning("⚠️ Database state updates and automatic needs saved (Updated count: {Count}).", updatedCount);
        }
    }
}
