// UI Types
export type StatusVariant = "default" | "secondary" | "destructive" | "outline";

// Table Types
export interface TableState<T> {
  sorting: {
    id: keyof T;
    desc: boolean;
  }[];
  columnFilters: {
    id: keyof T;
    value: string;
  }[];
  columnVisibility: {
    [key in keyof T]: boolean;
  };
  rowSelection: Record<string, boolean>;
}

// API Types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface ApiListResponse<T> {
  data: T[];
  error: Error | null;
}

// Common Types
export interface SelectOption {
  id: string;
  name: string;
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

// Status Types
export interface StatusConfig<T extends string> {
  value: T;
  label: string;
  variant: StatusVariant;
} 