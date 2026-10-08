# CampusFlow AI — Configurable College Administration Platform

> **Core Architectural Principle**: *Configuration should control behavior. Code should provide the platform engine.*

CampusFlow AI is a **metadata-driven, configurable college administration platform** where workflows, stages, fields, pipelines, roles, and authorization rules are administered dynamically without touching backend code.

---

## Project Structure

```
│
├── client/          [Frontend: React 19 + Vite, React Flow, Zustand, Vanilla CSS]
├── server/          [Backend: Node.js + Express, Drizzle ORM, Platform Engines, Gemini AI]
└── database/        [Supabase: PostgreSQL Migrations, Seeds, RLS Policies]
```

### Detailed Breakdown

```
One8-Agent/
│
├── client/                             # Frontend SPA
│   ├── src/
│   │   ├── api/                        # Axios client & API helpers
│   │   ├── components/
│   │   │   ├── ai/                     # Floating AI Assistant drawer
│   │   │   ├── fields/                 # Dynamic Field Renderer (text, number, dropdown, date, etc.)
│   │   │   ├── forms/                  # Dynamic Form Engine
│   │   │   ├── layout/                 # Navbar & Sidebar with Persona switcher
│   │   │   └── workflow/nodes/         # Custom React Flow Nodes (Trigger, Condition, Action, Schedule)
│   │   ├── pages/
│   │   │   ├── dashboard/              # Institutional KPI command center
│   │   │   ├── pipelines/              # Dynamic Kanban pipeline board & record drawer
│   │   │   ├── workflows/              # Whimsical-style Visual Workflow Canvas
│   │   │   ├── forms/                  # Dynamic form sandbox & payload inspector
│   │   │   ├── chat/                   # AI Agent conversational chat
│   │   │   └── admin/                  # Configuration Center (Pipelines, Fields, Role Matrix, Audit)
│   │   ├── stores/                     # Zustand state management (auth, config)
│   │   └── index.css                   # Glassmorphic dark design system & tokens
│   └── package.json
│
├── server/                             # Backend Platform Engine
│   ├── src/
│   │   ├── ai/                         # Google Gemini & metadata context builder
│   │   ├── config/                     # Database, Supabase, and Env config
│   │   ├── db/                         # Drizzle schema, migrations, seed runners
│   │   ├── engines/                    # Platform engines:
│   │   │   ├── workflow-engine.js      # Directed graph traversal, conditions, actions
│   │   │   ├── pipeline-engine.js      # State machine & stage transitions
│   │   │   ├── field-engine.js         # Custom field validation & type checking
│   │   │   ├── permission-engine.js    # Hierarchy resolution (College → Branch → Role → User)
│   │   │   ├── form-engine.js          # Dynamic form schema assembler
│   │   │   ├── notification-engine.js  # Multi-channel alert dispatcher
│   │   │   ├── scheduling-engine.js    # Node-cron scheduler for automations
│   │   │   └── audit-engine.js         # Configuration change audit logging
│   │   ├── middleware/                 # Auth JWT, permissions, validation, error handler
│   │   ├── routes/                     # Configuration and entity API routes
│   │   ├── app.js                      # Express app factory
│   │   └── index.js                    # Server startup
│   ├── tests/                          # Unit and integration tests
│   └── package.json
│
└── database/                           # Supabase Database
    ├── migrations/                     # 001 to 005 SQL migration scripts
    ├── seeds/                          # 001 to 004 Demo university dataset & visual workflows
    ├── policies/                       # Supabase Row Level Security (RLS) policies
    └── README.md                       # Setup and migration execution guide
```

---

## Key Capabilities

1. **Whimsical-Style Visual Workflow Builder**:
   - Visual drag-and-drop canvas powered by `@xyflow/react`
   - Custom nodes: **Trigger**, **Condition** (if/else branching), **Action** (stage movement, notification, user assignment), and **Schedule**
   - In-studio node property inspector drawer
   - One-click graph simulation with live DAG execution logs

2. **Dynamic Pipeline Board**:
   - Kanban board generated on-the-fly from pipeline stages and custom fields
   - Stage SLA timers and color coding
   - Strict transition rules with required field checks before advancing
   - Record detail drawer with audit history and custom field attributes

3. **Dynamic Form Engine**:
   - Assembles form layouts dynamically from the custom fields catalog
   - Supports: Text, Number, Dropdown, Multi-select, Boolean, Date, Rich Text, File Upload
   - Validates submissions against database field rules

4. **Role & Permission Matrix**:
   - Institutional permission matrix allowing granular access control (View, Create, Edit, Delete, Approve)
   - Quick Topbar Persona Switcher to immediately simulate **Super Admin**, **Dean**, **HOD**, or **Student** views

5. **Metadata-Guided Agentic AI**:
   - Assistant powered by Gemini API with fallback smart metadata engine
   - Reads active university pipelines and student records dynamically to answer queries and guide operations

---

## Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run Tests
```bash
npm test
```

### 3. Database Setup (Supabase)
Follow [`database/README.md`](database/README.md) to apply migrations and seeds either in your Supabase SQL Editor or locally:
```bash
npm run db:migrate
npm run db:seed
```

### 4. Start Development Servers
```bash
npm run dev
```
- Client runs at: `http://localhost:5173`
- Backend API runs at: `http://localhost:3001`
