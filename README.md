# 🐾 PatiLink - Campus Stray Animal Care and Task Coordination System

> Web Programming Course Project

## 📋 About the Project

PatiLink is a web application that digitalizes the care processes of stray animals on university campuses. It aims to improve the quality of life of animals through volunteer coordination, QR-coded task verification, and an automatic care tracking system.

![PatiLink Dashboard](./ui-smoke.png)

### Core Features

| Feature | Description |
|---------|-------------|
| 🐱 Animal Management | Registration, tracking, and status monitoring of stray animals on campus |
| 📍 Location Tracking | Map-based management of feeding points |
| ✅ Task System | Assigning and tracking feeding, water, and care tasks for volunteers |
| 📱 QR Code Verification | Task completion approval using QR codes located at feeding points |
| ⏰ 6-Hour Care Rule | Background service that automatically marks animals as "Hungry" if they are not fed for 6 hours |
| 🏥 Health Records | Veterinarian examination, vaccination, and treatment history |
| 📦 Need Management | Tracking of needs such as food, shelter, and medicine |
| 🎁 Donation Management | Donation commitments and tracking for specified needs |
| 🔐 JWT Authentication | Role-based access control (Admin, Vet, Volunteer) |

## 🛠️ Technology Stack

### Backend
- **ASP.NET Core 8** — Minimal API architecture
- **Entity Framework Core** — ORM (Code-First approach)
- **SQLite / SQL Server** — Relational database (Default: SQLite)
- **JWT Bearer** — Token-based authentication
- **BCrypt.Net** — Password hashing
- **BackgroundService** — Scheduler (6-hour care rule)

### Frontend
- **React 19** (Created with Vite)
- **Tailwind CSS v4** — Utility-first CSS framework
- **React Router v7** — Page routing
- **Axios** — HTTP client
- **Lucide React** — Icon library

## 📂 Project Structure

```
patilink/
├── server/                        # Backend
│   └── PatiLink.Api/
│       ├── Data/
│       │   ├── PatiLinkDbContext.cs    # Database context class
│       │   └── DbSeeder.cs             # Seed data
│       ├── Models/
│       │   └── PatiLinkModels.cs       # Data models and DTOs
│       ├── Services/
│       │   └── CareStatusBackgroundService.cs  # 6-hour care scheduler
│       ├── Program.cs                  # API endpoints and configuration
│       └── appsettings.json            # Connection and JWT settings
├── client/                        # Frontend
│   └── src/
│       ├── api/
│       │   └── apiClient.js            # Axios interceptor configuration
│       ├── components/
│       │   ├── Navbar.jsx              # Navigation menu (Role-based)
│       │   ├── Footer.jsx              # Footer and quick links
│       │   └── ProtectedRoute.jsx      # Auth control (Higher-Order Component)
│       ├── contexts/
│       │   └── AuthContext.jsx         # Global user state management
│       ├── pages/
│       │   ├── Home.jsx                # Home page (statistics + critical warnings)
│       │   ├── Animals.jsx             # Animal list (Search and filtering)
│       │   ├── AnimalDetail.jsx        # Animal details, health and tasks
│       │   ├── Needs.jsx               # Need management
│       │   ├── Donations.jsx           # Donation management
│       │   ├── HealthLogs.jsx          # Health records
│       │   ├── FeedingPoints.jsx       # List of feeding points
│       │   ├── Contact.jsx             # Contact and campus reporting
│       │   ├── VolunteerPanel.jsx      # Volunteer panel (QR simulation)
│       │   └── AdminPanel.jsx          # Admin panel
│       ├── App.jsx                     # Main application component (Router)
│       ├── main.jsx                    # React root component
│       └── index.css                   # Tailwind CSS configuration
├── docs/                          # Documentation
│   └── database-schema.md              # Database models and tables
└── NuGet.Config
```

## 🚀 Setup and Run

### Requirements
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)

### Step 1: Start the Backend
```bash
cd patilink/server/PatiLink.Api
dotnet run
```
> The server runs by default on `http://localhost:5055`.
> On first run, a SQLite database named `PatiLink.db` and demo seed data are automatically created.
> 
> ⚠️ **Security Note:** The project uses a pre-configured, hardcoded JWT Secret in development (`appsettings.json`). Ensure this is replaced with a secure key stored in environment variables for production environments.

### Step 2: Start the Frontend
```bash
cd patilink/client
npm install      # Install dependencies on first run
npm run dev
```
> The React application runs on `http://localhost:5173`.
> API requests are automatically proxied to the backend (Vite Proxy).

## 👤 Demo Users

| Email | Password | Role |
|-------|----------|------|
| admin@patilink.edu.tr | 123 | Admin |
| vet@patilink.edu.tr | 123 | Vet |
| gonullu@patilink.edu.tr | 123 | Volunteer |

## 📱 Demo QR Codes

Codes that can be used in the QR simulation in the Volunteer Panel:

| QR Code | Location |
|---------|----------|
| QR-ENG-001 | Faculty of Engineering |
| QR-LIB-002 | Behind the Library |
| QR-SPO-003 | Sports Hall |

## 🔌 API Endpoints

### Authentication
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | New user registration |
| POST | `/api/auth/login` | Login (returns JWT token) |

### Animals
| Method | URL | Authorization | Description |
|--------|-----|---------------|-------------|
| GET | `/api/animals` | Public | List animals (filtering supported) |
| GET | `/api/animals/{id}` | Public | Animal details |
| POST | `/api/animals` | AdminOrVet | Add new animal |
| PUT | `/api/animals/{id}` | AdminOrVet | Update animal |
| DELETE| `/api/animals/{id}` | Admin | Delete animal |

### Tasks
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/tasks` | List tasks (filtered by userId) |
| POST | `/api/tasks` | Create new task |
| PATCH | `/api/tasks/{id}/assign` | Assign task to a volunteer |
| POST | `/api/tasks/{id}/complete` | Complete task with QR |

### Needs & Donations
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/needs` | List needs |
| POST | `/api/needs` | Report new need |
| PATCH | `/api/needs/{id}/status` | Update need status |
| GET | `/api/donations` | List donations |
| POST | `/api/donations` | New donation commitment |

### Other
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/summary` | Home page statistics |
| GET | `/api/locations` | List locations |
| GET | `/api/health-logs` | List health records |
| POST | `/api/qr/scan` | QR code scanning simulation |
| GET/POST | `/api/reports` | Send/list reports |
| GET/PATCH/DELETE | `/api/users` | Manage users |

## 🏗️ Architectural Decisions

1. **Minimal API**: Minimal API was preferred over the controller-based structure. It provides less boilerplate code and a faster development process.
2. **SQLite Support**: SQLite is used by default for ease of presentation and testing. You can switch to SQL Server instantly from `appsettings.json`.
3. **BackgroundService**: The 6-hour care rule is implemented using ASP.NET Core's built-in `BackgroundService` class. It runs every 15 minutes to update the status of animals that have not been fed.
4. **Vite Proxy**: The React development server automatically proxies API requests to the C# backend, avoiding CORS issues.
5. **Context API**: Frontend authentication operations and state management are handled via `AuthContext`.

## 📄 License

This project was developed within the scope of a university course assignment.
