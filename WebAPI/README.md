# Healthcare Appointment Operations — Backend API

A .NET 10 ASP.NET Core Web API for healthcare appointment scheduling, waitlist management, provider utilization analytics, clinical history, and AI-assisted scheduling optimization. This backend serves the React, Angular, and Blazor frontends in the showcase.

## Technology Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Backend framework | ASP.NET Core Web API | .NET 10 (`net10.0`) |
| Architecture | Clean Architecture (Domain → Application → Infrastructure → API) | — |
| ORM | EF Core + Npgsql.EntityFrameworkCore.PostgreSQL | 9.0.4 |
| Database | PostgreSQL (local or Azure) | 15+ |
| API tooling | Swashbuckle (Swagger UI) | 10.2.1 |
| Port | `http://localhost:5186` | — |

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download) (10.0.300 or later)
- [PostgreSQL](https://www.postgresql.org/download/) 15+ (local) or Azure PostgreSQL
- Optional: [EF Core CLI](https://learn.microsoft.com/ef/core/cli/dotnet) (`dotnet tool install --global dotnet-ef`)

## Configuration

### Connection String
Update `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "HealthcareDatabase": "Host=localhost;Database=healthcareops;Username=YOUR_USER_NAME;Password=YOUR_PASSWORD;Include Error Detail=true;"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:4200",
      "http://localhost:5174",
      "https://localhost:7178"
    ]
  }
}
```

For Azure PostgreSQL:
```
Host=myserver.postgres.database.azure.com;Database=healthcareops;Username=myuser;Password=mypassword;Ssl Mode=Require
```

## Database Setup

### 1. Create the database
```bash
createdb healthcareops
```

### 2. Run migrations
```bash
dotnet ef database update \
  --project HealthcareAppointmentOps.Infrastructure \
  --startup-project HealthcareAppointmentOps.Api
```

### 3. Seed data (Development only)
Migrations and seeding run automatically on startup when `ASPNETCORE_ENVIRONMENT=Development`. Seeding is idempotent — each table is populated only if empty, so an existing database is left untouched. The full seeder is defined in `HealthcareAppointmentOps.Infrastructure/Persistence/SeedData/`.

## Local Execution

### Build
```bash
dotnet build HealthcareAppointmentOps.slnx
```

### Run
```bash
dotnet run --project HealthcareAppointmentOps.Api
```

The API will be available at:
- `http://localhost:5186`
- Swagger UI: `http://localhost:5186/swagger`

### With custom URL
```bash
dotnet run --project HealthcareAppointmentOps.Api --urls "http://localhost:5186"
```

## API Documentation (Swagger)

The API uses Swashbuckle to generate live API documentation at runtime:

- **Swagger UI**: `http://localhost:5186/swagger`


## Frontend Connection

The frontends are configured to connect to this API (default base URL `http://localhost:5186`):

- **React**: `React/.env` → `VITE_API_BASE_URL=http://localhost:5186`
- **Angular**: configured in the Angular app's environment
- **Blazor**: configured in `Program.cs` / `appsettings` (`ApiBaseUrl`)

CORS is enabled for `http://localhost:5173` (React), `http://localhost:4200` (Angular), `http://localhost:5174`, and `https://localhost:7178` (Blazor) in Development.

## License

This showcase is provided as a reference implementation. Syncfusion components require a valid [Syncfusion license](https://www.syncfusion.com/).