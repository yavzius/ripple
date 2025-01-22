import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { ChevronDown, ChevronUp, MoreHorizontal, Plus, Loader2 } from "lucide-react";
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

export default function Companies() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [companies, setCompanies] = useState<CustomerCompanyWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!workspace?.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const { data: customerCompanies, error } = await supabase
          .from("customer_companies")
          .select(`
            *,users(*)
          `)
          .eq("account_id", workspace.id);

        if (error) {
          throw error;
        }

        if (!customerCompanies) return [];

        setCompanies(customerCompanies);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch companies';
        setError(new Error(message));
        toast({
          title: "Error fetching companies",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [workspace?.id, toast]);

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

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading companies: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
          <p className="text-muted-foreground">
            Manage your customer companies and their users
          </p>
        </div>
        <Button onClick={() => navigate("/companies/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Company
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  if (sortField === "name") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("name");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  Company Name
                  {sortField === "name" && (
                    sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  if (sortField === "domain") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("domain");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  Domain
                  {sortField === "domain" && (
                    sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  if (sortField === "users") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("users");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  Users
                  {sortField === "users" && (
                    sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading companies...
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedAndFilteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredOrgs.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/companies/${company.id}`)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {company.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {company.name}
                    </div>
                  </TableCell>
                  <TableCell>{company.domain || "-"}</TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {company.users.slice(0, 3).map((user) => (
                        <Tooltip key={user.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarFallback>
                                {(user.first_name?.[0] || "") +
                                  (user.last_name?.[0] || "")}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            {user.first_name} {user.last_name}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {company.users.length > 3 && (
                        <Badge variant="secondary" className="ml-2">
                          +{company.users.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/companies/${company.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/companies/${company.id}/contacts/new`)
                          }
                        >
                          Add Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 