# Healthcare Appointment Operations Portal

A showcase application for **healthcare appointment scheduling, waitlist management, provider utilization analytics, and AI-assisted scheduling optimization**, built in three parallel frontends — **React**, **Angular**, and **Blazor** — that share a single .NET 10 backend API.

---

## Overview

The Healthcare Appointment Operations Portal is an internal clinical operations tool that helps front-desk staff, schedulers, and operations managers run a busy outpatient practice. It centralizes the workflows that today live across spreadsheets, phone calls, and a legacy EMR:

- **Schedule patients** with the right provider at the right time, respecting template-based availability and conflict rules.
- **Triage a waitlist** of patients waiting for earlier or later slots, matching them to openings as they appear.
- **Track provider utilization, no-show trends, and appointment volume** through operational analytics.
- **Get AI assistance** for schedule optimization and appointment suggestions.

> This is a showcase application with deterministic sample data. It is not intended to be used in production without adding production authentication, authorization, auditing, secrets management, and operational controls.

### Key Syncfusion Components Used


- **Data grid** — `Grid` / `SfGrid` with paging, sorting, filtering, adaptive UI, and row templates
- **Scheduler** — `Schedule` / `SfSchedule` for the appointment calendar
- **Charts** — `Chart` / `SfChart` (line, column, area) for analytics
- **Kanban** — `Kanban` / `SfKanban` for waitlist triage
- **Interactive Chat** — `AIAssistView` / `SfAIAssistView` for AI workflows
- **File Viewers & Editors** — `PdfViewer` and `DocumentEditor` for clinical documents and intake forms
- **Navigations** - `Sidebar`, `ListView`, `Tabs`
- **Notifications** — `Toast`, `ProgressBar`

---

## Intended audience

This showcase is useful for engineering leaders, architects, product teams, and developers evaluating how a modern healthcare can be implemented with a API and multiple enterprise web frameworks.

## Why Syncfusion Code Studio and UI components?

This repository is a practical proof of how [Syncfusion Code Studio](https://www.syncfusion.com/code-studio/) and the [Syncfusion component ecosystem](https://www.syncfusion.com/) can accelerate component-rich enterprise development.

- Code Studio can help teams plan features, generate and refine code, debug issues, and create tests with awareness of the existing codebase.
- Production-oriented UI components reduce the amount of custom code required for advanced grids, charts, scheduling, Kanban workflows, maps, document editing, and AI experiences.
- Similar component concepts across Angular, React, and Blazor make it easier to preserve business behavior while choosing the framework that best fits each team.
- Built-in capabilities such as filtering, grouping, export, responsive rendering, accessibility, and theming help teams focus on business workflows rather than foundational UI infrastructure.

## Technology Stack

| Layer | Technology |
| --- | --- |
| API | ASP.NET Core Web API on .NET 10 |
| Data | Entity Framework Core and PostgreSQL |
| Angular client | Angular 21, TypeScript, RxJS, Syncfusion Angular UI |
| React client | React 19, TypeScript, Vite, Syncfusion React UI |
| Blazor client | Blazor on .NET 10, Syncfusion Blazor UI |

---

## Project Structure

The repository root holds three parallel frontends and a shared .NET 10 backend. The backend is a four-project Clean Architecture solution that lives under `WebAPI/`.

```text
├── Angular/                                    # Angular 22 frontend
├── Blazor/                                     # Blazor Server frontend
├── React/                                      # React 19 + Vite frontend
└── WebAPI/
    ├── HealthcareAppointmentOps.slnx           # Solution file
    ├── HealthcareAppointmentOps.Domain/         # Entities, enums, value objects
    ├── HealthcareAppointmentOps.Application/    # DTOs, services, repository interfaces
    ├── HealthcareAppointmentOps.Infrastructure/ # EF Core, repositories, migrations, seeding
    └── HealthcareAppointmentOps.Api/            # Controllers, middleware, Program.cs
```

---

## Getting Started

### Prerequisites
- **Node.js 20+** and **npm 11+** (for React and Angular)
- **.NET 10 SDK** (10.0.300 or later) (for the API and Blazor)
- **PostgreSQL 15+** (local) or an Azure PostgreSQL connection string
- **EF Core CLI** (optional): `dotnet tool install --global dotnet-ef`
- **Syncfusion license** — A valid Syncfusion license or trial required

### 1. Start the backend

```bash
cd WebAPI
createdb healthcareops
dotnet build HealthcareAppointmentOps.slnx
dotnet run --project HealthcareAppointmentOps.Api --launch-profile http
```

The API will be available at `http://localhost:5186`. Migrations and seed data apply automatically in Development.

### 2. Start a frontend

**React** (port 5173):
```bash
cd React
npm install
npm run dev
```

**Angular** (port 4200):
```bash
cd Angular
npm install
ng serve
```

**Blazor** (https on 7178, http on 5174):
```bash
cd Blazor
dotnet run --launch-profile https
```

All three clients are preconfigured to talk to `http://localhost:5186` for the API.

---

## Licensing

Syncfusion packages are governed by Syncfusion's licensing terms. Review the [Syncfusion licensing documentation](https://www.syncfusion.com/sales/licensing) before redistributing or deploying the applications. Publishing this source repository does not grant a license to Syncfusion products.
