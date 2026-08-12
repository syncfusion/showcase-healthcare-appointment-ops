# Healthcare Appointment Ops — Angular

An **enterprise-grade healthcare operations showcase** built with **Angular v22** and **Syncfusion EJ2 Angular UI** components. This application demonstrates how to compose a production-quality clinical workflow UI — appointments, scheduling, patient/provider management, analytics, AI assistance, reports, and audit — using modern Angular patterns (standalone components, signals, lazy-loaded routes) backed by a comprehensive Syncfusion component library.

It is part of the Syncfusion **showcase apps** suite and is designed to be referenced as a working blueprint for building real-world healthcare operations dashboards.

---

## Technology Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Frontend framework | Angular | 22 |
| Language | TypeScript | 5.x |
| Build tool | Angular CLI | 22 |
| Backend framework | ASP.NET Core Web API | .NET 10 (`net10.0`) |
| Database | PostgreSQL (local or Azure) | 15+ |

---

## Syncfusion Components (highlights)

| Component | Where it is used |
| --- | --- |
| Grid | Patient/provider/appointment/audit grids with sorting, filtering, paging |
| Scheduler | Provider scheduling with resource grouping |
| Kanban | Waitlist board |
| Sidebar | Primary navigation with auto-collapse |
| Charts | Dashboard and reporting analytics |
| PDF Viewer | Clinical document rendering |
| Document Editor | Care Plan authoring |
| AI AssistView | AI assistant (Interactive Chat) |

---

## Prerequisites

- **Node.js** 20.11+ (Angular v22 requirement)
- **npm** 11+

---

## Installation

From the repository root:

```bash
cd Angular
npm install
```

---

## Configuration

Edit the environment files under `src/environments/` to set backend and licensing values:

| Key | Purpose |
|---|---|
| `apiBaseUrl` | Backend API base URL |
| `syncfusionLicenseKey` | Syncfusion license key |

---

## Running the App

The backend API must be running first — see the [root README](../README.md) for database setup and how to start `HealthcareAppointmentOps.Api` (default `http://localhost:5186`).

You'll need **two terminals** — one for the API (run from the `WebAPI/` folder) and one for the Angular app (run from this `Angular/` folder).

### 1. Start the API

In the first terminal, switch to the `WebAPI/` folder (a sibling of `Angular/`) and start the API:

```bash
cd ../WebAPI
dotnet run --project HealthcareAppointmentOps.Api --launch-profile http
# API → http://localhost:5186  (Swagger UI at /swagger)
```

### 2. Start the Angular dev server

In the second terminal, from this `Angular/` folder:

```bash
npm start
# or
npx ng serve
```

Once running, open `http://localhost:4200/` in your browser.

### Watch build (development)

```bash
npm run watch
```

### Production build

```bash
npm run build
```

Build artifacts are written to the `dist/` directory, optimized for performance and speed.

---

## License

This showcase is provided as a reference implementation. Syncfusion components require a valid [Syncfusion license](https://www.syncfusion.com/).
