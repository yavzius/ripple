-- Migration to fix workspace-based setup

-- Start Transaction
BEGIN;

-- 0. Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create base tables in correct order
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    billing_email VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    ai_settings JSONB DEFAULT '{
        "auto_response": true,
        "auto_routing": true,
        "auto_tagging": true,
        "confidence_threshold": 0.8
    }',
    workspace_id UUID REFERENCES workspaces(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    expertise JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

-- 2. Create or update the auth trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID;
    default_workspace_id UUID;
BEGIN
    -- Get or create default workspace
    INSERT INTO workspaces (name, slug)
    SELECT 'Default Workspace', 'default'
    WHERE NOT EXISTS (SELECT 1 FROM workspaces LIMIT 1)
    RETURNING id INTO default_workspace_id;

    IF default_workspace_id IS NULL THEN
        SELECT id INTO default_workspace_id FROM workspaces ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Get or create default organization
    INSERT INTO organizations (name, workspace_id)
    SELECT 'Default Organization', default_workspace_id
    WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1)
    RETURNING id INTO default_org_id;

    IF default_org_id IS NULL THEN
        SELECT id INTO default_org_id FROM organizations ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Create user
    INSERT INTO public.users (id, email, full_name, avatar_url, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        default_org_id
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();

    -- Add user to workspace
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (default_workspace_id, NEW.id, 'member')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Ensure the trigger is set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create default workspace if none exists
DO $$ 
DECLARE
    default_workspace_id UUID;
BEGIN
    -- Create default workspace if it doesn't exist
    INSERT INTO workspaces (name, slug)
    SELECT 'Default Workspace', 'default'
    WHERE NOT EXISTS (SELECT 1 FROM workspaces LIMIT 1)
    RETURNING id INTO default_workspace_id;

    -- Get the default workspace ID if we didn't create one
    IF default_workspace_id IS NULL THEN
        SELECT id INTO default_workspace_id FROM workspaces ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Update organizations without a workspace
    UPDATE organizations 
    SET workspace_id = default_workspace_id
    WHERE workspace_id IS NULL;
END $$;

-- 4. Sync auth users with public users
INSERT INTO public.users (id, email, full_name)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'full_name'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Add all existing users to their organization's workspace
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT DISTINCT o.workspace_id, u.id, 
    CASE 
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role = 'agent' THEN 'member'
        ELSE 'member'
    END as role
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE o.workspace_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.id)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 6. Update RLS policies

-- First drop all existing policies to start clean
DROP POLICY IF EXISTS "Workspaces are viewable by members" ON workspaces;
DROP POLICY IF EXISTS "Organizations are viewable by workspace members" ON organizations;
DROP POLICY IF EXISTS "Organizations are insertable by workspace admins" ON organizations;
DROP POLICY IF EXISTS "Users are viewable by workspace members" ON users;
DROP POLICY IF EXISTS "Tickets are viewable by workspace members" ON tickets;
DROP POLICY IF EXISTS "Tickets are creatable by workspace members" ON tickets;
DROP POLICY IF EXISTS "Workspace members are viewable" ON workspace_members;

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Workspace members policy (base policy that others will reference)
CREATE POLICY "Workspace members are viewable" ON workspace_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Workspace policies
CREATE POLICY "Workspaces are viewable by members" ON workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Organization policies
CREATE POLICY "Organizations are viewable by workspace members" ON organizations
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organizations are insertable by workspace admins" ON organizations
    FOR INSERT TO public
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- User policies
CREATE POLICY "Users are viewable by workspace members" ON users
    FOR SELECT USING (
        id = auth.uid() OR -- Can always see themselves
        id IN ( -- Can see other members in their workspaces
            SELECT user_id FROM workspace_members wm
            WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- Ticket policies
CREATE POLICY "Tickets are viewable by workspace members" ON tickets
    FOR SELECT USING (
        customer_id = auth.uid() OR -- Can see their own tickets
        assignee_id = auth.uid() OR -- Can see tickets assigned to them
        organization_id IN ( -- Can see tickets in their workspace organizations
            SELECT id FROM organizations
            WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Tickets are creatable by workspace members" ON tickets
    FOR INSERT TO public
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            customer_id = auth.uid() OR -- Can create tickets for themselves
            organization_id IN ( -- Can create tickets for their workspace organizations
                SELECT o.id FROM organizations o
                JOIN workspace_members wm ON wm.workspace_id = o.workspace_id
                WHERE wm.user_id = auth.uid()
            )
        )
    );

-- Add update policies
CREATE POLICY "Tickets are updatable by workspace members" ON tickets
    FOR UPDATE USING (
        customer_id = auth.uid() OR -- Can update their own tickets
        assignee_id = auth.uid() OR -- Can update tickets assigned to them
        organization_id IN ( -- Can update tickets in their workspace organizations
            SELECT id FROM organizations
            WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members
                WHERE user_id = auth.uid()
                AND role IN ('admin', 'member') -- Only admins and members can update
            )
        )
    );

CREATE POLICY "Organizations are updatable by workspace admins" ON organizations
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can update themselves" ON users
    FOR UPDATE USING (
        id = auth.uid()
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_organizations_workspace ON organizations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_organization ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);

COMMIT;

-- Verification queries (run these after the migration)
SELECT 
    (SELECT COUNT(*) FROM workspaces) as workspace_count,
    (SELECT COUNT(*) FROM organizations WHERE workspace_id IS NULL) as orgs_without_workspace,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM workspace_members) as workspace_members_count,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM users u WHERE NOT EXISTS (
        SELECT 1 FROM auth.users au WHERE au.id = u.id
    )) as orphaned_users;
