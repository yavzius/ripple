import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

type Organization = Tables<"organizations">;
type User = Tables<"users">;
type Ticket = Tables<"tickets">;

interface OrganizationResponse extends Organization {
  customers: User[];
  tickets: Ticket[];
}

interface OrganizationWithDetails extends Organization {
  customers: User[];
  tickets: Ticket[];
  lastContact?: Date;
  activeTickets: number;
  totalTickets: number;
}

type SortField = "name" | "customers" | "domain" | "billing_email" | "lastContact" | "activeTickets";
type SortOrder = "asc" | "desc";

export default function CRM() {
  const { workspace } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const { toast } = useToast();

  const { data: organizationsWithDetails, isLoading, error } = useQuery({
    queryKey: ["organizations", workspace?.id],
    queryFn: async () => {
      console.log("Fetching data for workspace:", workspace?.id);
      if (!workspace) return [];

      try {
        // Single query to fetch organizations with related customers and tickets
        const { data: organizations, error: orgError } = await supabase
          .from("organizations")
          .select(`
            *,
            customers:users(
              *
            ),
            tickets:tickets(
              *
            )
          `)
          .eq("workspace_id", workspace.id)
          .eq("tickets.workspace_id", workspace.id)
          .order("name") as { data: OrganizationResponse[] | null, error: any };

        console.log("Organizations response:", { organizations, orgError });

        if (orgError) {
          console.error("Error fetching organizations:", orgError);
          throw orgError;
        }

        if (!organizations || organizations.length === 0) {
          console.log("No organizations found");
          return [];
        }

        // Process the nested data and filter customers
        const orgsWithDetails: OrganizationWithDetails[] = organizations.map((org) => {
          const tickets = org.tickets || [];
          const customers = (org.customers || []).filter(user => user.role === 'customer');
          const lastContact = tickets.length > 0 ? new Date(tickets[0].created_at!) : undefined;
          const activeTickets = tickets.filter(t => t.status !== "resolved").length;

          return {
            ...org,
            customers,
            tickets,
            lastContact,
            activeTickets,
            totalTickets: tickets.length,
          };
        });

        console.log("Final processed data:", orgsWithDetails);
        return orgsWithDetails;
      } catch (error) {
        console.error("Error in main query function:", error);
        throw error;
      }
    },
    enabled: !!workspace,
  });

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading data",
        description: "There was a problem loading the organizations. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const sortedAndFilteredOrgs = organizationsWithDetails
    ?.filter((org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.billing_email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "customers":
          return multiplier * (a.customers.length - b.customers.length);
        case "domain":
          return multiplier * ((a.domain || "").localeCompare(b.domain || ""));
        case "billing_email":
          return multiplier * ((a.billing_email || "").localeCompare(b.billing_email || ""));
        case "lastContact":
          if (!a.lastContact && !b.lastContact) return 0;
          if (!a.lastContact) return multiplier;
          if (!b.lastContact) return -multiplier;
          return multiplier * (a.lastContact.getTime() - b.lastContact.getTime());
        case "activeTickets":
          return multiplier * (a.activeTickets - b.activeTickets);
        default:
          return 0;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

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

  if (error) {
    return (
      <div className="container py-8">
        <div className="rounded-md bg-destructive/10 p-4">
          <div className="text-destructive font-medium">Error loading data</div>
          <div className="text-sm text-destructive/80">Please try refreshing the page</div>
        </div>
      </div>
    );
  }

  if (!organizationsWithDetails || organizationsWithDetails.length === 0) {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Customer Relationship Management</h1>
          <div className="w-72">
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          No organizations found. Create your first organization to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customer Relationship Management</h1>
        <div className="w-72">
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  className="font-bold p-0 hover:bg-transparent"
                  onClick={() => handleSort("name")}
                >
                  Organization
                  <SortIcon field="name" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="font-bold p-0 hover:bg-transparent"
                  onClick={() => handleSort("domain")}
                >
                  Domain
                  <SortIcon field="domain" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="font-bold p-0 hover:bg-transparent"
                  onClick={() => handleSort("customers")}
                >
                  Customers
                  <SortIcon field="customers" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="font-bold p-0 hover:bg-transparent"
                  onClick={() => handleSort("lastContact")}
                >
                  Last Contact
                  <SortIcon field="lastContact" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="font-bold p-0 hover:bg-transparent"
                  onClick={() => handleSort("activeTickets")}
                >
                  Tickets
                  <SortIcon field="activeTickets" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredOrgs?.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                    {org.billing_email && (
                      <span className="text-sm text-muted-foreground">
                        {org.billing_email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{org.domain || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {org.customers.slice(0, 3).map((customer) => (
                        <Tooltip key={customer.id}>
                          <TooltipTrigger>
                            <Avatar className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={customer.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {customer.full_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{customer.full_name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {org.customers.length} {org.customers.length === 1 ? "customer" : "customers"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {org.lastContact ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(org.lastContact, { addSuffix: true })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(org.lastContact, "PPP p")}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-sm text-muted-foreground">No contact</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={org.activeTickets > 0 ? "default" : "secondary"}>
                      {org.activeTickets} active
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {org.totalTickets} total
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      org.activeTickets > 0 
                        ? "default"
                        : org.lastContact && org.lastContact < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {org.activeTickets > 0 
                      ? "Active" 
                      : org.lastContact && org.lastContact < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      ? "Inactive"
                      : "Stable"
                    }
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Organization</DropdownMenuItem>
                      <DropdownMenuItem>Manage Customers</DropdownMenuItem>
                      <DropdownMenuItem>View Tickets</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 