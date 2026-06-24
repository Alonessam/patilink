// ============================================================================
// PatiLink Data Models
// This file contains the Entity classes corresponding to database tables,
// the DTO (Data Transfer Object) records used in API requests,
// and View Models.
// ============================================================================

namespace PatiLink.Api.Models;

// ======================== ENTITY CLASSES ========================

/// <summary>User profile - has one of Admin, Vet, or Volunteer roles.</summary>
public sealed class UserProfile
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "Volunteer";
    public string Phone { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Feeding point or animal location.</summary>
public sealed class LocationPoint
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Faculty { get; set; } = "";
    public string Description { get; set; } = "";
    public string QrCode { get; set; } = "";
    public string CareStatus { get; set; } = "Routine";
    public DateTime? LastCareAt { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

/// <summary>Stray animal living on campus.</summary>
public sealed class Animal
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Species { get; set; } = "";
    public string Gender { get; set; } = "";
    public string Description { get; set; } = "";
    public string PhotoUrl { get; set; } = "";
    public int LocationId { get; set; }
    public string CareStatus { get; set; } = "Routine";
    public string Urgency { get; set; } = "Routine";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Care task created for animals.</summary>
public sealed class CareTask
{
    public int Id { get; set; }
    public int AnimalId { get; set; }
    public int LocationId { get; set; }
    public string TaskType { get; set; } = "";
    public int? AssignedUserId { get; set; }
    public string Status { get; set; } = "Open";
    public DateTime DueAt { get; set; } = DateTime.UtcNow.AddHours(2);
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Note { get; set; } = "";
    public string Frequency { get; set; } = "One-Time";
}

/// <summary>Logs of completed tasks.</summary>
public sealed class TaskLog
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public int UserId { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public string Note { get; set; } = "";
    public string PhotoUrl { get; set; } = "";
    public bool QrVerified { get; set; }
}

/// <summary>Health and treatment history of animals.</summary>
public sealed class HealthLog
{
    public int Id { get; set; }
    public int AnimalId { get; set; }
    public int VeterinarianUserId { get; set; }
    public string ActionType { get; set; } = "";
    public DateTime ActionDate { get; set; } = DateTime.UtcNow;
    public string Description { get; set; } = "";
    public DateTime? NextCheckDate { get; set; }
}

/// <summary>Need requests for animals (food, shelter, etc.).</summary>
public sealed class Need
{
    public int Id { get; set; }
    public int AnimalId { get; set; }
    public string NeedType { get; set; } = "";
    public string Description { get; set; } = "";
    public string Amount { get; set; } = "";
    public string Urgency { get; set; } = "Routine";
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Tracking of donations fulfilled by volunteers.</summary>
public sealed class Donation
{
    public int Id { get; set; }
    public int NeedId { get; set; }
    public int? UserId { get; set; }
    public string DonorName { get; set; } = "";
    public string Amount { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "Committed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Reports and complaints submitted by users.</summary>
public sealed class Report
{
    public int Id { get; set; }
    public string ReporterName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Message { get; set; } = "";
    public int? LocationId { get; set; }
    public string Status { get; set; } = "New";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>System notifications.</summary>
public sealed class NotificationItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ======================== DTO / REQUEST RECORDS ========================

public sealed record AnimalRequest(
    string Name, string Species, string Gender, string Description,
    string PhotoUrl, int LocationId, string CareStatus, string Urgency);

public sealed record TaskRequest(
    int AnimalId, int LocationId, string TaskType,
    int? AssignedUserId, DateTime DueAt, string Note, string? Frequency);

public sealed record CompleteTaskRequest(
    int UserId, string QrCode, string Note, string PhotoUrl);

public sealed record NeedRequest(
    int AnimalId, string NeedType, string Description,
    string Amount, string Urgency);

public sealed record HealthLogRequest(
    int AnimalId, int VeterinarianUserId, string ActionType,
    string Description, DateTime? NextCheckDate);

public sealed record ReportRequest(
    string ReporterName, string Email, string Subject,
    string Message, int? LocationId);

public sealed record DonationRequest(
    int NeedId, int? UserId, string DonorName,
    string Amount, string Description);

public sealed record LoginRequest(string Email, string Password);
public sealed record RegisterRequest(string FullName, string Email, string Password, string Phone);
public sealed record AssignTaskRequest(int UserId);
public sealed record UpdateNeedStatusRequest(string Status);
public sealed record UpdateRoleRequest(string Role);
