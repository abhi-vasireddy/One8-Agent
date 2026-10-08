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
