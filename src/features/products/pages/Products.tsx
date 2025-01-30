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
import { StatusBadge } from "@/components/ui/status-badge";
import { generateInitials, formatDate, formatCurrency } from "@/lib/utils";
import { useClipboard } from "@/hooks/use-clipboard";
import { useProducts, useDeleteProduct, useUpdateProductStatus } from "../hooks/use-products";
import {
  ProductWithCompany,
  ProductStatus,
  PRODUCT_STATUS,
  PRODUCT_STATUS_CONFIG,
} from "../types";

const columns: ColumnDef<ProductWithCompany>[] = [
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
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => {
      return formatCurrency(row.getValue("price"));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as ProductStatus;
      const statusConfig = PRODUCT_STATUS_CONFIG[status] || PRODUCT_STATUS_CONFIG[PRODUCT_STATUS.DRAFT];
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
      const product = row.original;
      const { mutate: deleteProduct } = useDeleteProduct();
      const { mutate: updateStatus } = useUpdateProductStatus();
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
              onClick={() => copyToClipboard(product.id, "Product ID copied to clipboard")}
            >
              Copy product ID
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/products/${product.id}`}>View details</Link>
            </DropdownMenuItem>
            {Object.values(PRODUCT_STATUS_CONFIG).map((config) => (
              <DropdownMenuItem
                key={config.value}
                onClick={() => updateStatus({ productId: product.id, status: config.value })}
                disabled={product.status === config.value}
              >
                Mark as {config.label.toLowerCase()}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteProduct(product.id)}
            >
              Delete product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  },
];

export default function Products() {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track your product catalog
          </p>
        </div>
        <Button asChild>
          <Link to="/products/new">
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products || []}
        isLoading={isLoading}
        filterColumn="name"
        filterPlaceholder="Filter products..."
        onRowClick={(row) => navigate(`/products/${row.id}`)}
      />
    </div>
  );
} 