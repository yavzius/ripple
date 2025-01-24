# Admin Invite System Implementation Plan

## 1. Enhance Existing Settings UI
### Update User Management Section
- [x] Modify existing Dialog form in Settings.tsx:
  - [x] Required fields:
    - [x] Email (required)
    - [x] First Name (required)
    - [x] Last Name (optional)
    - [x] Role (required)
  - [x] Add form validation using react-hook-form:
    - [x] Email format validation
    - [x] Required field checks
  - [x] Update loading states during submission

### Admin Access Control
- [x] Add role verification to Settings page:
  ```typescript
  const { workspace } = useWorkspace();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user has admin role in accounts_users table
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && workspace) {
        const { data } = await supabase
          .from('accounts_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('account_id', workspace.id)
          .single();
        
        setIsAdmin(data?.role === 'admin');
      }
    };
    checkAdminStatus();
  }, [workspace]);
  ```
- [x] Hide "Add User" button for non-admins

## 2. Backend Integration
### Create Admin Auth Client
- [x] Create a secure Edge Function for admin auth operations:
  - [x] Set up service role authentication
  - [x] Disable token refresh and session persistence
  - [x] Never expose service role key in the browser

### Update User Creation Flow
- [x] Create Edge Function endpoint for creating users:
  - [x] Accept email, role, and user details
  - [x] Use `auth.admin.createUser()` with service role:
    ```typescript
    // Example flow in Edge Function
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true, // Auto-confirm their email
      user_metadata: {
        first_name,
        last_name
      }
    });

    if (newUser) {
      // Create users record
      await supabase.from('users').insert({
        id: newUser.id,
        email: email,
        first_name,
        last_name
      });

      // Create accounts_users association
      await supabase.from('accounts_users').insert({
        user_id: newUser.id,
        account_id,
        role
      });
    }
    ```
  - [x] Send welcome email with temporary password
  - [x] Add proper error handling

### Error Handling
- [x] Add error states to form:
  - [x] "Failed to create user"
  - [x] "Email already exists"
  - [x] Show errors in UI using toast notifications
  - [x] Maintain form state on error

## 3. User List Management
### Enhance Users State
- [x] Update users data structure to match database:
  ```typescript
  interface User {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: string | null;  // From accounts_users table
  }
  ```
- [x] Add loading state for users list
- [x] Implement real-time updates using Supabase subscriptions

### List Functionality
- [x] Replace mock data with real users query:
  ```typescript
  const fetchUsers = async () => {
    if (!workspace) return;
    
    const { data } = await supabase
      .from('accounts_users')
      .select(`
        user_id,
        role,
        users:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('account_id', workspace.id);
    
    setUsers(data?.map(record => ({
      id: record.users.id,
      first_name: record.users.first_name,
      last_name: record.users.last_name,
      email: record.users.email,
      role: record.role
    })) || []);
  };
  ```
- [x] Show user role from accounts_users table
- [x] Implement list refresh after successful invite

## 4. Success Handling
### UI Updates
- [x] Clear form after successful invite
- [x] Close dialog after success
- [x] Show success toast: "User added successfully"
- [x] Refresh users list to show new user

### State Management
- [x] Update local users state with new user
- [x] Handle Supabase real-time updates
- [x] Maintain consistent UI state

## 5. Testing
### Test Cases
- [x] Admin access:
  - [x] Settings page access control
  - [x] Add User button visibility
  - [x] Form submission permissions

- [x] Invite functionality:
  - [x] Form validation
  - [x] Duplicate user prevention
  - [x] Success/error notifications
  - [x] Dialog behavior

- [x] Users list:
  - [x] Loading states
  - [x] Refresh after invite
  - [x] Role display
  - [x] Real-time updates

## 6. User Management Actions
### Create Manage User Dialog
- [ ] Create new ManageUserDialog component:
  ```typescript
  interface ManageUserDialogProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
  }
  ```
- [ ] Add dialog UI elements:
  - [ ] User details display
  - [ ] Role update dropdown
  - [ ] Delete user button
  - [ ] Save/Cancel buttons

### Add User Management Logic
- [ ] Implement role update functionality:
  ```typescript
  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('accounts_users')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('account_id', workspace.id);
    
    if (error) throw error;
  };
  ```
- [ ] Add user deletion with cascade:
  - [ ] Remove from accounts_users
  - [ ] Handle associated data cleanup
  - [ ] Show confirmation dialog

### Update Settings Component
- [ ] Add state for manage dialog:
  ```typescript
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  ```
- [ ] Connect Manage button to dialog:
  ```typescript
  const handleManageClick = (user: User) => {
    setSelectedUser(user);
    setIsManageDialogOpen(true);
  };
  ```
- [ ] Add success/error notifications
- [ ] Refresh user list after updates

### Security & Validation
- [ ] Add admin-only checks for management actions
- [ ] Prevent self-role-change
- [ ] Add loading states for actions
- [ ] Validate role changes

### Testing
- [ ] Test role updates:
  - [ ] Success case
  - [ ] Error handling
  - [ ] UI feedback
- [ ] Test user deletion:
  - [ ] Confirmation flow
  - [ ] Cascade deletion
  - [ ] Error cases
- [ ] Test permissions:
  - [ ] Admin access
  - [ ] Self-modification prevention