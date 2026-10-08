# CampusFlow AI — Supabase Database Architecture

## Structure

```
database/
├── migrations/
│   ├── 001_initial_schema.sql         # Extensions, colleges, campuses, branches, departments, users
│   ├── 002_config_tables.sql          # Pipelines, stages, transitions, custom fields, values
│   ├── 003_permissions.sql            # Roles, hierarchical permissions, user_roles
│   ├── 004_workflow_tables.sql        # Workflows, executions, logs, schedules, forms, routing
│   └── 005_audit_sla_entities.sql     # Audit logs, SLA rules, requests, messages, notifications
├── seeds/
│   ├── 001_demo_college.sql           # Apex Institute demo data & initial admin user
│   ├── 002_default_roles.sql          # Role hierarchy (Super Admin, Dean, HOD, Coordinator, Student)
│   ├── 003_demo_pipelines.sql         # Admissions & Grievance pipelines with custom fields & sample records
│   └── 004_demo_workflows.sql         # React Flow visual workflow DAG definitions
├── policies/
│   └── rls_policies.sql               # Supabase Row Level Security (RLS) policies
└── README.md
```

## Running Migrations & Seeds

### Option A: Using Supabase Dashboard (SQL Editor)
1. Go to your Supabase Project -> **SQL Editor**.
2. Run each script in `database/migrations/` in numerical order (001 to 005).
3. Run each script in `database/seeds/` in numerical order (001 to 004).
4. Run `database/policies/rls_policies.sql` to activate Row Level Security.

### Option B: Automatic Migration via Node.js
From the root directory:
```bash
npm run db:migrate
npm run db:seed
```
Make sure `DATABASE_URL` in `server/.env` points to your Supabase PostgreSQL connection string (Transaction Pooler or Direct Connection port 5432).
