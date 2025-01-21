-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "vector";         -- For vector operations
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search operations

-- Start Transaction
BEGIN;

-- Enable Supabase Auth Schema
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;

-- Set up authentication trigger function for auto-setting organization_id
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'organization_id'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create Tables First
-- Organizations Table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Members Table
CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);


-- Users Table
CREATE TABLE users (
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

-- Tickets Table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    category VARCHAR(100),  -- For AI routing and classification
    sentiment VARCHAR(50),  -- For AI sentiment analysis
    customer_id UUID REFERENCES users(id),
    assignee_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    ai_metadata JSONB DEFAULT '{
        "auto_routed": false,
        "auto_responded": false,
        "confidence_score": null,
        "suggested_category": null,
        "suggested_priority": null,
        "topics": [],
        "entities": []
    }',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id),
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_internal BOOLEAN DEFAULT FALSE,
    sentiment VARCHAR(50),  -- For AI sentiment analysis
    intent VARCHAR(100),   -- For AI intent classification
    attachments JSONB DEFAULT '[]',
    ai_metadata JSONB DEFAULT '{
        "confidence_score": null,
        "suggested_responses": [],
        "entities": [],
        "topics": []
    }',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Table (Knowledge Base)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    author_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    embedding vector(1536),  -- For semantic search with OpenAI embeddings
    metadata JSONB DEFAULT '{}',
    ai_metadata JSONB DEFAULT '{
        "auto_tags": [],
        "related_articles": [],
        "summary": null,
        "topics": []
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Interactions Log (For training and improvement)
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    ticket_id UUID REFERENCES tickets(id),
    interaction_type VARCHAR(50) NOT NULL,
    prompt TEXT,
    response TEXT,
    confidence_score FLOAT,
    was_successful BOOLEAN,
    feedback TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Cards Table (For AI Training)
CREATE TABLE learning_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    creator_id UUID REFERENCES users(id),
    trigger TEXT NOT NULL,
    context TEXT NOT NULL,
    suggested_response TEXT,
    conversation_context TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Sessions Table
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    trainer_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
    cards_reviewed INTEGER DEFAULT 0,
    cards_approved INTEGER DEFAULT 0,
    cards_rejected INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Feedback Table
CREATE TABLE training_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    session_id UUID REFERENCES training_sessions(id),
    card_id UUID REFERENCES learning_cards(id),
    trainer_id UUID REFERENCES users(id),
    is_approved BOOLEAN NOT NULL,
    notes TEXT,
    training_notes TEXT,
    review_time INTEGER, -- Time spent reviewing in seconds
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_feedback ENABLE ROW LEVEL SECURITY;

-- Now Create Policies
-- Workspace policies
CREATE POLICY "Workspaces are viewable by workspace members" ON workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspaces are updatable by workspace admins" ON workspaces
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role = 'admin'
        )
    );

-- Workspace members policies
CREATE POLICY "Workspace members are viewable by workspace members" ON workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can be managed by workspace admins" ON workspace_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role = 'admin'
        )
    );

-- Replace existing organization policies with:
CREATE POLICY "Organizations are viewable by workspace members" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_members.workspace_id = organizations.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizations are insertable by authenticated users" ON organizations
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Organizations are updatable by workspace admins" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_members.workspace_id = organizations.workspace_id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role = 'admin'
        )
    );

-- Users: Can only see users in their organization
CREATE POLICY "Users are viewable by organization members" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own record" ON users
    FOR UPDATE USING (
        id = auth.uid()
    );

-- Replace existing ticket policies with:
DROP POLICY IF EXISTS "Tickets are viewable by organization members and owners" ON tickets;
DROP POLICY IF EXISTS "Tickets are insertable by authenticated users" ON tickets;
DROP POLICY IF EXISTS "Tickets are updatable by assignees and admins" ON tickets;

-- Viewing tickets
CREATE POLICY "Tickets are viewable by organization members and owners" ON tickets
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        OR customer_id = auth.uid()
        OR assignee_id = auth.uid()
    );

-- Creating tickets
CREATE POLICY "Authenticated users can create tickets" ON tickets
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- User must be setting themselves as the customer
            customer_id = auth.uid() OR
            -- Or be an admin/agent in the organization they're creating the ticket for
            (organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'agent')
            ))
        )
    );

-- Updating tickets
CREATE POLICY "Tickets are updatable by assignees and admins" ON tickets
    FOR UPDATE USING (
        assignee_id = auth.uid()
        OR auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = tickets.organization_id 
            AND role = 'admin'
        )
        OR customer_id = auth.uid()
    );

-- Messages: Users can see messages for tickets they have access to
CREATE POLICY messages_access_policy ON messages
    USING (
        ticket_id IN (
            SELECT id 
            FROM tickets 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE users.id = auth.uid()
            )
            OR customer_id = auth.uid()
            OR assignee_id = auth.uid()
        )
    );

-- Documents: Users can see published documents from their organization
CREATE POLICY documents_access_policy ON documents
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid()
        )
    );

-- AI Interactions: Only accessible by admins of the organization
CREATE POLICY ai_interactions_access_policy ON ai_interactions
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid()
            AND role = 'admin'
        )
    );

-- Learning Cards: Organization members can view, admins/agents can create
CREATE POLICY learning_cards_policy ON learning_cards
    USING (organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE users.id = auth.uid()
    ));

-- Training Sessions: Organization members can view their own sessions
CREATE POLICY training_sessions_policy ON training_sessions
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid()
        )
        AND (trainer_id = auth.uid() OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND role = 'admin'
        ))
    );

-- Training Feedback: Organization members can view, trainers can create
CREATE POLICY training_feedback_policy ON training_feedback
    USING (organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE users.id = auth.uid()
    ));

-- Essential Indexes for Performance
CREATE INDEX idx_tickets_organization ON tickets(organization_id);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

CREATE INDEX idx_messages_ticket ON messages(ticket_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sentiment ON messages(sentiment);

CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_ai_interactions_organization ON ai_interactions(organization_id);
CREATE INDEX idx_ai_interactions_ticket ON ai_interactions(ticket_id);

-- Additional Indexes for Training Tables
CREATE INDEX idx_learning_cards_organization ON learning_cards(organization_id);
CREATE INDEX idx_learning_cards_status ON learning_cards(status);
CREATE INDEX idx_learning_cards_priority ON learning_cards(priority);
CREATE INDEX idx_learning_cards_created_at ON learning_cards(created_at);

CREATE INDEX idx_training_sessions_organization ON training_sessions(organization_id);
CREATE INDEX idx_training_sessions_trainer ON training_sessions(trainer_id);
CREATE INDEX idx_training_sessions_status ON training_sessions(status);

CREATE INDEX idx_training_feedback_organization ON training_feedback(organization_id);
CREATE INDEX idx_training_feedback_session ON training_feedback(session_id);
CREATE INDEX idx_training_feedback_card ON training_feedback(card_id);

-- Full Text Search for Documents and Tickets
ALTER TABLE documents ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
    ) STORED;

CREATE INDEX idx_documents_search ON documents USING gin(search_vector);

ALTER TABLE tickets ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(subject, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX idx_tickets_search ON tickets USING gin(search_vector);

-- Simple Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_cards_updated_at
    BEFORE UPDATE ON learning_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;

-- Add Supabase specific indexes
CREATE INDEX idx_users_auth_id ON users(id);
CREATE INDEX idx_organizations_created ON organizations(created_at DESC);
CREATE INDEX idx_tickets_updated ON tickets(updated_at DESC);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Enable Full Text Search with proper language configuration
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_ts_config 
        WHERE cfgname = 'english_custom'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION english_custom (COPY = pg_catalog.english);
    END IF;
END $$;

-- Add Supabase Storage bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);
CREATE POLICY "Attachments are accessible by organization members" ON storage.objects
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = (
                SELECT organization_id FROM tickets 
                WHERE id = (storage.foldername(name))[1]::uuid
            )
        )
    );

-- Verify the transaction
DO $$ 
BEGIN
    -- Check if tables were created
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'organizations', 
            'users', 
            'tickets', 
            'messages', 
            'documents', 
            'ai_interactions',
            'learning_cards',
            'training_sessions',
            'training_feedback'
        )
    ) THEN
        RAISE EXCEPTION 'Table creation failed';
    END IF;

    -- Check if extensions are available
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname IN ('uuid-ossp', 'vector', 'pg_trgm')
    ) THEN
        RAISE EXCEPTION 'Required extensions are not available';
    END IF;
END $$;

-- Set up trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Commit the transaction
COMMIT;

-- Post-deployment verification
SELECT 'Database setup completed successfully' as status;

-- Verify Supabase specific setup
SELECT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
) as "Realtime Enabled",
EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'attachments'
) as "Storage Configured",
EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
) as "Auth Trigger Configured";

-- Essential Indexes for Performance
CREATE INDEX idx_organizations_workspace ON organizations(workspace_id);
