import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageTitleProps {
  title: string;
  backTo?: string;
}

export function PageTitle({ title, backTo }: PageTitleProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4">
      {backTo && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(backTo)}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    </div>
  );
} 