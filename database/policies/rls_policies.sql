-- ============================================================================
-- Supabase Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on key tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Users table policies
CREATE POLICY "Users can read own profile and colleagues in same college"
ON users FOR SELECT
USING (
    auth.uid()::text = auth_id 
    OR college_id = (SELECT college_id FROM users WHERE auth_id = auth.uid()::text LIMIT 1)
);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid()::text = auth_id);

-- 2. Configuration tables read access for authenticated college members
CREATE POLICY "College members can read active pipelines"
ON pipelines FOR SELECT
USING (
    college_id = (SELECT college_id FROM users WHERE auth_id = auth.uid()::text LIMIT 1)
    AND is_archived = false
);

CREATE POLICY "College members can read pipeline stages"
ON pipeline_stages FOR SELECT
USING (
    pipeline_id IN (
        SELECT id FROM pipelines WHERE college_id = (
            SELECT college_id FROM users WHERE auth_id = auth.uid()::text LIMIT 1
        )
    )
);

CREATE POLICY "College members can read custom fields"
ON custom_fields FOR SELECT
USING (
    college_id = (SELECT college_id FROM users WHERE auth_id = auth.uid()::text LIMIT 1)
);

-- 3. Requests table policies
CREATE POLICY "Users can read requests they created or are assigned to"
ON requests FOR SELECT
USING (
    created_by = (SELECT id FROM users WHERE auth_id = auth.uid()::text LIMIT 1)
    OR assigned_user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text LIMIT 1)
    OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text LIMIT 1)
        AND r.name IN ('Super Admin', 'Dean', 'Head of Department (HOD)')
    )
);

CREATE POLICY "Authenticated users can create requests"
ON requests FOR INSERT
WITH CHECK (
    created_by = (SELECT id FROM users WHERE auth_id = auth.uid()::text LIMIT 1)
);
