# Healthcare Appointment Operations Portal — React

An **enterprise-grade healthcare operations showcase** built with **React 19** and the **Syncfusion EJ2 React** UI suite. This application demonstrates how to compose a production-quality clinical workflow UI — appointments, scheduling, patient/provider management, analytics, AI assistance, reports, and audit — using modern React patterns (hooks, react-router, Vite) backed by a comprehensive Syncfusion component library.

---

## Technology Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Frontend framework | React | 19.1 |
| Language | TypeScript | 5.8 |
| Build tool | Vite | 8 |
| Backend framework | ASP.NET Core Web API | .NET 10 (`net10.0`) |
| Database | PostgreSQL (local or Azure) | 15+ |

### Syncfusion React components (highlights)

Verified by static scan of the `src/**/*.tsx` tree — every component below appears at least once in the source.

| Component | Where it is used |
| --- | --- |
| `GridComponent` (`ej2-react-grids`) | Patient detail — Appointments grid, Provider schedule templates |
| `ScheduleComponent` (`ej2-react-schedule`) | Schedule page, Provider detail — Schedule tab |
| `ChartComponent` (`ej2-react-charts`) | Dashboard, Reports, Patient detail — Overview, Clinical History, Provider analytics |
| `KanbanComponent` (`ej2-react-kanban`) | Waitlist page — status columns |
| `AIAssistViewComponent` (`ej2-react-interactive-chat`) | Waitlist page — conversational AI optimization panel |
| `PdfViewerComponent` (`ej2-react-pdfviewer`) | Patient detail — Documents tab (lab report preview) |
| `DocumentEditorContainerComponent` (`ej2-react-documenteditor`) | Patient detail — Care Plan tab (authoring) |

Theme resources: Syncfusion `tailwind3` CSS themes (loaded in `src/main.tsx`).

---

## Prerequisites

- **Node.js** 20.11+ (React 19 / Vite 8 requirement)
- **npm** 11+
- **.NET 10 SDK** — only required if you run the backend API locally. [Download](https://dotnet.microsoft.com/download) 10.0.300 or later.
- **PostgreSQL 15+** — local install or an Azure Database for PostgreSQL server. (Skip if the API is already running remotely.)
- **Syncfusion license key** — A valid Syncfusion license or trial required

---

## Installation

From the project root:

```bash
cd React
npm install
```

---

## Configuration

Copy `.env.example` to `.env` in the `React/` folder and update the values:

```bash
# .env
VITE_API_BASE_URL=http://localhost:5186
VITE_SYNCFUSION_LICENSE_KEY=YourSyncfusionLicenseKeyHere   # optional
```

| Key | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (defaults to `http://localhost:5186` if unset) |
| `VITE_SYNCFUSION_LICENSE_KEY` | Syncfusion license key (optional) |

---

## Build

```bash
# type-check (no emit)
npm run typecheck

# production build → dist/
npm run build

# preview the production build
npm run preview   # serves on http://localhost:5174
```

---

## Run

The React app depends on the `HealthcareAppointmentOps.Api` project (it calls `http://localhost:5186` by default). Start the API first, then the React dev server. For database creation, migrations, and seeding, see the [root README](../README.md).

You'll need **two terminals** — one for the API (run from the `WebAPI/` folder) and one for the React app (run from this `React/` folder).

### 1. Start the API

In the first terminal, switch to the `WebAPI/` folder (a sibling of `React/`) and start the API:

```bash
cd ../WebAPI
dotnet run --project HealthcareAppointmentOps.Api --launch-profile http
# API → http://localhost:5186  (Swagger UI at /swagger)
```

### 2. Start the React app

In the second terminal, from this `React/` folder:

```bash
npm run dev
# Dev server → http://localhost:5173
```

---

## License

This showcase is provided as a reference implementation. Syncfusion components require a valid [Syncfusion license](https://www.syncfusion.com/).
