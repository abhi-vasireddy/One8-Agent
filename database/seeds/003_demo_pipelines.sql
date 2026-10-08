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
