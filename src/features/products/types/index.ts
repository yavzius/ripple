import { Database } from "@/types/database.types";
import { StatusVariant } from "@/types/common";

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  status: ProductStatus;
  account_id: string | null;
};

export type ProductInsert = Omit<Database["public"]["Tables"]["products"]["Insert"], "id" | "status"> & {
  status: ProductStatus;
  account_id?: string | null;
};

export type ProductUpdate = Partial<Omit<Database["public"]["Tables"]["products"]["Update"], "id" | "status">> & {
  status: ProductStatus;
  account_id?: string | null;
};

export type ProductWithCompany = Product;

export const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DRAFT: "draft",
  ARCHIVED: "archived",
} as const;

export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];

type StatusConfig = {
  value: ProductStatus;
  label: string;
  variant: StatusVariant;
};

export const PRODUCT_STATUS_CONFIG: Record<ProductStatus, StatusConfig> = {
  [PRODUCT_STATUS.ACTIVE]: {
    value: PRODUCT_STATUS.ACTIVE,
    label: "Active",
    variant: "secondary",
  },
  [PRODUCT_STATUS.INACTIVE]: {
    value: PRODUCT_STATUS.INACTIVE,
    label: "Inactive",
    variant: "outline",
  },
  [PRODUCT_STATUS.DRAFT]: {
    value: PRODUCT_STATUS.DRAFT,
    label: "Draft",
    variant: "default",
  },
  [PRODUCT_STATUS.ARCHIVED]: {
    value: PRODUCT_STATUS.ARCHIVED,
    label: "Archived",
    variant: "destructive",
  },
}; 
