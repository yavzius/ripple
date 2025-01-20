import { TrainingSwiper } from "@/components/training/TrainingSwiper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TrainingSession = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link to="/training">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Session</h1>
          <p className="text-muted-foreground">
            Swipe right to approve, left to reject
          </p>
        </div>
      </div>
      <TrainingSwiper />
    </div>
  );
};

export default TrainingSession;