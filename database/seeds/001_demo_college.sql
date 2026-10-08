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
