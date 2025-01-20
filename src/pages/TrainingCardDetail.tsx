import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Mock card data
const card = {
  id: 1,
  trigger: "Customer complained about response time",
  context: "User expressed frustration with AI response latency",
  suggestedResponse: "I understand your concern about the response time. Let me help you with that immediately.",
  status: "pending",
  createdAt: "2024-02-25",
  priority: "high",
  conversation: `
User: The AI is taking too long to respond
AI: I apologize for the delay. Let me check what's causing this.
User: This is unacceptable for our business needs
AI: I understand your frustration. Could you help me understand your specific requirements?
  `,
  notes: "AI needs to be more proactive in addressing performance concerns and provide specific solutions.",
};

const TrainingCardDetail = () => {
  const { id } = useParams();
  const [notes, setNotes] = useState(card.notes);
  const { toast } = useToast();

  const handleSave = () => {
    // Here you would typically save the changes to your backend
    toast({
      title: "Changes saved",
      description: "The learning card has been updated successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/training">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Learning Card Review
            </h1>
            <p className="text-muted-foreground">Card ID: {id}</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{card.trigger}</CardTitle>
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Conversation Context
                  </h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {card.conversation}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Suggested Response
                  </h3>
                  <p className="text-muted-foreground">
                    {card.suggestedResponse}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Training Notes</h3>
                  <div data-color-mode="light">
                    <MDEditor
                      value={notes}
                      onChange={(value) => setNotes(value || "")}
                      preview="edit"
                      height={200}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card Information</CardTitle>
              <CardDescription>Additional details</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Created On
                  </dt>
                  <dd>{card.createdAt}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Status
                  </dt>
                  <dd>
                    <Badge
                      variant={card.status === "pending" ? "secondary" : "default"}
                    >
                      {card.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Priority
                  </dt>
                  <dd>
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
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrainingCardDetail;