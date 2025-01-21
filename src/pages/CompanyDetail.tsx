import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useParams } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type CustomerCompany = Tables<"customer_companies">;
type User = Tables<"users">;

interface CustomerCompanyWithUsers extends CustomerCompany {
  users: User[];
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  const { data: company, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      if (!id || !workspace?.id) return null;

      const { data: customerCompany, error } = await supabase
        .from("customer_companies")
        .select(`
          *,
          users(*)
        `)
        .eq("id", id)
        .eq("workspace_id", workspace.id)
        .single();

      if (error) {
        console.error("Error fetching customer:", error);
        toast({
          title: "Error fetching customer",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      return customerCompany as CustomerCompanyWithUsers;
    },
    enabled: !!id && !!workspace?.id,
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container py-8">
        <div className="text-center py-12 text-muted-foreground">
          Customer company not found.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{company.name}</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Basic information about the company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Domain</div>
              <div>{company.domain || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div>{new Date(company.created_at || "").toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
              <div>{new Date(company.updated_at || "").toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Key metrics about this customer</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold">{company.users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            {/* Add more statistics as needed */}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>People associated with this company</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {company.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        {user.first_name} {user.last_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role || "-"}</TableCell>
                  <TableCell>
                    {new Date(user.created_at || "").toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 