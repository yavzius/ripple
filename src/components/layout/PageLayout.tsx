import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageTitle } from "./PageTitle";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

interface PageLayoutProps {
  title: string;
  backTo?: string;
  primaryAction?: {
    label: string;
    href: string;
    icon?: ReactNode;
    variant?: ButtonProps["variant"];
  };
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageLayout({
  title,
  backTo,
  primaryAction,
  actions,
  children,
  className,
}: PageLayoutProps) {
  return (
    <div className={cn(
      "px-4 sm:px-6 py-6 md:py-8",
      "space-y-6 md:space-y-8",
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle
          title={title}
          backTo={backTo}
        />
        <div className="flex items-center gap-2 shrink-0">
          {primaryAction && (
            <Button 
              asChild 
              size="sm"
              variant={primaryAction.variant}
            >
              <Link to={primaryAction.href}>
                {primaryAction.icon || <Plus className="mr-2 h-4 w-4" />}
                {primaryAction.label}
              </Link>
            </Button>
          )}
          {actions}
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
} 