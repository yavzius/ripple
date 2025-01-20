import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface LearningCardProps {
  card: {
    id: number;
    trigger: string;
    context: string;
    suggestedResponse: string;
    status: string;
    createdAt: string;
    priority: string;
  };
}

export const LearningCard = ({ card }: LearningCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{card.trigger}</CardTitle>
            <CardDescription>{card.context}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge
              variant={card.status === "pending" ? "secondary" : "default"}
            >
              {card.status}
            </Badge>
            <Badge
              variant={
                card.priority === "high"
                  ? "destructive"
                  : card.priority === "medium"
                  ? "secondary"
                  : "outline"
              }
            >
              {card.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Suggested Response
            </p>
            <p className="mt-1">{card.suggestedResponse}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Created on {card.createdAt}
            </p>
            <Link to={`/training/${card.id}`}>
              <Button variant="ghost" size="sm">
                Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};