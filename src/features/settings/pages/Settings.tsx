import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { UserPlus, Users, Settings as SettingsIcon, Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/hooks/use-workspace";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { PageLayout } from "@/components/layout/PageLayout";

interface UserFormData {
  email: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
}

type UserRole = 'admin' | 'agent';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: UserRole | null;
}

interface DatabaseUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
  current_account_id: string | null;
}

interface AccountUser {
  user_id: string;
  role: UserRole;
  account_id: string;
}

export default function Settings() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("agent");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);
  const [userToManage, setUserToManage] = useState<User | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState<boolean>(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('agent');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    if (!workspace) return;
    
    try {
      setIsLoadingUsers(true);
      const { data: accountUsers, error: accountUsersError } = await supabase
        .from('accounts_users')
        .select('user_id, role')
        .eq('account_id', workspace.id);

      if (accountUsersError) throw accountUsersError;

      const userIds = (accountUsers as AccountUser[]).map(au => au.user_id);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      if (userError) throw userError;

      const combinedUsers: User[] = (userData as DatabaseUser[]).map(u => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        role: (accountUsers as AccountUser[]).find(au => au.user_id === u.id)?.role || null
      }));

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [workspace]);

  useEffect(() => {
    if (!workspace) return;

    let isSubscribed = true;
    const channel = supabase
      .channel('accounts_users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts_users',
          filter: `account_id=eq.${workspace.id}`
        },
        () => {
          if (isSubscribed) {
            fetchUsers();
          }
        }
      )
      .subscribe();

    fetchUsers();

    return () => {
      isSubscribed = false;
      channel.unsubscribe();
    };
  }, [workspace, fetchUsers]);

  useEffect(() => {
    if (!user) return;
    setCurrentUserEmail(user.email || "");
  }, [user]);

  useEffect(() => {
    if (!user || !workspace) return;

    let isSubscribed = true;

    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('accounts_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('account_id', workspace.id)
          .single();
        
        if (error) throw error;
        if (isSubscribed) {
          setIsAdmin(data?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();

    return () => {
      isSubscribed = false;
    };
  }, [user, workspace]);

  const form = useForm<UserFormData>({
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "agent",
    },
  });

  const onSubmit = async (formData: UserFormData) => {
    if (!isAdmin) {
      toast.error("Only admins can invite users");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify admin status and workspace
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !workspace) {
        toast.error("Missing user or workspace information");
        return;
      }

      // 2. Call create-user Edge Function
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          account_id: workspace.id
        }
      });

      if (response.error) {
        // Try to parse the error response
        let errorMessage = "Failed to create user";
        try {
          const errorContext = JSON.parse(response.error.message);
          errorMessage = errorContext.error || errorContext.message || response.error.message;
        } catch {
          errorMessage = response.error.message || errorMessage;
        }

        if (errorMessage.includes("email_exists") || errorMessage.includes("already been registered")) {
          toast.error("A user with this email already exists");
        } else {
          toast.error(errorMessage);
        }
        console.error('Edge Function Error:', response.error);
        return;
      }

      // Success handling
      toast.success("User added successfully");
      
      // Clear form and close dialog
      form.reset();
      setIsAddUserDialogOpen(false);
      
      // Refresh users list - this will trigger the real-time subscription
      await fetchUsers();
    } catch (error: any) {
      // Handle any other errors
      let errorMessage = "Failed to create user";
      try {
        if (error.message) {
          const parsedError = JSON.parse(error.message);
          errorMessage = parsedError.error || parsedError.message || error.message;
        }
      } catch {
        errorMessage = error.message || errorMessage;
      }
      
      if (errorMessage.includes("email_exists") || errorMessage.includes("already been registered")) {
        toast.error("A user with this email already exists");
      } else {
        toast.error(errorMessage);
      }
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiToggle = (checked: boolean) => {
    setAiEnabled(checked);
    toast.success(`AI responses ${checked ? "enabled" : "disabled"}`);
  };

  const handleCopyChatbotUrl = () => {
    if (!workspace) return;
    const url = `${window.location.origin}/chat/${workspace.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Chatbot URL copied to clipboard");
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !workspace || !isAdmin) return;

    setIsDeletingUser(true);
    try {
      // First remove from accounts_users to revoke access
      const { error: removeAccessError } = await supabase
        .from('accounts_users')
        .delete()
        .eq('user_id', userToDelete.id)
        .eq('account_id', workspace.id);

      if (removeAccessError) throw removeAccessError;

      // Then remove from users table if this was their only workspace
      const { data: otherWorkspaces } = await supabase
        .from('accounts_users')
        .select('account_id')
        .eq('user_id', userToDelete.id);

      if (!otherWorkspaces?.length) {
        const { error: removeUserError } = await supabase
          .from('users')
          .delete()
          .eq('id', userToDelete.id);

        if (removeUserError) throw removeUserError;
      }

      toast.success("User removed successfully");
      setUserToDelete(null);
      await fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("Failed to remove user");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!userToManage || !workspace || !isAdmin) return;

    setIsUpdatingRole(true);
    try {
      const { error } = await supabase
        .from('accounts_users')
        .update({ role: selectedRole })
        .eq('user_id', userToManage.id)
        .eq('account_id', workspace.id);

      if (error) throw error;

      toast.success("User role updated successfully");
      setIsManageDialogOpen(false);
      setUserToManage(null);
      await fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error("Failed to update user role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const importDemoData = async () => {
    if (!workspace || !isAdmin || !user) return;

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('generate-demo-content', {
        body: { 
          accountId: workspace.id,
          userId: user.id
        }
      });

      if (response.error) {
        let errorMessage = "Failed to import demo data";
        try {
          const errorContext = JSON.parse(response.error.message);
          errorMessage = errorContext.error || errorContext.message || response.error.message;
        } catch {
          errorMessage = response.error.message || errorMessage;
        }
        
        toast.error(errorMessage);
        console.error('Error importing demo data:', response.error);
      } else {
        toast.success("Demo data imported successfully");
      }
    } catch (error) {
      console.error('Error importing demo data:', error);
      toast.error("Failed to import demo data");
    } finally {
      setLoading(false);
    }
  };

  const userInfo = (
    <div className="text-right">
      <p className="text-sm text-muted-foreground">Logged in as</p>
      <p className="font-medium">{currentUserEmail}</p>
    </div>
  );

  return (
    <PageLayout
      title="Settings"
      description="Manage your system settings and preferences"
      actions={userInfo}
    >
      <div className="grid gap-6">
        {/* Demo Data Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Demo Data</CardTitle>
              </div>
              <Button
                onClick={importDemoData}
                disabled={loading || !isAdmin}
              >
                {loading ? 'Importing...' : 'Import Demo Data'}
              </Button>
            </div>
            <CardDescription>Import demo content for testing and exploration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This will create sample customers, conversations, and tickets with beauty industry-specific content.
            </p>
          </CardContent>
        </Card>

        {/* AI Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>Configure AI agent behavior and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable AI Responses</Label>
                <p className="text-sm text-muted-foreground">
                  Allow AI agents to automatically respond to messages
                </p>
              </div>
              <Switch checked={aiEnabled} onCheckedChange={handleAiToggle} />
            </div>
          </CardContent>
        </Card>

        {/* User Management Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>User Management</CardTitle>
              </div>
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!isAdmin}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        rules={{
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormDescription>The user's email address</FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="firstName"
                        rules={{ required: "First name is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        rules={{ required: "Role is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="agent">Agent</option>
                                <option value="admin">Admin</option>
                              </select>
                            </FormControl>
                            <FormDescription>User's role in the system</FormDescription>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Inviting..." : "Invite User"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Manage users and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {user.role}
                        </div>
                        {isAdmin && user.email !== currentUserEmail && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUserToManage(user);
                              setSelectedRole(user.role as UserRole);
                              setIsManageDialogOpen(true);
                            }}
                          >
                            Manage
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Management Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={(open) => !open && setIsManageDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User</Label>
              <p className="text-sm">{userToManage?.first_name} {userToManage?.last_name}</p>
              <p className="text-sm text-muted-foreground">{userToManage?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full p-2 border rounded-md"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => {
                  setIsManageDialogOpen(false);
                  setUserToManage(null);
                }}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setUserToDelete(userToManage);
                  setIsManageDialogOpen(false);
                }}
                className="flex-1 sm:flex-none"
              >
                Remove User
              </Button>
            </div>
            <Button
              onClick={handleUpdateRole}
              disabled={isUpdatingRole || userToManage?.role === selectedRole}
              className="flex-1 sm:flex-none"
            >
              {isUpdatingRole ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToDelete?.first_name} {userToDelete?.last_name} ({userToDelete?.email}) from this workspace?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingUser}
            >
              {isDeletingUser ? "Removing..." : "Remove User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}