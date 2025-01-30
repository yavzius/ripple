import { Badge } from "@/components/ui/badge";
import { StatusVariant } from "@/types/common";

export interface StatusBadgeProps {
  status: string;
  variant: StatusVariant;
  uppercase?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  variant,
  uppercase = true,
  className,
}: StatusBadgeProps) {
  return (
    <Badge variant={variant} className={className}>
      {uppercase ? status.toUpperCase() : status}
    </Badge>
  );
} 