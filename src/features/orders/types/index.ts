import type { Database } from "@/types/database.types";
import type {
  ApiResponse,
  ApiListResponse,
  SelectOption,
  TableState,
  StatusVariant,
  StatusConfig,
} from "@/types/common";

// Base types from database
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
export type CustomerCompany = Database["public"]["Tables"]["customer_companies"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
export type OrderItemUpdate = Database["public"]["Tables"]["order_items"]["Update"];
export type Product = Database["public"]["Tables"]["products"]["Row"];

// Extended types
export type OrderWithCompany = Order & {
  company: CustomerCompany | null;
};

export type OrderItemWithProduct = OrderItem & {
  product: Product;
};

export type OrderWithDetails = OrderWithCompany & {
  items: OrderItemWithProduct[];
  total: number;
};

// Status types
export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig<OrderStatus>> = {
  [ORDER_STATUS.PENDING]: {
    value: ORDER_STATUS.PENDING,
    label: "Pending",
    variant: "default",
  },
  [ORDER_STATUS.PROCESSING]: {
    value: ORDER_STATUS.PROCESSING,
    label: "Processing",
    variant: "outline",
  },
  [ORDER_STATUS.COMPLETED]: {
    value: ORDER_STATUS.COMPLETED,
    label: "Completed",
    variant: "secondary",
  },
  [ORDER_STATUS.CANCELLED]: {
    value: ORDER_STATUS.CANCELLED,
    label: "Cancelled",
    variant: "destructive",
  },
};

// Form types
export interface OrderFormData {
  company_id: string;
  status?: OrderStatus;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

export interface OrderItemFormData {
  product_id: string;
  quantity: number;
}

// Component props types
export interface OrderFormProps {
  initialData?: OrderUpdate;
  companies: SelectOption[];
  products: SelectOption[];
}

export interface OrderDetailsProps {
  order: OrderWithDetails;
}

export interface OrderItemsTableProps {
  items: OrderItemWithProduct[];
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  isEditable?: boolean;
}

// Utility types
export interface CompanyOption {
  id: string;
  name: string;
}

export interface ProductOption {
  id: string;
  name: string;
  price: number;
}

// Table types
export type OrderTableState = TableState<OrderWithDetails>;

// API response types
export type OrderResponse = ApiResponse<OrderWithDetails>;
export type OrdersResponse = ApiListResponse<OrderWithDetails>;

// Status update types
export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
}

// Mutation types
export interface OrderUpdateMutation {
  orderId: string;
  updates: OrderUpdate;
}

export interface OrderItemUpdateMutation {
  orderId: string;
  itemId: string;
  updates: OrderItemUpdate;
}

export interface OrderItemCreateMutation {
  orderId: string;
  item: OrderItemInsert;
}

export interface OrderItemDeleteMutation {
  orderId: string;
  itemId: string;
} 