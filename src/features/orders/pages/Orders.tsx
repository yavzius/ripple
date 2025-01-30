import { Link } from "react-router-dom";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { generateInitials, formatDate } from "@/lib/utils";
import { useClipboard } from "@/hooks/use-clipboard";
import { useOrders, useDeleteOrder, useUpdateOrderStatus } from "../hooks/use-orders";
import {
  OrderWithCompany,
  OrderStatus,
  ORDER_STATUS,
  ORDER_STATUS_CONFIG,
} from "../types";

const columns: ColumnDef<OrderWithCompany>[] = [
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
    accessorKey: "order_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order #" />
    ),
    cell: ({ row }) => {
      const { copyToClipboard } = useClipboard();
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">#{row.getValue("order_number")}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(row.getValue("order_number").toString());
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "company",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const company = row.original.company;
      if (!company) return "-";
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {generateInitials(company.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{company.name}</span>
            {company.domain && (
              <span className="text-xs text-muted-foreground">{company.domain}</span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as OrderStatus;
      const statusConfig = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
      return (
        <StatusBadge
          status={statusConfig.label}
          variant={statusConfig.variant}
        />
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      return formatDate(row.getValue("created_at"), "PP");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;
      const { mutate: deleteOrder } = useDeleteOrder();
      const { mutate: updateStatus } = useUpdateOrderStatus();
      const { copyToClipboard } = useClipboard();
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => copyToClipboard(order.id, "Order ID copied to clipboard")}
            >
              Copy order ID
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/orders/${order.id}`}>View details</Link>
            </DropdownMenuItem>
            {Object.values(ORDER_STATUS_CONFIG).map((config) => (
              <DropdownMenuItem
                key={config.value}
                onClick={() => updateStatus({ orderId: order.id, status: config.value })}
                disabled={order.status === config.value}
              >
                Mark as {config.label.toLowerCase()}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteOrder(order.id)}
            >
              Delete order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function Orders() {
  const { data: orders, isLoading } = useOrders();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track your customer orders
          </p>
        </div>
        <Button asChild>
          <Link to="/orders/new">
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={orders || []}
        isLoading={isLoading}
        filterColumn="company.name"
        filterPlaceholder="Filter orders..."
      />
    </div>
  );
} 