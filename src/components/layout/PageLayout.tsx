import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PageTitle } from "./PageTitle";
import { Button } from "@/components/ui/button";

interface PageLayoutProps {
  title: string;
  backTo?: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  children: ReactNode;
  className?: string;
}

export function PageLayout({
  title,
  backTo,
  primaryAction,
  secondaryAction,
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
        <div className="flex items-center gap-2">
          {secondaryAction && (
            <Button asChild size="sm" variant="outline">
              <Link to={secondaryAction.href}>
                {secondaryAction.label}
              </Link>
            </Button>
          )}
          {primaryAction && (
            <Button asChild size="sm">
              <Link to={primaryAction.href}>
                {primaryAction.label}
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
} 