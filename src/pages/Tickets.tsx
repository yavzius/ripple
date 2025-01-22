import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getTickets } from "@/lib/actions";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
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
  customer_id: string | null;
  resolved_at: string | null;
  subject: string | null;
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
}

const statusOptions = [
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
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
    accessorKey: "subject",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
  },
  {
    accessorKey: "resolved_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <div className="flex w-[100px] items-center">
        <span className={row.getValue("resolved_at") ? "text-green-500" : "text-yellow-500"}>
          {row.getValue("resolved_at") ? "Resolved" : "Open"}
        </span>
      </div>
    ),
    filterFn: (row, id, value: string[]) => {
      const status = row.getValue("resolved_at") ? "resolved" : "open";
      return value.includes(status);
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
      return `${ticket.customer?.first_name} ${ticket.customer?.last_name}`.trim() || ticket.customer?.email || "Unknown";
    },
  },
  {
    id: "company",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const ticket = row.original;
      return ticket.customer?.customer_company?.name || "Unknown";
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
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

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
        filterColumn="subject"
        filterPlaceholder="Filter subjects..."
        onRowClick={(row) => navigate(`/tickets/${row.id}`)}
        facetedFilters={[
          {
            column: "resolved_at",
            title: "Status",
            options: statusOptions,
          },
        ]}
      />
    </div>
  );
};

export default TicketsPage;