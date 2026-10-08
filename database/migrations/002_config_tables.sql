-- ============================================================================
-- Migration 002: Pipelines, Stages, Transitions, and Custom Field Configuration
-- ============================================================================

-- Pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entity_type VARCHAR(100) DEFAULT 'request',
    icon VARCHAR(50),
    color VARCHAR(20),
    settings JSONB DEFAULT '{}'::jsonb,
    sla_config JSONB DEFAULT '{}'::jsonb,
    notification_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Pipeline Stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#6366f1',
    icon VARCHAR(50),
    "order" INTEGER DEFAULT 0 NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    entry_actions JSONB DEFAULT '[]'::jsonb,
    exit_actions JSONB DEFAULT '[]'::jsonb,
    required_field_ids JSONB DEFAULT '[]'::jsonb,
    sla_hours INTEGER,
    approval_required BOOLEAN DEFAULT FALSE,
    auto_assignment_config JSONB DEFAULT '{}'::jsonb,
    is_initial BOOLEAN DEFAULT FALSE,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Stage Transitions
CREATE TABLE IF NOT EXISTS stage_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    from_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
    to_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
    allowed_role_ids JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Custom Fields
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    field_type VARCHAR(50) NOT NULL, -- text, number, dropdown, date, file, boolean, multi_select, rich_text, etc.
    entity_type VARCHAR(50) NOT NULL DEFAULT 'request',
    is_required BOOLEAN DEFAULT FALSE,
    default_value JSONB,
    options JSONB DEFAULT '[]'::jsonb,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    placeholder VARCHAR(255),
    "order" INTEGER DEFAULT 0,
    visibility VARCHAR(20) DEFAULT 'visible',
    is_editable BOOLEAN DEFAULT TRUE,
    is_read_only BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Custom Field Values
CREATE TABLE IF NOT EXISTS custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Pipeline Fields (Mapping custom fields to pipelines / stages)
CREATE TABLE IF NOT EXISTS pipeline_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    "order" INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT FALSE,
    stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pipelines_college ON pipelines(college_id);
CREATE INDEX IF NOT EXISTS idx_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_college ON custom_fields(college_id);
CREATE INDEX IF NOT EXISTS idx_field_values_entity ON custom_field_values(entity_type, entity_id);
