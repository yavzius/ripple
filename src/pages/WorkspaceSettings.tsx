import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function WorkspaceSettings() {
  const { workspace, invalidate } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateWorkspace = async () => {
    if (!workspace) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ name: workspaceName })
        .eq('id', workspace.id);

      if (error) throw error;
      invalidate();
    } catch (error) {
      console.error('Failed to update workspace:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Workspace Settings</h1>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your workspace's general settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                />
              </div>
              <Button 
                onClick={handleUpdateWorkspace} 
                disabled={isUpdating || !workspaceName || workspaceName === workspace?.name}
              >
                {isUpdating ? "Updating..." : "Update Workspace"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Members</CardTitle>
              <CardDescription>
                Manage your workspace's team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Implement member management */}
              <p className="text-sm text-muted-foreground">
                Member management functionality coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Manage your workspace's billing and subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Implement billing settings */}
              <p className="text-sm text-muted-foreground">
                Billing management functionality coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 