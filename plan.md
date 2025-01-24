# Workspace Selection Integration Plan

## Database Changes
1. Add to `users` table:
   - `current_account_id`: UUID (references accounts.id) - for storing the user's currently selected workspace

Note: We'll use the existing tables:
- `accounts` table (serves as workspaces)
- `accounts_users` junction table (serves as workspace memberships)

## Frontend Implementation

### 1. State Management
- Enhance existing `useWorkspace` hook to:
  - Add `switchWorkspace(accountId: string)` function
  - Add `listWorkspaces()` function to fetch all available workspaces
  - Cache available workspaces list
  - Handle workspace switching and state updates

### 2. UI Components
- Add workspace selector dropdown in the Header component:
  - Current workspace name/icon
  - List of available workspaces
  - Quick workspace switching
  - Create new workspace option
- Add WorkspaceSettings page:
  - Workspace management
  - Member management
  - Workspace settings

### 3. Data Scoping
- Update existing queries to use the selected workspace:
  - Conversations
  - Customers
  - Channels
  - Tickets
  - Documents
- Add workspace context to all API calls

## Backend Implementation

### 1. Supabase Functions
- Create new endpoints:
  - `switch-workspace`: Update user's current workspace
  - `list-workspaces`: Get all workspaces user has access to
  - `create-workspace`: Create new workspace
  - `update-workspace`: Update workspace settings
  - `invite-member`: Add new member to workspace

### 2. Security Rules
- Update existing RLS policies to use current_account_id:
  ```sql
  CREATE POLICY "Users can only access their current workspace data"
  ON table_name
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM accounts_users 
      WHERE account_id = current_account_id
    )
  );
  ```

### 3. Data Migration
- No data migration needed since the structure already exists
- Add default current_account_id for existing users

## Testing Plan
1. Unit tests:
   - Workspace switching
   - Workspace list fetching
   - Permission checks
2. Integration tests:
   - Data isolation between workspaces
   - Workspace switching flow
   - Member management

## Deployment Steps
1. Add current_account_id column
2. Update RLS policies
3. Deploy new Supabase functions
4. Deploy frontend changes with workspace selector
5. Monitor workspace switching and data access patterns

## Future Enhancements
- Workspace-specific settings
- Custom branding per workspace
- Usage analytics per workspace
- Workspace-level API keys
- Cross-workspace data sharing options
