import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Database } from "@/types/database.types";
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
import { ChevronRight, Plus, MessageCircle } from "lucide-react";
import { getCompanyWithCustomers } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/layout/PageLayout";

type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
type CustomerCompany = Tables<"customer_companies"> & {
  name: string;
  domain: string;
  created_at: string;
  updated_at: string;
};
type Customer = Tables<"customers"> & {
  first_name: string;
  last_name: string;
  id: string;
};
type Conversation = Tables<"conversations">;
type Message = Tables<"messages">;

interface CustomerWithConversations extends Customer {
  conversations: (Conversation & {
    messages: Message[];
  })[];
}

interface CustomerCompanyWithCustomers extends CustomerCompany {
  customers: CustomerWithConversations[];
}

const statusColors = {
  open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  resolved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
} as const;

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      if (!id || !workspace?.id) return null;
      try {
        return await getCompanyWithCustomers(id, workspace.id) as CustomerCompanyWithCustomers;
      } catch (error) {
        console.error("Error fetching company:", error);
        toast({
          title: "Error fetching company",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
        return null;
      }
    },
    enabled: !!id && !!workspace?.id,
  });

  // Get total conversations across all customers
  const totalConversations = company?.customers.reduce((acc, customer) => 
    acc + (customer.conversations?.length || 0), 0) || 0;

  // Get active conversations (not resolved)
  const activeConversations = company?.customers.reduce((acc, customer) => 
    acc + (customer.conversations?.filter(c => c.status === 'open').length || 0), 0) || 0;

  if (isLoading) {
    return (
      <PageLayout
        title="Loading..."
        backTo="/companies"
      >
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </PageLayout>
    );
  }

  if (!company) {
    return (
      <PageLayout
        title="Company Not Found"
        backTo="/companies"
      >
        <div className="text-center py-12 text-muted-foreground">
          Company not found.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={company.name}
      backTo="/companies"
      primaryAction={{
        label: "Add Contact",
        href: `/companies/${id}/customers/new`,
        icon: <Plus className="h-4 w-4 mr-2" />
      }}
    >
      <div className="space-y-6">
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
                <div>{new Date(company.created_at || '').toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                <div>{new Date(company.updated_at || '').toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{company.customers?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Contacts</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{totalConversations}</div>
                <div className="text-sm text-muted-foreground">Total Conversations</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{activeConversations}</div>
                <div className="text-sm text-muted-foreground">Active Conversations</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>Manage company contacts and their information</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Conversations</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.customers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {`${customer.first_name?.[0] || ""}${customer.last_name?.[0] || ""}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          {customer.first_name} {customer.last_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {customer.conversations?.length || 0}
                        {customer.conversations?.some(c => c.status === 'open') && (
                          <Badge variant="secondary" className={statusColors.open}>
                            {customer.conversations?.filter(c => c.status === 'open').length} Active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(customer.created_at || "").toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/inbox/${customer.conversations?.[0]?.id || 'new'}?customer=${customer.id}`)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>View and manage customer conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Resolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.customers?.flatMap(customer => 
                  customer.conversations?.map(conversation => ({
                    ...conversation,
                    customer
                  })) || []
                )
                .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                .map(conversation => (
                  <TableRow key={conversation.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/inbox/${conversation.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {`${conversation.customer.first_name?.[0] || ""}${conversation.customer.last_name?.[0] || ""}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          {conversation.customer.first_name} {conversation.customer.last_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusColors[conversation.status as keyof typeof statusColors])}>
                        {conversation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {conversation.messages?.[conversation.messages.length - 1]?.content || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(conversation.created_at || '').toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {conversation.resolved_at ? new Date(conversation.resolved_at).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
} 