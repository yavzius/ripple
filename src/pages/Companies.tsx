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
import { useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

type CustomerCompany = Tables<"customer_companies">;
type User = Tables<"users">;

interface CustomerCompanyWithDetails extends CustomerCompany {
  users: User[];
}

type SortField = "name" | "users" | "domain";
type SortOrder = "asc" | "desc";

export default function Customers() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const { toast } = useToast();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["customers", workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];

      const { data: customerCompanies, error } = await supabase
        .from("customer_companies")
        .select(`
          *,users(*)
        `)
        .eq("account_id", workspace.id);

      if (error) {
        console.error("Error fetching customers:", error);
        toast({
          title: "Error fetching customers",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      if (!customerCompanies) return [];

      return customerCompanies;
    },
    enabled: !!workspace?.id,
  });

  const sortedAndFilteredOrgs = companies
    ?.filter((org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.domain?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "users":
          return multiplier * (a.users.length - b.users.length);
        case "domain":
          return multiplier * ((a.domain || "").localeCompare(b.domain || ""));
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

  if (!companies || companies.length === 0) {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Companies</h1>
          <div className="flex items-center gap-4">
            <div className="w-72">
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate('/companies/new')}>
              Add Company
            </Button>
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
        <h1 className="text-3xl font-bold">Companies</h1>
        <div className="flex items-center gap-4">
          <div className="w-72">
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => navigate('/companies/new')}>

            Add Company
          </Button>
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
                  onClick={() => handleSort("users")}
                >
                  Contacts
                  <SortIcon field="users" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredOrgs?.map((org) => (
              <TableRow 
                key={org.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/companies/${org.id}`)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                  </div>
                </TableCell>
                <TableCell>{org.domain || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {org.users.slice(0, 3).map((user) => (
                        <Tooltip key={user.id}>
                          <TooltipTrigger>
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarFallback>
                                {`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            {`${user.first_name || ""} ${user.last_name || ""}`}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {org.users.length} {org.users.length === 1 ? "contact" : "contacts"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 