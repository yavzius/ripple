import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Database } from "database.types";
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
import { ChevronRight, Plus } from "lucide-react";

type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
type CustomerCompany = Tables<"customer_companies">;
type User = Tables<"users">;

interface CustomerCompanyWithUsers extends CustomerCompany {
  users: User[];
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();

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
        .eq("account_id", workspace.id)
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
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <div className="flex items-center gap-1 mb-4">
          <Link to="/companies" className="text-md text-primary font-medium hover:text-gray-700 inline-flex items-center gap-1">
            Companies
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-500" />
          <span className="text-gray-500">
            {company.users.length} {company.users.length === 1 ? 'contact' : 'contacts'}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <div className="mt-2 text-gray-600">
          Created {new Date(company.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate(`/companies/${id}/contacts/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Domain</div>
              <div>{company.domain || "-"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div>{new Date(company.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
              <div>{new Date(company.updated_at).toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
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
          <CardTitle>Contacts</CardTitle>
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