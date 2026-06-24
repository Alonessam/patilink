using PatiLink.Api.Models;

namespace PatiLink.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(PatiLinkDbContext db)
    {
        if (db.Users.Any()) return;

        var hash = BCrypt.Net.BCrypt.HashPassword("123");
        var now = DateTime.UtcNow;

        db.Users.AddRange(
            new UserProfile { Id = 1, FullName = "Admin User", Email = "admin@patilink.edu.tr", PasswordHash = hash, Role = "Admin", Phone = "+90 555 000 0001", CreatedAt = now.AddDays(-30) },
            new UserProfile { Id = 2, FullName = "Veterinarian", Email = "vet@patilink.edu.tr", PasswordHash = hash, Role = "Vet", Phone = "+90 555 000 0002", CreatedAt = now.AddDays(-25) },
            new UserProfile { Id = 3, FullName = "Volunteer Student", Email = "gonullu@patilink.edu.tr", PasswordHash = hash, Role = "Volunteer", Phone = "+90 555 000 0003", CreatedAt = now.AddDays(-20) },
            new UserProfile { Id = 4, FullName = "Manager", Email = "mudur@patilink.edu.tr", PasswordHash = hash, Role = "Admin", CreatedAt = now.AddDays(-28) },
            new UserProfile { Id = 5, FullName = "Ayse Vet", Email = "ayse@patilink.edu.tr", PasswordHash = hash, Role = "Vet", CreatedAt = now.AddDays(-22) },
            new UserProfile { Id = 6, FullName = "Ahmet Volunteer", Email = "ahmet@patilink.edu.tr", PasswordHash = hash, Role = "Volunteer", CreatedAt = now.AddDays(-15) }
        );

        db.Locations.AddRange(
            new LocationPoint { Id = 1, Name = "Faculty of Engineering", Faculty = "Engineering", QrCode = "QR-ENG-001", Description = "Food and water point in the canteen backyard.", CareStatus = "Cared For", LastCareAt = now.AddHours(-2), Latitude = 38.3315, Longitude = 38.4385 },
            new LocationPoint { Id = 2, Name = "Behind the Library", Faculty = "Central", QrCode = "QR-LIB-002", Description = "Shaded area at the right entrance of the library.", CareStatus = "Cared For", LastCareAt = now.AddHours(-7), Latitude = 38.3340, Longitude = 38.4380 },
            new LocationPoint { Id = 3, Name = "Sports Hall", Faculty = "Sports", QrCode = "QR-SPO-003", Description = "Shelter hut behind the sports hall.", CareStatus = "Critical", LastCareAt = now.AddHours(-9), Latitude = 38.3330, Longitude = 38.4355 },
            new LocationPoint { Id = 4, Name = "Faculty of Communication", Faculty = "Communication", QrCode = "QR-COM-004", Description = "Next to the communication canteen.", CareStatus = "Routine", Latitude = 38.3300, Longitude = 38.4405 },
            new LocationPoint { Id = 5, Name = "Central Cafeteria", Faculty = "Central", QrCode = "QR-CAF-005", Description = "Cafeteria backyard area.", CareStatus = "Cared For", LastCareAt = now.AddHours(-1), Latitude = 38.3335, Longitude = 38.4395 }
        );

        var catPhoto = "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=80";
        var dogPhoto = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80";

        db.Animals.AddRange(
            new Animal { Id = 1, Name = "Boncuk", Species = "Cat", Gender = "Female", Description = "A friendly cat living at the entrance of the engineering faculty, accustomed to people.", PhotoUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80", LocationId = 1, CareStatus = "Fed", Urgency = "Routine", CreatedAt = now.AddDays(-20) },
            new Animal { Id = 2, Name = "Karabas", Species = "Dog", Gender = "Male", Description = "A large and calm dog living behind the library.", PhotoUrl = dogPhoto, LocationId = 2, CareStatus = "Hungry", Urgency = "Critical", CreatedAt = now.AddDays(-25) },
            new Animal { Id = 3, Name = "Minnos", Species = "Cat", Gender = "Female", Description = "A young cat wandering around the sports hall.", PhotoUrl = "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80", LocationId = 3, CareStatus = "Routine", Urgency = "Routine", CreatedAt = now.AddDays(-18) },
            new Animal { Id = 4, Name = "Pamuk", Species = "Cat", Gender = "Male", Description = "White fur, blue eyes. Lives behind the library.", PhotoUrl = "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=900&q=80", LocationId = 2, CareStatus = "Fed", Urgency = "Routine", CreatedAt = now.AddDays(-15) },
            new Animal { Id = 5, Name = "Cakil", Species = "Dog", Gender = "Female", Description = "Protective dog living in the engineering parking lot. Has an old wound on its leg.", PhotoUrl = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80", LocationId = 1, CareStatus = "In Treatment", Urgency = "High", CreatedAt = now.AddDays(-22) },
            new Animal { Id = 6, Name = "Duman", Species = "Cat", Gender = "Male", Description = "Gray cat hanging out at the communication faculty canteen.", PhotoUrl = catPhoto, LocationId = 4, CareStatus = "Routine", Urgency = "Routine", CreatedAt = now.AddDays(-12) },
            new Animal { Id = 7, Name = "Zeytin", Species = "Dog", Gender = "Female", Description = "Slightly docile black dog wandering around the cafeteria.", PhotoUrl = "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=900&q=80", LocationId = 5, CareStatus = "Hungry", Urgency = "Critical", CreatedAt = now.AddDays(-10) },
            new Animal { Id = 8, Name = "Tarcin", Species = "Cat", Gender = "Female", Description = "Ginger cat living in the cafeteria backyard.", PhotoUrl = "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80", LocationId = 5, CareStatus = "Fed", Urgency = "Routine", CreatedAt = now.AddDays(-8) }
        );

        db.Tasks.AddRange(
            new CareTask { Id = 1, AnimalId = 2, LocationId = 2, TaskType = "Routine Feeding", AssignedUserId = null, Status = "Open", DueAt = now.AddHours(2), CreatedAt = now.AddHours(-3), Note = "Food check for Karabas behind the library." },
            new CareTask { Id = 2, AnimalId = 7, LocationId = 5, TaskType = "Routine Feeding", AssignedUserId = null, Status = "Open", DueAt = now.AddHours(1), CreatedAt = now.AddHours(-4), Note = "Food check for Zeytin in the cafeteria backyard." },
            new CareTask { Id = 3, AnimalId = 5, LocationId = 1, TaskType = "Take to Vet", AssignedUserId = 6, Status = "Assigned", DueAt = now.AddHours(4), CreatedAt = now.AddHours(-2), Note = "Cakil's leg wound needs to be checked." },
            new CareTask { Id = 4, AnimalId = 1, LocationId = 1, TaskType = "Routine Feeding", AssignedUserId = null, Status = "Open", DueAt = now.AddHours(3), CreatedAt = now.AddHours(-6), Note = "Routine feeding for Boncuk at the engineering entrance." },
            new CareTask { Id = 5, AnimalId = 3, LocationId = 3, TaskType = "Routine Feeding", AssignedUserId = null, Status = "Open", DueAt = now.AddHours(3), CreatedAt = now.AddHours(-6), Note = "Routine feeding for Minnos at the sports hall." },
            new CareTask { Id = 6, AnimalId = 4, LocationId = 2, TaskType = "Routine Feeding", AssignedUserId = null, Status = "Open", DueAt = now.AddHours(3), CreatedAt = now.AddHours(-6), Note = "Routine feeding for Pamuk behind the library." },
            new CareTask { Id = 7, AnimalId = 6, LocationId = 4, TaskType = "Routine Feeding", AssignedUserId = null, Status = "Open", DueAt = now.AddHours(3), CreatedAt = now.AddHours(-6), Note = "Routine feeding for Duman at the communication canteen." },
            new CareTask { Id = 8, AnimalId = 8, LocationId = 5, TaskType = "Routine Feeding", AssignedUserId = null, Status = "Open", DueAt = now.AddHours(3), CreatedAt = now.AddHours(-6), Note = "Routine feeding for Tarcin in the cafeteria backyard." },
            new CareTask { Id = 9, AnimalId = 1, LocationId = 1, TaskType = "Feeding Check", AssignedUserId = 3, Status = "Completed", DueAt = now.AddHours(-1), CreatedAt = now.AddHours(-6), Note = "Morning feeding." }
        );

        db.TaskLogs.Add(new TaskLog { Id = 1, TaskId = 9, UserId = 3, CompletedAt = now.AddHours(-2), Note = "Food and water renewed.", QrVerified = true });

        db.HealthLogs.AddRange(
            new HealthLog { Id = 1, AnimalId = 1, VeterinarianUserId = 2, ActionType = "Vaccine", ActionDate = now.AddDays(-8), Description = "Combined vaccine administered.", NextCheckDate = now.AddDays(22) },
            new HealthLog { Id = 2, AnimalId = 5, VeterinarianUserId = 5, ActionType = "Treatment", ActionDate = now.AddDays(-3), Description = "Leg wound cleaned and bandaged.", NextCheckDate = now.AddDays(2) },
            new HealthLog { Id = 3, AnimalId = 2, VeterinarianUserId = 2, ActionType = "General Check", ActionDate = now.AddDays(-1), Description = "Fatigue observed, nutrition monitoring recommended.", NextCheckDate = now.AddDays(3) }
        );

        db.Needs.AddRange(
            new Need { Id = 1, AnimalId = 2, NeedType = "Food", Description = "High-protein dry food is needed.", Amount = "5 kg", Urgency = "Critical", Status = "Pending", CreatedAt = now.AddHours(-5) },
            new Need { Id = 2, AnimalId = 5, NeedType = "Medicine", Description = "Wound care spray and antibiotic.", Amount = "1 box", Urgency = "High", Status = "Pending", CreatedAt = now.AddDays(-2) },
            new Need { Id = 3, AnimalId = 7, NeedType = "Food", Description = "Mix of wet and dry food.", Amount = "3 kg", Urgency = "Critical", Status = "Pending", CreatedAt = now.AddHours(-8) },
            new Need { Id = 4, AnimalId = 3, NeedType = "Shelter", Description = "Small hut behind the sports hall.", Amount = "1 unit", Urgency = "Routine", Status = "Planned", CreatedAt = now.AddDays(-5) },
            new Need { Id = 5, AnimalId = 1, NeedType = "Water", Description = "Routine Notification: Clean water bowl and fill with fresh water.", Amount = "Every 6 hours", Urgency = "Routine", Status = "Pending", CreatedAt = now.AddDays(-1) },
            new Need { Id = 6, AnimalId = 2, NeedType = "Water", Description = "Routine Notification: Clean water bowl and fill with fresh water.", Amount = "Every 6 hours", Urgency = "Routine", Status = "Pending", CreatedAt = now.AddDays(-1) },
            new Need { Id = 7, AnimalId = 3, NeedType = "Water", Description = "Routine Notification: Clean water bowl and fill with fresh water.", Amount = "Every 6 hours", Urgency = "Routine", Status = "Pending", CreatedAt = now.AddDays(-1) },
            new Need { Id = 8, AnimalId = 4, NeedType = "Water", Description = "Routine Notification: Clean water bowl and fill with fresh water.", Amount = "Every 6 hours", Urgency = "Routine", Status = "Pending", CreatedAt = now.AddDays(-1) },
            new Need { Id = 9, AnimalId = 5, NeedType = "Water", Description = "Routine Notification: Clean water bowl and fill with fresh water.", Amount = "Every 6 hours", Urgency = "Routine", Status = "Pending", CreatedAt = now.AddDays(-1) },
            new Need { Id = 10, AnimalId = 6, NeedType = "Water", Description = "Routine Notification: Clean water bowl and fill with fresh water.", Amount = "Every 6 hours", Urgency = "Routine", Status = "Pending", CreatedAt = now.AddDays(-1) },
            new Need { Id = 11, AnimalId = 7, NeedType = "Water", Description = "Routine Notification: Clean water bowl and fill with fresh water.", Amount = "Every 6 hours", Urgency = "Routine", Status = "Pending", CreatedAt = now.AddDays(-1) },
            new Need { Id = 12, AnimalId = 8, NeedType = "Water", Description = "Routine Notification: Clean water bowl and fill with fresh water.", Amount = "Every 6 hours", Urgency = "Routine", Status = "Pending", CreatedAt = now.AddDays(-1) }
        );

        db.Donations.AddRange(
            new Donation { Id = 1, NeedId = 1, UserId = 3, DonorName = "Volunteer Student", Amount = "2 kg dry food", Description = "I will deliver it from the engineering canteen.", Status = "Committed", CreatedAt = now.AddHours(-2) }
        );

        db.Reports.Add(new Report { Id = 1, ReporterName = "Visitor", Email = "visitor@example.com", Subject = "New cat notification", Message = "A kitten was spotted near the Arts and Sciences building.", Status = "New", CreatedAt = now.AddHours(-3) });

        db.Notifications.Add(new NotificationItem { Id = 1, UserId = 1, Title = "⚠️ Urgent Feeding Required", Message = "No feeding has been done for more than 6 hours at the Sports Hall point!", CreatedAt = now.AddMinutes(-30) });

        await db.SaveChangesAsync();
    }
}
