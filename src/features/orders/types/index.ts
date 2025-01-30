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

// Extended types
export type OrderWithCompany = Order & {
  company: CustomerCompany | null;
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
}

// Component props types
export interface OrderFormProps {
  initialData?: OrderUpdate;
  companies: SelectOption[];
}

export interface OrderDetailsProps {
  order: OrderWithCompany;
}

// Utility types
export interface CompanyOption {
  id: string;
  name: string;
}

// Table types
export type OrderTableState = TableState<OrderWithCompany>;

// API response types
export type OrderResponse = ApiResponse<OrderWithCompany>;
export type OrdersResponse = ApiListResponse<OrderWithCompany>;

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