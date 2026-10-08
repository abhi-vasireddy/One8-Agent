-- ============================================================================
-- Seed 001: Demo College, Campus, Branches, Departments, and Admin User
-- ============================================================================

-- Fixed UUIDs for predictable references across seed scripts
-- College: '11111111-1111-1111-1111-111111111111'
-- Campus:  '22222222-2222-2222-2222-222222222222'
-- Branch Engineering: '33333333-3333-3333-3333-333333333331'
-- Branch Management:  '33333333-3333-3333-3333-333333333332'
-- Branch Sciences:    '33333333-3333-3333-3333-333333333333'

INSERT INTO colleges (id, name, code, logo, settings)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Apex Institute of Technology & Management',
    'APEX-TECH',
    'https://images.unsplash.com/photo-1562774053-701939374585?w=200&auto=format&fit=crop&q=60',
    '{"theme": "dark", "timezone": "Asia/Kolkata", "academic_year": "2026-2027", "features": {"ai_agent": true, "workflows": true, "sla_tracking": true}}'::jsonb
) ON CONFLICT (code) DO NOTHING;

INSERT INTO campuses (id, college_id, name, code, address, settings)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'North Valley Main Campus',
    'CAMPUS-MAIN',
    'Academic Boulevard, Sector 4, Silicon Valley Corridor',
    '{"capacity": 15000, "is_main": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (id, college_id, campus_id, name, code, description, is_active)
VALUES 
(
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'School of Computer Science & Engineering',
    'ENG-CSE',
    'Undergraduate and Postgraduate programs in AI, Software Systems, and Cybersecurity',
    true
),
(
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'School of Business & Management',
    'MGMT-MBA',
    'Global MBA, FinTech, and Executive Leadership programs',
    true
),
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'School of Applied Sciences',
    'SCI-APP',
    'Data Science, Physics, and Nanotechnology departments',
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, college_id, branch_id, name, code, description, is_active)
VALUES
(
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    'Department of Artificial Intelligence & ML',
    'DEPT-AIML',
    'AI lab facilities, neural computing, robotics research',
    true
),
(
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    'Department of Software Engineering',
    'DEPT-SWE',
    'Cloud systems, web architectures, distributed systems',
    true
);

-- ============================================================================
-- Seed 002: Default Roles and Hierarchical Permissions
-- ============================================================================

-- Roles:
-- Super Admin: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'
-- Dean:        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'
-- HOD:         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'
-- Coordinator: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4'
-- Staff:       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5'
-- Student:     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6'

INSERT INTO roles (id, college_id, name, description, is_system)
VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '11111111-1111-1111-1111-111111111111',
    'Super Admin',
    'Full institutional control over workflows, configurations, roles, pipelines, and audit logs',
    true
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '11111111-1111-1111-1111-111111111111',
    'Dean',
    'Institutional review, high-level approvals, SLA monitoring across school branches',
    false
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '11111111-1111-1111-1111-111111111111',
    'Head of Department (HOD)',
    'Departmental request approvals, stage progression, student issue redressal',
    false
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    '11111111-1111-1111-1111-111111111111',
    'Pipeline Coordinator',
    'Manages day-to-day stage movements, assignments, and notifications within designated pipelines',
    false
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5',
    '11111111-1111-1111-1111-111111111111',
    'Staff Reviewer',
    'Verifies documentation, executes entry/exit reviews, writes status feedback',
    false
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',
    '11111111-1111-1111-1111-111111111111',
    'Student',
    'Submits requests, fills forms, tracks status, interacts with AI assistant',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Permissions for Super Admin (all resource types, all actions)
INSERT INTO permissions (role_id, resource_type, actions, conditions)
VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'all',
    '{"view": true, "create": true, "edit": true, "delete": true, "assign": true, "approve": true}'::jsonb,
    '{}'::jsonb
),
-- Permissions for HOD
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'pipeline',
    '{"view": true, "create": false, "edit": false, "delete": false, "assign": true, "approve": true}'::jsonb,
    '{"department": true}'::jsonb
),
-- Permissions for Student
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',
    'request',
    '{"view": true, "create": true, "edit": false, "delete": false, "assign": false, "approve": false}'::jsonb,
    '{"own_records": true}'::jsonb
);
-- ============================================================================
-- Seed 003: Demo Pipelines, Stages, Transitions, Custom Fields, and Requests
-- ============================================================================

-- Pipeline 1: Student Admissions & Enrollment
-- ID: '55555555-5555-5555-5555-555555555551'
INSERT INTO pipelines (id, college_id, branch_id, name, description, entity_type, icon, color, sla_config, notification_config)
VALUES (
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    'Fall 2026 Admissions & Verification',
    'Full student admission pipeline covering application screening, document validation, interviews, and enrollment confirmation',
    'admissions',
    'GraduationCap',
    '#6366f1',
    '{"default_sla_hours": 72, "warning_threshold_pct": 80}'::jsonb,
    '{"on_stage_change": true, "notify_applicant": true, "notify_assigned": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Stages for Admissions Pipeline
INSERT INTO pipeline_stages (id, pipeline_id, name, description, color, "order", is_initial, is_final, sla_hours, approval_required)
VALUES
(
    '66666666-6666-6666-6666-666666666611',
    '55555555-5555-5555-5555-555555555551',
    'Application Submitted',
    'Initial submission by applicant, waiting for intake review',
    '#3b82f6',
    0,
    true,
    false,
    24,
    false
),
(
    '66666666-6666-6666-6666-666666666612',
    '55555555-5555-5555-5555-555555555551',
    'Document Verification',
    'Academic transcripts, ID, and certificates verification by admissions office',
    '#8b5cf6',
    1,
    false,
    false,
    48,
    true
),
(
    '66666666-6666-6666-6666-666666666613',
    '55555555-5555-5555-5555-555555555551',
    'Faculty Interview',
    'Technical or departmental panel interview score recording',
    '#f59e0b',
    2,
    false,
    false,
    72,
    true
),
(
    '66666666-6666-6666-6666-666666666614',
    '55555555-5555-5555-5555-555555555551',
    'Offer Issued',
    'Provisional admission letter generated, waiting for fee deposit',
    '#10b981',
    3,
    false,
    false,
    96,
    false
),
(
    '66666666-6666-6666-6666-666666666615',
    '55555555-5555-5555-5555-555555555551',
    'Enrolled & Confirmed',
    'Fees paid, student ID generated, orientation batch assigned',
    '#059669',
    4,
    false,
    true,
    NULL,
    false
),
(
    '66666666-6666-6666-6666-666666666616',
    '55555555-5555-5555-5555-555555555551',
    'Application Rejected',
    'Does not meet criteria or failed interview',
    '#ef4444',
    5,
    false,
    true,
    NULL,
    false
)
ON CONFLICT (id) DO NOTHING;

-- Pipeline 2: Student Grievance Redressal
-- ID: '55555555-5555-5555-5555-555555555552'
INSERT INTO pipelines (id, college_id, branch_id, name, description, entity_type, icon, color, sla_config, notification_config)
VALUES (
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    'Student Grievance & Redressal Cell',
    'Formal escalation channel for academic, hostel, fee, or facility complaints with strict SLA tracking',
    'grievance',
    'AlertTriangle',
    '#ec4899',
    '{"default_sla_hours": 48, "warning_threshold_pct": 75}'::jsonb,
    '{"notify_hod": true, "notify_dean_on_breach": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Stages for Grievance Pipeline
INSERT INTO pipeline_stages (id, pipeline_id, name, description, color, "order", is_initial, is_final, sla_hours, approval_required)
VALUES
(
    '66666666-6666-6666-6666-666666666621',
    '55555555-5555-5555-5555-555555555552',
    'Grievance Logged',
    'Submitted by student with attached evidence',
    '#3b82f6',
    0,
    true,
    false,
    12,
    false
),
(
    '66666666-6666-6666-6666-666666666622',
    '55555555-5555-5555-5555-555555555552',
    'Investigation & Hearing',
    'Ombudsman or faculty committee investigating the matter',
    '#f59e0b',
    1,
    false,
    false,
    48,
    false
),
(
    '66666666-6666-6666-6666-666666666623',
    '55555555-5555-5555-5555-555555555552',
    'Resolution Proposed',
    'Redressal committee formulated solution awaiting student sign-off',
    '#10b981',
    2,
    false,
    false,
    24,
    true
),
(
    '66666666-6666-6666-6666-666666666624',
    '55555555-5555-5555-5555-555555555552',
    'Resolved & Closed',
    'Case successfully resolved and archived',
    '#059669',
    3,
    false,
    true,
    NULL,
    false
)
ON CONFLICT (id) DO NOTHING;

-- Custom Fields
INSERT INTO custom_fields (id, college_id, name, label, description, field_type, entity_type, is_required, options, placeholder)
VALUES
(
    '77777777-7777-7777-7777-777777777701',
    '11111111-1111-1111-1111-111111111111',
    'high_school_gpa',
    'High School / Qualifying Exam GPA',
    'Enter cumulative GPA on a 4.0 or 10.0 scale',
    'number',
    'request',
    true,
    '[]'::jsonb,
    'e.g. 3.85 or 9.2'
),
(
    '77777777-7777-7777-7777-777777777702',
    '11111111-1111-1111-1111-111111111111',
    'preferred_specialization',
    'Preferred Specialization',
    'Target major concentration',
    'dropdown',
    'request',
    true,
    '[{"label": "Artificial Intelligence & Robotics", "value": "ai_robotics"}, {"label": "Cloud Systems & DevOps", "value": "cloud_systems"}, {"label": "Cybersecurity & Cryptography", "value": "cybersec"}, {"label": "Data Science & Analytics", "value": "data_science"}]'::jsonb,
    'Select concentration'
),
(
    '77777777-7777-7777-7777-777777777703',
    '11111111-1111-1111-1111-111111111111',
    'scholarship_requested',
    'Apply for Merit Scholarship?',
    'Check if you want to be considered for institutional endowment fellowship',
    'boolean',
    'request',
    false,
    '[]'::jsonb,
    ''
),
(
    '77777777-7777-7777-7777-777777777704',
    '11111111-1111-1111-1111-111111111111',
    'grievance_category',
    'Grievance Category',
    'Area of concern',
    'dropdown',
    'request',
    true,
    '[{"label": "Academic & Grading Dispute", "value": "academic"}, {"label": "Hostel & Facilities", "value": "hostel"}, {"label": "Tuition & Accounts", "value": "tuition"}, {"label": "Disciplinary & Harassment", "value": "disciplinary"}]'::jsonb,
    'Select grievance category'
)
ON CONFLICT (id) DO NOTHING;

-- Map fields to pipelines
INSERT INTO pipeline_fields (pipeline_id, field_id, "order", is_required)
VALUES
('55555555-5555-5555-5555-555555555551', '77777777-7777-7777-7777-777777777701', 0, true),
('55555555-5555-5555-5555-555555555551', '77777777-7777-7777-7777-777777777702', 1, true),
('55555555-5555-5555-5555-555555555551', '77777777-7777-7777-7777-777777777703', 2, false),
('55555555-5555-5555-5555-555555555552', '77777777-7777-7777-7777-777777777704', 0, true)
ON CONFLICT DO NOTHING;

-- Seed Sample Requests in Admissions Pipeline
INSERT INTO requests (id, request_number, title, description, priority, pipeline_id, stage_id, branch_id, created_by, custom_field_values)
VALUES
(
    '88888888-8888-8888-8888-888888888801',
    'ADM-2026-001',
    'Liam Chen — B.Tech Computer Science (AI Track)',
    'Prospective applicant with 3.92 GPA from Cambridge International. Submitted Math Olympiad certificates.',
    'high',
    '55555555-5555-5555-5555-555555555551',
    '66666666-6666-6666-6666-666666666612',
    '33333333-3333-3333-3333-333333333331',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '{"high_school_gpa": 3.92, "preferred_specialization": "ai_robotics", "scholarship_requested": true}'::jsonb
),
(
    '88888888-8888-8888-8888-888888888802',
    'ADM-2026-002',
    'Sophia Martinez — Cybersecurity & Network Defense',
    'Applicant seeking fast-track interview scheduling. Background in capture-the-flag competitions.',
    'medium',
    '55555555-5555-5555-5555-555555555551',
    '66666666-6666-6666-6666-666666666613',
    '33333333-3333-3333-3333-333333333331',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '{"high_school_gpa": 3.81, "preferred_specialization": "cybersec", "scholarship_requested": false}'::jsonb
),
(
    '88888888-8888-8888-8888-888888888803',
    'ADM-2026-003',
    'Aarav Patel — Distributed Cloud Engineering',
    'Admissions letter sent. Awaiting tuition deposit payment clearance.',
    'medium',
    '55555555-5555-5555-5555-555555555551',
    '66666666-6666-6666-6666-666666666614',
    '33333333-3333-3333-3333-333333333331',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '{"high_school_gpa": 3.75, "preferred_specialization": "cloud_systems", "scholarship_requested": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
-- ============================================================================
-- Seed 004: Visual Workflow Definitions with React Flow Nodes & Edges
-- ============================================================================

INSERT INTO workflows (id, college_id, branch_id, pipeline_id, name, description, trigger_type, trigger_config, nodes, edges, is_active, version)
VALUES
(
    '99999999-9999-9999-9999-999999999901',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    '55555555-5555-5555-5555-555555555551',
    'Auto-Screening & Fast-Track Interview Routing',
    'Triggers when a new application is submitted. Evaluates GPA threshold: if GPA >= 3.8, sends fast-track interview invite, otherwise assigns to standard queue.',
    'stage_change',
    '{"pipeline_id": "55555555-5555-5555-5555-555555555551", "target_stage_id": "66666666-6666-6666-6666-666666666611"}'::jsonb,
    '[
        {
            "id": "node-1",
            "type": "trigger",
            "position": {"x": 250, "y": 80},
            "data": {
                "label": "Application Submitted",
                "triggerType": "stage_change",
                "pipeline": "Admissions 2026",
                "description": "Fires upon new applicant submission"
            }
        },
        {
            "id": "node-2",
            "type": "condition",
            "position": {"x": 250, "y": 220},
            "data": {
                "label": "High GPA Check (>= 3.8)",
                "field": "high_school_gpa",
                "operator": ">=",
                "value": 3.8,
                "description": "Evaluates candidate merit cutoff"
            }
        },
        {
            "id": "node-3",
            "type": "action",
            "position": {"x": 80, "y": 380},
            "data": {
                "label": "Fast-Track to Interview",
                "actionType": "change_stage",
                "targetStageId": "66666666-6666-6666-6666-666666666613",
                "description": "Skip standard triage straight to faculty interview"
            }
        },
        {
            "id": "node-4",
            "type": "action",
            "position": {"x": 420, "y": 380},
            "data": {
                "label": "Route to Document Verification",
                "actionType": "change_stage",
                "targetStageId": "66666666-6666-6666-6666-666666666612",
                "description": "Standard document scrutiny"
            }
        },
        {
            "id": "node-5",
            "type": "action",
            "position": {"x": 80, "y": 520},
            "data": {
                "label": "Notify Admissions Dean & Student",
                "actionType": "send_notification",
                "template": "fast_track_honors_invite",
                "recipient": "applicant_and_dean"
            }
        }
    ]'::jsonb,
    '[
        {"id": "e1-2", "source": "node-1", "target": "node-2", "animated": true},
        {"id": "e2-3", "source": "node-2", "target": "node-3", "sourceHandle": "true", "label": "Yes (GPA >= 3.8)", "style": {"stroke": "#10b981"}},
        {"id": "e2-4", "source": "node-2", "target": "node-4", "sourceHandle": "false", "label": "No (GPA < 3.8)", "style": {"stroke": "#f59e0b"}},
        {"id": "e3-5", "source": "node-3", "target": "node-5", "animated": true}
    ]'::jsonb,
    true,
    1
)
ON CONFLICT (id) DO NOTHING;
