import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getTickets } from "@/lib/actions";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

type TicketResponse = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  title: string | null;
  description: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  conversation: {
    id: string;
    customer: {
      id: string;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      customer_company: {
        id: string;
        name: string | null;
        domain: string | null;
      } | null;
    } | null;
  } | null;
}

const statusOptions = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const columns: ColumnDef<TicketResponse>[] = [
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
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return title || "Untitled Ticket";
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <div className="flex w-[100px] items-center">
        <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${
          row.getValue("status") === "resolved" || row.getValue("status") === "closed" 
            ? "bg-green-100 text-green-800" 
            : row.getValue("status") === "in_progress" 
              ? "bg-yellow-100 text-yellow-800"
              : "bg-blue-100 text-blue-800"
        }`}>
          {row.getValue("status")}
        </span>
      </div>
    ),
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue("status"));
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => (
      <div className="flex w-[100px] items-center">
        <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${
          row.getValue("priority") === "urgent" 
            ? "bg-red-100 text-red-800" 
            : row.getValue("priority") === "high"
              ? "bg-orange-100 text-orange-800"
              : row.getValue("priority") === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
        }`}>
          {row.getValue("priority")}
        </span>
      </div>
    ),
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue("priority"));
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
  },
  {
    id: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const ticket = row.original;
      const customerName = `${ticket.conversation?.customer?.first_name} ${ticket.conversation?.customer?.last_name}`.trim();
      const customerEmail = ticket.conversation?.customer?.email;
      
      if (customerName) return customerName;
      if (customerEmail) return customerEmail;
      return "Anonymous Customer";
    },
  },
  {
    id: "company",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const ticket = row.original;
      return ticket.conversation?.customer?.customer_company?.name || "Unknown";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const ticket = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(ticket.id)}>
              Copy ticket ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/tickets/${ticket.id}`;
            }}>
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];

const TicketsPage = () => {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const tickets = await getTickets();
        if (Array.isArray(tickets)) {
          setTickets(tickets as unknown as TicketResponse[]);
        } else {
          setTickets([]);
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspace?.id) {
      fetchTickets();
    }
  }, [workspace?.id]); // Re-fetch when workspace changes

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Tickets</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track support tickets
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/tickets/new">Create Ticket</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        filterColumn="title"
        filterPlaceholder="Filter titles..."
        onRowClick={(row) => navigate(`/tickets/${row.id}`)}
        facetedFilters={[
          {
            column: "status",
            title: "Status",
            options: statusOptions,
          },
          {
            column: "priority",
            title: "Priority",
            options: priorityOptions,
          },
        ]}
      />
    </div>
  );
};

export default TicketsPage;