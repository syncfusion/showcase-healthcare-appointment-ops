# Healthcare Appointment Operations — Blazor Showcase

An interactive, enterprise-grade healthcare operations portal built with **.NET 10 Blazor (Server)** and the **Syncfusion Blazor** UI suite. The app surfaces the operations of a multi-specialty clinic — appointments, schedules, providers, patients, waitlists, and analytics — and pairs them with an AI-assist layer for slot suggestions, care-plan drafts, and lab-report summarization.

---

## Technology Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Frontend framework | ASP.NET Core Blazor (Interactive Server) | .NET 10 (`net10.0`) |
| Backend framework | ASP.NET Core Web API | .NET 10 (`net10.0`) |
| Database | PostgreSQL (local or Azure) | 15+ |

### Syncfusion Blazor components (highlights)

| Component | Where it is used |
| --- | --- |
| `SfGrid` | Patients list, Providers list, Provider detail (template), Settings (Departments, Locations, Schedule templates), Patient detail — Appointments, Documents, Medications tabs |
| `SfSchedule` | Schedule page (department + provider filtered day / week views), Provider detail — Schedule tab |
| `SfChart` | Dashboard (volume + utilization), Reports (3 charts), Patient detail — Overview, Clinical History (vitals + labs), Provider detail — Analytics |
| `SfKanban` | Waitlist page — status columns |
| `SfAIAssistView` | Waitlist page — conversational AI optimization panel |
| `SfPdfViewer2` | Patient detail — Documents tab (lab report preview) |
| `SfDocumentEditorContainer` | Patient detail — Care Plan tab (authoring) |

Theme resource: `Syncfusion.Blazor.Themes` (loaded in `App.razor`).

---

## Prerequisites

- **.NET 10 SDK** — [download](https://dotnet.microsoft.com/download) 10.0.300 or later. Verify with `dotnet --version`.
- **PostgreSQL 15+** — local install or an Azure Database for PostgreSQL server.
- **Node-free toolchain** — this app is pure .NET; no `node_modules` are required.
- **Syncfusion license key** — A valid Syncfusion license or trial required.

---


### Syncfusion license
Set the license in user-secrets, an environment variable, or `appsettings.json`:
```powershell
# Option A — environment variable (preferred for local dev)
$env:SYNCFUSION_LICENSE_KEY = "your-key-here"

# Option B — appsettings.json
"Syncfusion": { "LicenseKey": "your-key-here" }
```

---

## Build
Run these commands from the `Blazor/` folder. 

```powershell
# build the Blazor project
dotnet build HealthcareAppointmentOps.Blazor.csproj -c Debug
```

---

## Run

The Blazor app depends on the `HealthcareAppointmentOps.Api` project (it calls `http://localhost:5186` by default). Start the API first, then the Blazor app. For database creation, migrations, and seeding, see the [root README](../README.md).

You'll need **two terminals** — one for the API (run from the `WebAPI/` folder) and one for the Blazor app (run from this `Blazor/` folder).

### 1. Start the API

In the first terminal, switch to the `WebAPI/` folder (a sibling of `Blazor/`) and start the API:

```powershell
cd ../WebAPI
dotnet run --project HealthcareAppointmentOps.Api --launch-profile http
# API → http://localhost:5186  (Swagger UI at /swagger)
```

### 2. Start the Blazor app

In the second terminal, from this `Blazor/` folder:

```powershell
dotnet run --project HealthcareAppointmentOps.Blazor --launch-profile https
# Blazor → https://localhost:7178  (also http://localhost:5174)
```

---

## License

This showcase is provided as a reference implementation. Syncfusion components require a valid [Syncfusion license](https://www.syncfusion.com/).
