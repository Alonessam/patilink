# PatiLink Database Schema

The PatiLink project uses the **Entity Framework Core (Code-First)** approach for the database. By default, SQLite is used, but it can be switched to SQL Server via `appsettings.json`.

Below are the main entity classes that make up the database:

### 1. UserProfile (Users)
- **Id** (PK)
- **FullName**: Full name
- **Email**: Email address (Unique Index)
- **PasswordHash**: BCrypt hashed password
- **Role**: User role (Volunteer, Vet, Admin)
- **Phone**: Phone number
- **IsActive**: Activity status
- **CreatedAt**: Registration date

### 2. LocationPoint (Feeding / Location Points)
- **Id** (PK)
- **Name**: Location name (e.g. Faculty of Engineering)
- **Faculty**: Faculty or campus region
- **Description**: Detailed description of the location
- **QrCode**: QR code string for verification (e.g. QR-ENG-001)
- **CareStatus**: Current care status (Hungry, Cared For, etc.)
- **LastCareAt**: Time of last care (Checked for 6-hour care rule)

### 3. Animal (Animals)
- **Id** (PK)
- **Name**: Name of the animal
- **Species**: Species (Cat, Dog, etc.)
- **Gender**: Gender
- **Description**: Description and info about the animal
- **PhotoUrl**: Photo link
- **LocationId** (FK -> LocationPoint)
- **CareStatus**: Care status (Fed, Hungry, In Treatment, etc.)
- **Urgency**: Urgency level (Routine, High, Critical)
- **CreatedAt**: Registration date

### 4. CareTask (Tasks)
- **Id** (PK)
- **AnimalId** (FK -> Animal)
- **LocationId** (FK -> LocationPoint)
- **TaskType**: Task type (Feeding, Treatment, Control)
- **AssignedUserId** (FK -> UserProfile): Volunteer/Vet who has assigned/taken the task
- **Status**: Task status (Open, Assigned, Completed)
- **DueAt**: Target completion time of the task
- **Note**: Specific instructions regarding the task

### 5. TaskLog (Task Logs)
- **Id** (PK)
- **TaskId** (FK -> CareTask)
- **UserId** (FK -> UserProfile)
- **CompletedAt**: Completion time
- **Note**: Note left by the volunteer
- **QrVerified**: Whether it was verified via QR code or not

### 6. HealthLog (Health Records)
- **Id** (PK)
- **AnimalId** (FK -> Animal)
- **VeterinarianUserId** (FK -> UserProfile)
- **ActionType**: Vaccine, Treatment, General Check, etc.
- **ActionDate**: Time of the medical action
- **Description**: Veterinarian notes
- **NextCheckDate**: Next check time (optional)

### 7. Need & Donation (Needs and Donations)
- **Need**
  - **AnimalId** (FK)
  - **NeedType** (Food, Shelter, Medicine)
  - **Status** (Pending, Planned, Fulfilled)
- **Donation**
  - **NeedId** (FK)
  - **UserId** (FK - Optional)
  - **DonorName**: Donor's name
  - **Amount**: Quantity
  - **Status**: Committed, Delivered

### 8. Report & NotificationItem (Reports and Notifications)
- **Report**: Issue reports and observations made by visitors/users.
- **NotificationItem**: System-generated notifications (e.g. "Emergency Feeding Required" warning created by the 6-hour rule).
