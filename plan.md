# Admin Invite System Implementation Plan

## 1. Enhance Existing Settings UI
### Update User Management Section
- [ ] Modify existing Dialog form in Settings.tsx:
  - [ ] Required fields:
    - [ ] Email (required)
    - [ ] First Name (required)
    - [ ] Last Name (optional)
    - [ ] Role (required)
  - [ ] Add form validation using react-hook-form:
    - [ ] Email format validation
    - [ ] Required field checks
  - [ ] Update loading states during submission

### Admin Access Control
- [ ] Add role verification to Settings page:
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
- [ ] Hide "Add User" button for non-admins
- [ ] Redirect non-admins away from Settings page

## 2. Backend Integration
### Update Form Submission
- [ ] Modify existing onSubmit handler:
  ```typescript
  const onSubmit = async (data: UserFormData) => {
    try {
      // 1. Verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !workspace) return;

      // 2. Check for existing user/account association
      const { data: existingUser } = await supabase
        .from('accounts_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('account_id', workspace.id)
        .single();

      if (existingUser) {
        toast.error("User already has access to this account");
        return;
      }

      // 3. Create or get user record
      let userId;
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single();

      if (userRecord) {
        userId = userRecord.id;
      } else {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName
          })
          .select()
          .single();
        userId = newUser.id;
      }

      // 4. Create accounts_users association
      await supabase
        .from('accounts_users')
        .insert({
          user_id: userId,
          account_id: workspace.id,
          role: data.role
        });

      // 5. Update UI state
      toast.success("User added successfully");
      setIsAddUserDialogOpen(false);
    } catch (error) {
      toast.error("Failed to add user");
      console.error(error);
    }
  };
  ```

### Add Error Handling
- [ ] Add error states to form:
  - [ ] Display specific error messages:
    - [ ] "User already has access to this account"
    - [ ] "Failed to create user record"
    - [ ] "Failed to associate user with account"
  - [ ] Show errors in UI using toast notifications
  - [ ] Maintain form state on error

## 3. User List Management
### Enhance Users State
- [ ] Update users data structure to match database:
  ```typescript
  interface User {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: string | null;  // From accounts_users table
  }
  ```
- [ ] Add loading state for users list
- [ ] Implement real-time updates using Supabase subscriptions

### List Functionality
- [ ] Replace mock data with real users query:
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
- [ ] Show user role from accounts_users table
- [ ] Implement list refresh after successful invite

## 4. Success Handling
### UI Updates
- [ ] Clear form after successful invite
- [ ] Close dialog after success
- [ ] Show success toast: "User added successfully"
- [ ] Refresh users list to show new user

### State Management
- [ ] Update local users state with new user
- [ ] Handle Supabase real-time updates
- [ ] Maintain consistent UI state

## 5. Testing
### Test Cases
- [ ] Admin access:
  - [ ] Settings page access control
  - [ ] Add User button visibility
  - [ ] Form submission permissions

- [ ] Invite functionality:
  - [ ] Form validation
  - [ ] Duplicate user prevention
  - [ ] Success/error notifications
  - [ ] Dialog behavior

- [ ] Users list:
  - [ ] Loading states
  - [ ] Refresh after invite
  - [ ] Role display
  - [ ] Real-time updates