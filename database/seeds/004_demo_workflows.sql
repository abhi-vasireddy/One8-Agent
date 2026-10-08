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
