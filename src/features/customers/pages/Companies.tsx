import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/components/ui/use-toast";
import { CompanyWithCustomers, getCompanies } from "@/lib/actions";

const columns: ColumnDef<CompanyWithCustomers>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {name}
        </div>
      );
    },
  },
  {
    accessorKey: "domain",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Domain" />
    ),
    cell: ({ row }) => row.getValue("domain") || "-",
  },
  {
    id: "customers",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customers" />
    ),
    cell: ({ row }) => {
      const customers = row.original.customers;
      return (
        <div className="flex -space-x-2">
          {customers.slice(0, 3).map((customer) => (
            <Avatar key={customer.id} className="h-8 w-8 border-2 border-background">
              <AvatarFallback>
                {(customer.first_name?.[0] || "") + (customer.last_name?.[0] || "")}
              </AvatarFallback>
            </Avatar>
          ))}
          {customers.length > 3 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
              +{customers.length - 3}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const company = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(company.id)}>
              Copy company ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/companies/${company.id}`;
            }}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/companies/${company.id}/customers/new`;
            }}>
              Add Customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function Companies() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const [companies, setCompanies] = useState<CompanyWithCustomers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!workspace?.id) return;

      setIsLoading(true);
      try {
        const companies = await getCompanies(workspace.id);
        setCompanies(companies);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch companies';
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Companies</h2>
          <p className="text-sm text-muted-foreground">
            Manage your customer companies and their customers
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/companies/new">
            <Plus className="mr-2 h-4 w-4" /> Add Company
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={companies}
        isLoading={isLoading}
        filterColumn="name"
        filterPlaceholder="Filter companies..."
        onRowClick={(row) => navigate(`/companies/${row.id}`)}
      />
    </div>
  );
} 