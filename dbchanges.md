# Database Migration: Channel-based Messaging System

## Pre-Migration: Optimize Users Table

```sql
-- Start Transaction
BEGIN;

-- 1. Remove redundant fields from public.users that exist in auth.users
ALTER TABLE public.users
    DROP COLUMN IF EXISTS email,  -- Already in auth.users
    DROP COLUMN IF EXISTS avatar_url;  -- Move to metadata

-- 2. Add metadata field for additional user info
ALTER TABLE public.users
    ADD COLUMN metadata JSONB DEFAULT '{}';

-- 3. Update the handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        full_name,
        metadata,
        organization_id
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        jsonb_build_object(
            'avatar_url', NEW.raw_user_meta_data->>'avatar_url',
            'email', NEW.email
        ),
        NEW.raw_user_meta_data->>'organization_id'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

COMMIT;
```

## Migration Steps

```sql
-- Start Transaction
BEGIN;

-- 1. Create Channels Table (MVP)
CREATE TABLE public.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('chat', 'email')),
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Add index for faster lookups
CREATE INDEX idx_channels_workspace ON public.channels(workspace_id);
CREATE INDEX idx_channels_type ON public.channels(type);

-- Create function to handle new workspace creation
CREATE OR REPLACE FUNCTION public.handle_workspace_channels() 
RETURNS TRIGGER AS $$
BEGIN
    -- Create chat channel
    INSERT INTO public.channels (workspace_id, name, type, config)
    VALUES (
        NEW.id,
        NEW.name || ' Chat',
        'chat',
        jsonb_build_object(
            'description', 'Default chat channel for ' || NEW.name,
            'auto_archive_days', 30
        )
    );

    -- Create email channel
    INSERT INTO public.channels (workspace_id, name, type, config)
    VALUES (
        NEW.id,
        NEW.name || ' Email',
        'email',
        jsonb_build_object(
            'description', 'Default email channel for ' || NEW.name,
            'auto_archive_days', 90,
            'email_settings', jsonb_build_object(
                'forward_to', array[]::text[],
                'auto_reply_enabled', false
            )
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new workspace creation
DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
CREATE TRIGGER on_workspace_created
    AFTER INSERT ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_workspace_channels();

-- 2. Modify Messages Table
ALTER TABLE public.messages 
    DROP CONSTRAINT IF EXISTS messages_ticket_id_fkey,
    ADD COLUMN channel_id UUID REFERENCES public.channels(id),
    ADD COLUMN metadata JSONB DEFAULT '{}';

-- Add index for channel lookups
CREATE INDEX idx_messages_channel ON public.messages(channel_id);

-- 3. Update RLS Policies

-- Channel policies
CREATE POLICY "Enable read access for workspace members" ON public.channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members 
            WHERE workspace_members.user_id = auth.uid() 
            AND workspace_members.workspace_id = channels.workspace_id
        )
    );

CREATE POLICY "Enable insert for workspace admins" ON public.channels
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members 
            WHERE workspace_members.user_id = auth.uid() 
            AND workspace_members.workspace_id = NEW.workspace_id 
            AND workspace_members.role = 'admin'
        )
    );

CREATE POLICY "Enable update for workspace admins" ON public.channels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members 
            WHERE workspace_members.user_id = auth.uid() 
            AND workspace_members.workspace_id = channels.workspace_id 
            AND workspace_members.role = 'admin'
        )
    );

-- Update message policies
DROP POLICY IF EXISTS "messages_access_policy" ON public.messages;

CREATE POLICY "Enable read access for workspace members" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members 
            JOIN public.channels ON channels.workspace_id = workspace_members.workspace_id
            WHERE workspace_members.user_id = auth.uid() 
            AND channels.id = messages.channel_id
        )
    );

CREATE POLICY "Enable insert for workspace members" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members 
            JOIN public.channels ON channels.workspace_id = workspace_members.workspace_id
            WHERE workspace_members.user_id = auth.uid() 
            AND channels.id = NEW.channel_id
        )
    );

-- 4. Data Migration Function
CREATE OR REPLACE FUNCTION public.migrate_existing_messages()
RETURNS void AS $$
DECLARE
    default_channel_id UUID;
    workspace_record RECORD;
BEGIN
    FOR workspace_record IN SELECT id, name FROM public.workspaces LOOP
        -- Create default channel
        INSERT INTO public.channels (workspace_id, name)
        VALUES (workspace_record.id, workspace_record.name || ' General')
        RETURNING id INTO default_channel_id;

        -- Update existing messages
        UPDATE public.messages m
        SET channel_id = default_channel_id
        FROM public.organizations o
        WHERE m.organization_id = o.id 
        AND o.workspace_id = workspace_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.migrate_existing_messages TO authenticated;

-- 5. Add Performance Indexes
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_channels_active ON public.channels(is_active);

-- 6. Enable Realtime
BEGIN;
  -- Check if publication exists
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END $$;

  -- Add table to publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
COMMIT;

-- 7. Add Updated At Trigger
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON public.channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Run Verification
DO $$ 
BEGIN
    -- Check if tables exist
    ASSERT EXISTS(
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'channels'
    ), 'Tables not created properly';

    -- Check if RLS is enabled
    ASSERT EXISTS(
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'channels' 
        AND rowsecurity = true
    ), 'RLS not enabled on channels';

    -- Check if policies exist
    ASSERT EXISTS(
        SELECT FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'channels'
    ), 'Policies not created properly';

    -- Check if realtime is enabled
    ASSERT EXISTS(
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'channels' 
        AND pubname = 'supabase_realtime'
    ), 'Realtime not configured properly';

    -- Check if trigger exists
    ASSERT EXISTS(
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_workspace_created'
    ), 'Workspace trigger not created properly';

    -- Check if both channel types exist for each workspace
    ASSERT NOT EXISTS(
        SELECT workspace_id 
        FROM public.workspaces w
        WHERE NOT EXISTS (
            SELECT 1 FROM public.channels 
            WHERE workspace_id = w.id 
            AND type = 'chat'
        )
        OR NOT EXISTS (
            SELECT 1 FROM public.channels 
            WHERE workspace_id = w.id 
            AND type = 'email'
        )
    ), 'Default channels not created for all workspaces';

    RAISE NOTICE 'All checks passed successfully';
END $$;
```

## Rollback Plan

```sql
BEGIN;

-- Disable realtime
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.channels;

-- Drop triggers
DROP TRIGGER IF EXISTS update_channels_updated_at ON public.channels;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_messages_created_at;
DROP INDEX IF EXISTS public.idx_channels_active;
DROP INDEX IF EXISTS public.idx_channels_workspace;
DROP INDEX IF EXISTS public.idx_channels_type;
DROP INDEX IF EXISTS public.idx_messages_channel;

-- Drop function
DROP FUNCTION IF EXISTS public.migrate_existing_messages();

-- Drop policies (they will be dropped automatically with tables, but just to be explicit)
DROP POLICY IF EXISTS "Enable read access for workspace members" ON public.channels;
DROP POLICY IF EXISTS "Enable insert for workspace admins" ON public.channels;
DROP POLICY IF EXISTS "Enable update for workspace admins" ON public.channels;
DROP POLICY IF EXISTS "Enable read access for workspace members" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for workspace members" ON public.messages;

-- Drop tables and columns
DROP TABLE IF EXISTS public.channels CASCADE;

ALTER TABLE public.messages 
    DROP COLUMN IF EXISTS channel_id,
    DROP COLUMN IF EXISTS metadata;

-- Add to rollback
DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
DROP FUNCTION IF EXISTS public.handle_workspace_channels();

COMMIT;
```

## Post-Migration Steps

1. Run the migration function:
```sql
SELECT public.migrate_existing_messages();
```

2. Verify data migration:
```sql
-- Check if all messages have been assigned to channels
SELECT COUNT(*) as messages_without_channel 
FROM public.messages 
WHERE channel_id IS NULL;

-- Check channel creation
SELECT 
    w.name as workspace_name,
    c.name as channel_name,
    c.is_active,
    COUNT(m.id) as message_count
FROM public.workspaces w
JOIN public.channels c ON c.workspace_id = w.id
LEFT JOIN public.messages m ON m.channel_id = c.id
GROUP BY w.name, c.name, c.is_active;

-- Verify RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'channels';

-- Verify realtime
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'channels';
```

-- Add to verification queries:
```sql
-- Verify default channels
SELECT 
    w.name as workspace_name,
    COUNT(CASE WHEN c.type = 'chat' THEN 1 END) as chat_channels,
    COUNT(CASE WHEN c.type = 'email' THEN 1 END) as email_channels
FROM public.workspaces w
LEFT JOIN public.channels c ON c.workspace_id = w.id
GROUP BY w.name
HAVING COUNT(CASE WHEN c.type = 'chat' THEN 1 END) = 0
    OR COUNT(CASE WHEN c.type = 'email' THEN 1 END) = 0;
```
