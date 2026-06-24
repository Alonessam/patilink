// ============================================================================
// PatiLink API — Campus Stray Animal Care and Task Coordination System
// Technology: ASP.NET Core 8 Minimal API + EF Core + SQL Server / SQLite
// ============================================================================

using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using PatiLink.Api.Data;
using PatiLink.Api.Models;
using PatiLink.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// --- JWT ---
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "SuperSecretKeyForPatiLinkApiDoNotShareThisInProduction!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });
builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("AdminOrVet", p => p.RequireRole("Admin", "Vet"));
    o.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
});

// --- Database (SQLite or SQL Server) ---
var provider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddDbContext<PatiLinkDbContext>(o => o.UseSqlite(builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=PatiLink.db"));
else
    builder.Services.AddDbContext<PatiLinkDbContext>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHostedService<CareStatusBackgroundService>();
builder.Services.ConfigureHttpJsonOptions(o => { o.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase; });

var app = builder.Build();

// --- Database Initialization & Seeding ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PatiLinkDbContext>();
    db.Database.EnsureCreated();
    await DbSeeder.SeedAsync(db);
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");

// ==================== HEALTH ====================
api.MapGet("/health", () => Results.Ok(new { status = "ok", app = "PatiLink" }));

// ==================== AUTH ====================
api.MapPost("/auth/register", async (RegisterRequest req, PatiLinkDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.FullName))
        return Results.BadRequest(new { message = "Name, Email and Password are required." });
    if (await db.Users.AnyAsync(u => u.Email == req.Email.Trim()))
        return Results.BadRequest(new { message = "This email address is already in use." });
    var user = new UserProfile { FullName = req.FullName.Trim(), Email = req.Email.Trim(), PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password), Phone = req.Phone?.Trim() ?? "", Role = "Volunteer", IsActive = true, CreatedAt = DateTime.UtcNow };
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Registration successful.", userId = user.Id });
});

api.MapPost("/auth/login", async (LoginRequest req, PatiLinkDbContext db, IConfiguration config) =>
{
    if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
        return Results.BadRequest(new { message = "Email and password are required." });
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.Trim());
    if (user is null) return Results.NotFound(new { message = "User not found." });
    if (string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        return Results.BadRequest(new { message = "Invalid email or password." });

    var key = Encoding.UTF8.GetBytes(config["JwtSettings:Secret"]!);
    var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user.Id.ToString()), new(ClaimTypes.Email, user.Email), new(ClaimTypes.Name, user.FullName), new(ClaimTypes.Role, user.Role) };
    var td = new SecurityTokenDescriptor { Subject = new ClaimsIdentity(claims), Expires = DateTime.UtcNow.AddDays(7), Issuer = config["JwtSettings:Issuer"], Audience = config["JwtSettings:Audience"], SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature) };
    var handler = new JwtSecurityTokenHandler();
    var token = handler.CreateToken(td);
    return Results.Ok(new { token = handler.WriteToken(token), user = new { user.Id, user.FullName, user.Email, user.Role, user.Phone, user.IsActive, user.CreatedAt } });
});

// ==================== SUMMARY ====================
api.MapGet("/summary", async (PatiLinkDbContext db) =>
{
    var logs = await db.TaskLogs.OrderByDescending(l => l.CompletedAt).Take(5).ToListAsync();
    var userIds = logs.Select(l => l.UserId).Distinct().ToList();
    var taskIds = logs.Select(l => l.TaskId).Distinct().ToList();
    var usersMap = await db.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);
    var tasksMap = await db.Tasks.Where(t => taskIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id);
    var details = logs.Select(l => new {
        l.Id,
        l.CompletedAt,
        l.Note,
        l.QrVerified,
        Volunteer = usersMap.TryGetValue(l.UserId, out var v) ? v.FullName : "?",
        Task = tasksMap.TryGetValue(l.TaskId, out var t) ? t.TaskType : "?"
    }).ToList();
    
    var sixHoursAgo = DateTime.UtcNow.AddHours(-6);
    var hungryLocationCount = await db.Locations.CountAsync(l => l.LastCareAt == null || l.LastCareAt < sixHoursAgo);
    
    var urgentTasks = await db.Tasks.Where(t => t.Status != "Completed" && t.DueAt <= DateTime.UtcNow.AddHours(2)).OrderBy(t => t.DueAt).Take(5).ToListAsync();
    var aIds = urgentTasks.Select(t => t.AnimalId).Distinct().ToList();
    var lIds = urgentTasks.Select(t => t.LocationId).Distinct().ToList();
    var animals = await db.Animals.Where(a => aIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);
    var locs = await db.Locations.Where(l => lIds.Contains(l.Id)).ToDictionaryAsync(l => l.Id);
    
    var assignedUserIds = urgentTasks.Where(t => t.AssignedUserId != null).Select(t => t.AssignedUserId!.Value).Distinct().ToList();
    var assignedUsersMap = await db.Users.Where(u => assignedUserIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);
    var urgentTaskDtos = urgentTasks.Select(t => new { 
        t.Id, 
        t.AnimalId, 
        AnimalName = animals.TryGetValue(t.AnimalId, out var an) ? an.Name : "?", 
        t.LocationId, 
        LocationName = locs.TryGetValue(t.LocationId, out var lo) ? lo.Name : "?", 
        QrCode = locs.TryGetValue(t.LocationId, out var lq) ? lq.QrCode : "", 
        t.TaskType, 
        t.AssignedUserId, 
        AssignedUserName = t.AssignedUserId != null && assignedUsersMap.TryGetValue(t.AssignedUserId.Value, out var au) ? au.FullName : "Unassigned", 
        t.Status, 
        t.DueAt, 
        t.CreatedAt, 
        t.Note, 
        t.Frequency, 
        IsOverdue = t.DueAt < DateTime.UtcNow 
    });
    
    return Results.Ok(new { animalCount = await db.Animals.CountAsync(), openTaskCount = await db.Tasks.CountAsync(t => t.Status != "Completed"), criticalAnimalCount = await db.Animals.CountAsync(a => a.Urgency == "Critical" || a.CareStatus == "Hungry"), waitingNeedCount = await db.Needs.CountAsync(n => n.Status != "Fulfilled"), volunteerCount = await db.Users.CountAsync(u => u.Role == "Volunteer"), hungryLocationCount, urgentTasks = urgentTaskDtos, recentLogs = details });
});

// ==================== BOOTSTRAP (all data in one payload) ====================
api.MapGet("/bootstrap", async (PatiLinkDbContext db) =>
{
    var users = await db.Users.Select(u => new { u.Id, u.FullName, u.Email, u.Role, u.Phone, u.IsActive, u.CreatedAt }).ToListAsync();
    var userDict = users.ToDictionary(u => u.Id);
    var locations = await db.Locations.ToListAsync();
    var animals = await db.Animals.ToListAsync();
    var locDict = locations.ToDictionary(l => l.Id);
    var animalDtos = animals.Select(a => new { a.Id, a.Name, a.Species, a.Gender, a.Description, a.PhotoUrl, a.CareStatus, a.Urgency, a.CreatedAt, a.LocationId, LocationName = locDict.TryGetValue(a.LocationId, out var l) ? l.Name : "?", Faculty = locDict.TryGetValue(a.LocationId, out var f) ? f.Faculty : "?" }).ToList();
    
    var tasks = await db.Tasks.ToListAsync();
    var aDict = animals.ToDictionary(a => a.Id);
    var taskDtos = tasks.Select(t => new { t.Id, t.AnimalId, AnimalName = aDict.TryGetValue(t.AnimalId, out var an) ? an.Name : "?", t.LocationId, LocationName = locDict.TryGetValue(t.LocationId, out var lo) ? lo.Name : "?", QrCode = locDict.TryGetValue(t.LocationId, out var lq) ? lq.QrCode : "", Faculty = locDict.TryGetValue(t.LocationId, out var lf) ? lf.Faculty : "?", t.TaskType, t.AssignedUserId, AssignedUserName = t.AssignedUserId != null && userDict.TryGetValue(t.AssignedUserId.Value, out var u) ? u.FullName : "Unassigned", t.Status, t.DueAt, t.CreatedAt, t.Note, t.Frequency, IsOverdue = t.DueAt < DateTime.UtcNow }).ToList();

    var needs = await db.Needs.ToListAsync();
    var needDtos = needs.Select(n => new { n.Id, n.AnimalId, AnimalName = aDict.TryGetValue(n.AnimalId, out var na) ? na.Name : "?", n.NeedType, n.Description, n.Amount, n.Urgency, n.Status, n.CreatedAt }).ToList();

    var reports = await db.Reports.ToListAsync();
    var notifications = await db.Notifications.ToListAsync();

    return Results.Ok(new { users, locations = locations.Select(l => new { l.Id, l.Name, l.Faculty, l.Description, l.QrCode, l.CareStatus, l.LastCareAt, l.Latitude, l.Longitude }), animals = animalDtos, tasks = taskDtos, needs = needDtos, reports, notifications });
});

// ==================== ANIMALS ====================
api.MapGet("/animals", async (string? search, string? faculty, string? urgency, string? status, PatiLinkDbContext db) =>
{
    var q = db.Animals.AsQueryable();
    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.ToLowerInvariant();
        q = q.Where(a => a.Name.ToLower().Contains(s) || a.Species.ToLower().Contains(s) || a.Description.ToLower().Contains(s));
    }
    if (!string.IsNullOrWhiteSpace(faculty) && faculty != "All") { var lids = await db.Locations.Where(l => l.Faculty == faculty).Select(l => l.Id).ToListAsync(); q = q.Where(a => lids.Contains(a.LocationId)); }
    if (!string.IsNullOrWhiteSpace(urgency) && urgency != "All") q = q.Where(a => a.Urgency == urgency);
    if (!string.IsNullOrWhiteSpace(status) && status != "All") q = q.Where(a => a.CareStatus == status);
    var animals = await q.OrderByDescending(a => a.Urgency == "Critical").ThenBy(a => a.Name).ToListAsync();
    var locs = await db.Locations.Where(l => animals.Select(a => a.LocationId).Distinct().Contains(l.Id)).ToDictionaryAsync(l => l.Id);
    return Results.Ok(animals.Select(a => new { a.Id, a.Name, a.Species, a.Gender, a.Description, a.PhotoUrl, a.CareStatus, a.Urgency, a.CreatedAt, a.LocationId, LocationName = locs.TryGetValue(a.LocationId, out var l) ? l.Name : "?", Faculty = locs.TryGetValue(a.LocationId, out var f) ? f.Faculty : "?" }));
});

api.MapGet("/animals/{id:int}", async (int id, PatiLinkDbContext db) =>
{
    var a = await db.Animals.FindAsync(id);
    if (a is null) return Results.NotFound(new { message = "Animal record not found." });
    var loc = await db.Locations.FindAsync(a.LocationId);
    return Results.Ok(new { animal = new { a.Id, a.Name, a.Species, a.Gender, a.Description, a.PhotoUrl, a.CareStatus, a.Urgency, a.CreatedAt, a.LocationId, LocationName = loc?.Name ?? "?", Faculty = loc?.Faculty ?? "?" },
        tasks = await db.Tasks.Where(t => t.AnimalId == id).OrderByDescending(t => t.CreatedAt).ToListAsync(),
        needs = await db.Needs.Where(n => n.AnimalId == id).OrderByDescending(n => n.CreatedAt).ToListAsync(),
        healthLogs = await db.HealthLogs.Where(h => h.AnimalId == id).OrderByDescending(h => h.ActionDate).ToListAsync() });
});

api.MapPost("/animals", async (AnimalRequest req, PatiLinkDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.Name)) return Results.BadRequest(new { message = "Animal name is required." });
    if (string.IsNullOrWhiteSpace(req.Species)) return Results.BadRequest(new { message = "Species is required." });
    if (req.LocationId <= 0 || !await db.Locations.AnyAsync(l => l.Id == req.LocationId)) return Results.BadRequest(new { message = "A valid location must be selected." });
    var a = new Animal { Name = req.Name.Trim(), Species = req.Species.Trim(), Gender = req.Gender?.Trim() ?? "", Description = req.Description?.Trim() ?? "", PhotoUrl = string.IsNullOrWhiteSpace(req.PhotoUrl) ? DefaultPhoto(req.Species) : req.PhotoUrl.Trim(), LocationId = req.LocationId, CareStatus = string.IsNullOrWhiteSpace(req.CareStatus) ? "Routine" : req.CareStatus.Trim(), Urgency = string.IsNullOrWhiteSpace(req.Urgency) ? "Routine" : req.Urgency.Trim(), CreatedAt = DateTime.UtcNow };
    db.Animals.Add(a); await db.SaveChangesAsync();
    return Results.Created($"/api/animals/{a.Id}", a);
}).RequireAuthorization("AdminOrVet");

api.MapPut("/animals/{id:int}", async (int id, AnimalRequest req, PatiLinkDbContext db) =>
{
    var a = await db.Animals.FindAsync(id);
    if (a is null) return Results.NotFound(new { message = "Animal record not found." });
    a.Name = req.Name?.Trim() ?? a.Name; a.Species = req.Species?.Trim() ?? a.Species; a.Gender = req.Gender?.Trim() ?? a.Gender; a.Description = req.Description?.Trim() ?? a.Description; a.PhotoUrl = string.IsNullOrWhiteSpace(req.PhotoUrl) ? a.PhotoUrl : req.PhotoUrl.Trim(); a.LocationId = req.LocationId > 0 ? req.LocationId : a.LocationId; a.CareStatus = req.CareStatus?.Trim() ?? a.CareStatus; a.Urgency = req.Urgency?.Trim() ?? a.Urgency;
    await db.SaveChangesAsync(); return Results.Ok(a);
}).RequireAuthorization("AdminOrVet");

api.MapDelete("/animals/{id:int}", async (int id, PatiLinkDbContext db) =>
{
    var a = await db.Animals.FindAsync(id);
    if (a is null) return Results.NotFound(new { message = "Animal record not found." });
    db.Animals.Remove(a); await db.SaveChangesAsync();
    return Results.Ok(new { message = "Animal record deleted." });
}).RequireAuthorization("AdminOnly");

// ==================== LOCATIONS ====================
api.MapGet("/locations", async (PatiLinkDbContext db) => Results.Ok(await db.Locations.ToListAsync()));
api.MapPost("/locations", async (LocationPoint loc, PatiLinkDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(loc.Name) || string.IsNullOrWhiteSpace(loc.Faculty)) return Results.BadRequest(new { message = "Location name and faculty are required." });
    if (string.IsNullOrWhiteSpace(loc.QrCode))
    {
        var cleanFaculty = new string(loc.Faculty.Where(char.IsLetterOrDigit).ToArray());
        var prefix = cleanFaculty.Length >= 3 ? cleanFaculty.Substring(0, 3).ToUpper() : cleanFaculty.ToUpper();
        if (string.IsNullOrEmpty(prefix)) prefix = "LOC";
        var count = await db.Locations.CountAsync() + 1;
        loc.QrCode = $"QR-{prefix}-{count:D3}";
    }
    db.Locations.Add(loc); await db.SaveChangesAsync(); return Results.Ok(loc);
}).RequireAuthorization();

api.MapPut("/locations/{id:int}", async (int id, LocationPoint req, PatiLinkDbContext db) =>
{
    var loc = await db.Locations.FindAsync(id);
    if (loc is null) return Results.NotFound(new { message = "Location not found." });
    if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Faculty)) return Results.BadRequest(new { message = "Location name and faculty are required." });
    loc.Name = req.Name.Trim();
    loc.Faculty = req.Faculty.Trim();
    loc.Latitude = req.Latitude;
    loc.Longitude = req.Longitude;
    if (!string.IsNullOrWhiteSpace(req.QrCode)) loc.QrCode = req.QrCode.Trim();
    await db.SaveChangesAsync();
    return Results.Ok(loc);
}).RequireAuthorization();

// ==================== TASKS ====================
api.MapGet("/tasks", async (int? userId, PatiLinkDbContext db) =>
{
    var q = db.Tasks.AsQueryable();
    if (userId.HasValue) q = q.Where(t => t.AssignedUserId == userId.Value);
    var tasks = await q.OrderBy(t => t.Status == "Completed").ThenBy(t => t.DueAt).ToListAsync();
    var aIds = tasks.Select(t => t.AnimalId).Distinct().ToList();
    var lIds = tasks.Select(t => t.LocationId).Distinct().ToList();
    var animals = await db.Animals.Where(a => aIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);
    var locs = await db.Locations.Where(l => lIds.Contains(l.Id)).ToDictionaryAsync(l => l.Id);
    return Results.Ok(tasks.Select(t => new { t.Id, t.AnimalId, AnimalName = animals.TryGetValue(t.AnimalId, out var an) ? an.Name : "?", t.LocationId, LocationName = locs.TryGetValue(t.LocationId, out var lo) ? lo.Name : "?", QrCode = locs.TryGetValue(t.LocationId, out var lq) ? lq.QrCode : "", t.TaskType, t.AssignedUserId, t.Status, t.DueAt, t.CreatedAt, t.Note, t.Frequency }));
});

api.MapPost("/tasks", async (TaskRequest req, PatiLinkDbContext db) =>
{
    if (req.AnimalId <= 0 || string.IsNullOrWhiteSpace(req.TaskType) || req.LocationId <= 0) return Results.BadRequest(new { message = "Animal, location and task type are required." });
    
    var freq = req.Frequency?.Trim() ?? "One-Time";
    int count = 1;
    TimeSpan interval = TimeSpan.Zero;
    if (freq == "Daily") { count = 7; interval = TimeSpan.FromDays(1); }
    else if (freq == "Weekly") { count = 4; interval = TimeSpan.FromDays(7); }
    
    var createdTasks = new List<CareTask>();
    for (int i = 0; i < count; i++)
    {
        var due = req.DueAt.Add(interval * i);
        var t = new CareTask 
        { 
            AnimalId = req.AnimalId, 
            LocationId = req.LocationId, 
            TaskType = req.TaskType.Trim(), 
            AssignedUserId = req.AssignedUserId, 
            DueAt = due, 
            Note = req.Note?.Trim() ?? "", 
            Status = "Open", 
            CreatedAt = DateTime.UtcNow,
            Frequency = freq
        };
        db.Tasks.Add(t);
        createdTasks.Add(t);
    }
    await db.SaveChangesAsync(); 
    return Results.Created($"/api/tasks/{createdTasks[0].Id}", createdTasks[0]);
});

api.MapPatch("/tasks/{id:int}/assign", async (int id, AssignTaskRequest req, PatiLinkDbContext db) =>
{
    var t = await db.Tasks.FindAsync(id); if (t is null) return Results.NotFound(new { message = "Task not found." });
    t.AssignedUserId = req.UserId; t.Status = "Assigned"; await db.SaveChangesAsync(); return Results.Ok(t);
});

api.MapPatch("/tasks/{id:int}/unassign", async (int id, PatiLinkDbContext db) =>
{
    var t = await db.Tasks.FindAsync(id); if (t is null) return Results.NotFound(new { message = "Task not found." });
    t.AssignedUserId = null; t.Status = "Open"; await db.SaveChangesAsync(); return Results.Ok(t);
});

api.MapPost("/tasks/{id:int}/complete", async (int id, CompleteTaskRequest req, PatiLinkDbContext db) =>
{
    var t = await db.Tasks.FindAsync(id); if (t is null) return Results.BadRequest(new { message = "Task not found." });
    var u = await db.Users.FindAsync(req.UserId); if (u is null) return Results.BadRequest(new { message = "User not found." });
    var loc = await db.Locations.FindAsync(t.LocationId); if (loc is null) return Results.BadRequest(new { message = "Location not found." });
    var qrOk = loc.QrCode.Equals(req.QrCode?.Trim() ?? "", StringComparison.OrdinalIgnoreCase);
    if (!qrOk && u.Role != "Vet") return Results.BadRequest(new { message = "QR code does not match this feeding point." });
    
    t.Status = "Completed"; t.AssignedUserId ??= u.Id;
    db.TaskLogs.Add(new TaskLog { TaskId = t.Id, UserId = u.Id, CompletedAt = DateTime.UtcNow, Note = req.Note?.Trim() ?? "Task completed.", PhotoUrl = req.PhotoUrl?.Trim() ?? "", QrVerified = qrOk });
    loc.LastCareAt = DateTime.UtcNow; loc.CareStatus = "Cared For";
    
    var animal = await db.Animals.FindAsync(t.AnimalId);
    if (animal is not null)
    {
        if (t.TaskType.Contains("feed", StringComparison.OrdinalIgnoreCase) || 
            t.TaskType.Contains("food", StringComparison.OrdinalIgnoreCase))
        {
            animal.CareStatus = "Fed";
            animal.Urgency = animal.Urgency == "Critical" ? "High" : "Routine";
        }
        else if (t.TaskType.Contains("health", StringComparison.OrdinalIgnoreCase) || 
                 t.TaskType.Contains("treatment", StringComparison.OrdinalIgnoreCase) || 
                 t.TaskType.Contains("vaccine", StringComparison.OrdinalIgnoreCase) || 
                 t.TaskType.Contains("check", StringComparison.OrdinalIgnoreCase))
        {
            animal.CareStatus = "Routine";
            animal.Urgency = "Routine";
        }
    }
    
    var msgStr = qrOk 
        ? $"{u.FullName} verified the {t.TaskType} task at {loc.Name} via QR code."
        : $"{u.FullName} completed the {t.TaskType} task at {loc.Name} directly.";
        
    db.Notifications.Add(new NotificationItem { UserId = 1, Title = "Task completed", Message = msgStr, CreatedAt = DateTime.UtcNow });
    await db.SaveChangesAsync(); 
    return Results.Ok(new { task = t, location = loc, animal });
});

api.MapPost("/qr/scan", async (CompleteTaskRequest req, PatiLinkDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.QrCode)) return Results.BadRequest(new { message = "QR code cannot be empty." });
    var loc = await db.Locations.FirstOrDefaultAsync(l => l.QrCode == req.QrCode.Trim());
    if (loc is null) return Results.NotFound(new { message = "No feeding point found matching this QR code." });
    var animals = await db.Animals.Where(a => a.LocationId == loc.Id).ToListAsync();
    var animalIds = animals.Select(a => a.Id).ToList();
    var openNeeds = await db.Needs.Where(n => animalIds.Contains(n.AnimalId) && n.Status != "Fulfilled").ToListAsync();
    var openTasks = await db.Tasks.Where(t => t.LocationId == loc.Id && t.Status != "Completed").ToListAsync();
    return Results.Ok(new { location = loc, animals = animals, openTasks = openTasks, openNeeds = openNeeds });
});

// ==================== NEEDS ====================
api.MapGet("/needs", async (PatiLinkDbContext db) => Results.Ok(await db.Needs.OrderBy(n => n.Status == "Fulfilled").ThenByDescending(n => n.Urgency == "Critical").ToListAsync()));
api.MapPost("/needs", async (NeedRequest req, PatiLinkDbContext db) =>
{
    if (req.AnimalId <= 0 || string.IsNullOrWhiteSpace(req.NeedType)) return Results.BadRequest(new { message = "Animal and need type are required." });
    var n = new Need { AnimalId = req.AnimalId, NeedType = req.NeedType.Trim(), Description = req.Description?.Trim() ?? "", Amount = req.Amount?.Trim() ?? "", Urgency = string.IsNullOrWhiteSpace(req.Urgency) ? "Routine" : req.Urgency.Trim(), Status = "Pending", CreatedAt = DateTime.UtcNow };
    db.Needs.Add(n); await db.SaveChangesAsync(); return Results.Created($"/api/needs/{n.Id}", n);
}).RequireAuthorization("AdminOrVet");

api.MapPatch("/needs/{id:int}/status", async (int id, UpdateNeedStatusRequest req, PatiLinkDbContext db) =>
{
    var n = await db.Needs.FindAsync(id); 
    if (n is null) return Results.NotFound(new { message = "Need record not found." });
    
    var oldStatus = n.Status;
    n.Status = string.IsNullOrWhiteSpace(req.Status) ? n.Status : req.Status.Trim();
    
    if (n.Status == "Fulfilled" && oldStatus != "Fulfilled")
    {
        var animal = await db.Animals.FindAsync(n.AnimalId);
        if (animal is not null)
        {
            var isFood = n.NeedType.Contains("food", StringComparison.OrdinalIgnoreCase) || 
                         n.NeedType.Contains("feed", StringComparison.OrdinalIgnoreCase) ||
                         n.NeedType.Contains("water", StringComparison.OrdinalIgnoreCase);
            
            var isMedicine = n.NeedType.Contains("medicine", StringComparison.OrdinalIgnoreCase) || 
                             n.NeedType.Contains("med", StringComparison.OrdinalIgnoreCase) || 
                             n.NeedType.Contains("treatment", StringComparison.OrdinalIgnoreCase);
            
            if (isFood)
            {
                animal.CareStatus = "Fed";
                animal.Urgency = animal.Urgency == "Critical" ? "High" : "Routine";
            }
            else if (isMedicine)
            {
                animal.CareStatus = "Routine";
                animal.Urgency = "Routine";
                
                db.HealthLogs.Add(new HealthLog
                {
                    AnimalId = n.AnimalId,
                    VeterinarianUserId = 2,
                    ActionType = "Treatment",
                    ActionDate = DateTime.UtcNow,
                    Description = $"Medicine/Treatment need fulfilled: {n.Description} ({n.Amount})"
                });
            }
        }
    }
    await db.SaveChangesAsync(); 
    return Results.Ok(n);
});

// ==================== HEALTH LOGS ====================
api.MapGet("/health-logs", async (PatiLinkDbContext db) =>
{
    var logs = await db.HealthLogs.OrderByDescending(h => h.ActionDate).ToListAsync();
    var aIds = logs.Select(h => h.AnimalId).Distinct().ToList();
    var animals = await db.Animals.Where(a => aIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);
    return Results.Ok(logs.Select(h => new { h.Id, h.AnimalId, AnimalName = animals.TryGetValue(h.AnimalId, out var a) ? a.Name : "?", AnimalSpecies = animals.TryGetValue(h.AnimalId, out var s) ? s.Species : "", h.VeterinarianUserId, h.ActionType, h.ActionDate, h.Description, h.NextCheckDate }));
}).RequireAuthorization(p => p.RequireRole("Vet"));

api.MapPost("/health-logs", async (HealthLogRequest req, PatiLinkDbContext db) =>
{
    if (req.AnimalId <= 0 || req.VeterinarianUserId <= 0 || string.IsNullOrWhiteSpace(req.ActionType)) 
        return Results.BadRequest(new { message = "Animal, veterinarian and action type are required." });
        
    var animal = await db.Animals.FindAsync(req.AnimalId);
    if (animal is null) 
        return Results.BadRequest(new { message = "Selected animal not found." });

    var h = new HealthLog 
    { 
        AnimalId = req.AnimalId, 
        VeterinarianUserId = req.VeterinarianUserId, 
        ActionType = req.ActionType.Trim(), 
        Description = req.Description?.Trim() ?? "", 
        ActionDate = DateTime.UtcNow, 
        NextCheckDate = req.NextCheckDate 
    };
    db.HealthLogs.Add(h);
    
    if (req.ActionType.Contains("treatment", StringComparison.OrdinalIgnoreCase)) 
    { 
        animal.CareStatus = "In Treatment"; 
        animal.Urgency = "Critical"; 
    }
    
    // Automatically create a CareTask assigned to the creating veterinarian
    var task = new CareTask
    {
        AnimalId = req.AnimalId,
        LocationId = animal.LocationId,
        TaskType = $"Health: {req.ActionType.Trim()}",
        AssignedUserId = req.VeterinarianUserId,
        Status = "Assigned",
        DueAt = req.NextCheckDate ?? DateTime.UtcNow.AddHours(2),
        CreatedAt = DateTime.UtcNow,
        Note = req.Description?.Trim() ?? $"Health Follow-up: {req.ActionType.Trim()}",
        Frequency = "One-Time"
    };
    db.Tasks.Add(task);
    
    await db.SaveChangesAsync(); 
    return Results.Created($"/api/health-logs/{h.Id}", h);
}).RequireAuthorization(p => p.RequireRole("Vet"));

// ==================== DONATIONS ====================
api.MapGet("/donations", async (PatiLinkDbContext db) =>
{
    var ds = await db.Donations.OrderByDescending(d => d.CreatedAt).ToListAsync();
    var nIds = ds.Select(d => d.NeedId).Distinct().ToList();
    var needs = await db.Needs.Where(n => nIds.Contains(n.Id)).ToDictionaryAsync(n => n.Id);
    return Results.Ok(ds.Select(d => new { d.Id, d.NeedId, NeedType = needs.TryGetValue(d.NeedId, out var nd) ? nd.NeedType : "?", NeedAnimalId = needs.TryGetValue(d.NeedId, out var na) ? na.AnimalId : 0, d.UserId, d.DonorName, d.Amount, d.Description, d.Status, d.CreatedAt }));
});

api.MapPost("/donations", async (DonationRequest req, PatiLinkDbContext db) =>
{
    if (req.NeedId <= 0 || string.IsNullOrWhiteSpace(req.DonorName)) return Results.BadRequest(new { message = "Need and donor name are required." });
    var d = new Donation { NeedId = req.NeedId, UserId = req.UserId, DonorName = req.DonorName.Trim(), Amount = req.Amount?.Trim() ?? "", Description = req.Description?.Trim() ?? "", Status = "Committed", CreatedAt = DateTime.UtcNow };
    db.Donations.Add(d); await db.SaveChangesAsync(); return Results.Created($"/api/donations/{d.Id}", d);
});

api.MapDelete("/donations/{id:int}", async (int id, PatiLinkDbContext db) =>
{
    var d = await db.Donations.FindAsync(id); if (d is null) return Results.NotFound(new { message = "Donation record not found." });
    db.Donations.Remove(d); await db.SaveChangesAsync(); return Results.Ok(new { message = "Commitment cancelled." });
});

// ==================== REPORTS ====================
api.MapGet("/reports", async (PatiLinkDbContext db) => Results.Ok(await db.Reports.OrderByDescending(r => r.CreatedAt).ToListAsync())).RequireAuthorization("AdminOnly");
api.MapPost("/reports", async (ReportRequest req, PatiLinkDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.ReporterName) || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Message)) return Results.BadRequest(new { message = "Name, email and message are required." });
    var r = new Report { ReporterName = req.ReporterName.Trim(), Email = req.Email.Trim(), Subject = string.IsNullOrWhiteSpace(req.Subject) ? "General notification" : req.Subject.Trim(), Message = req.Message.Trim(), LocationId = req.LocationId, Status = "New", CreatedAt = DateTime.UtcNow };
    db.Reports.Add(r); await db.SaveChangesAsync(); return Results.Created($"/api/reports/{r.Id}", r);
});
api.MapPatch("/reports/{id:int}/status", async (int id, UpdateNeedStatusRequest req, PatiLinkDbContext db) =>
{
    var r = await db.Reports.FindAsync(id); if (r is null) return Results.NotFound(); r.Status = req.Status?.Trim() ?? r.Status; await db.SaveChangesAsync(); return Results.Ok(r);
}).RequireAuthorization("AdminOnly");

// ==================== USERS (admin) ====================
api.MapGet("/users/vets", async (PatiLinkDbContext db) => Results.Ok(await db.Users.Where(u => u.Role == "Vet" || u.Role == "Admin").Select(u => new { u.Id, u.FullName, u.Role }).ToListAsync())).RequireAuthorization();
api.MapGet("/users", async (PatiLinkDbContext db) => Results.Ok(await db.Users.Select(u => new { u.Id, u.FullName, u.Email, u.Role, u.Phone, u.IsActive, u.CreatedAt }).ToListAsync())).RequireAuthorization("AdminOnly");
api.MapPatch("/users/{id:int}/role", async (int id, UpdateRoleRequest req, PatiLinkDbContext db) =>
{
    var u = await db.Users.FindAsync(id); if (u is null) return Results.NotFound();
    u.Role = req.Role?.Trim() ?? u.Role; await db.SaveChangesAsync(); return Results.Ok(new { u.Id, u.FullName, u.Email, u.Role });
}).RequireAuthorization("AdminOnly");
api.MapDelete("/users/{id:int}", async (int id, PatiLinkDbContext db) =>
{
    var u = await db.Users.FindAsync(id); if (u is null) return Results.NotFound();
    db.Users.Remove(u); await db.SaveChangesAsync(); return Results.Ok(new { message = "User deleted." });
}).RequireAuthorization("AdminOnly");

app.MapFallbackToFile("index.html");
app.Run();

static string DefaultPhoto(string species) => species.Contains("dog", StringComparison.OrdinalIgnoreCase) ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80" : "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=80";
