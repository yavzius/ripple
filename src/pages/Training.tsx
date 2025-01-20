import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Play } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LearningCard } from "@/components/training/LearningCard";

// Mock data for learning cards
const mockLearningCards = [
  {
    id: 1,
    trigger: "Customer complained about response time",
    context: "User expressed frustration with AI response latency",
    suggestedResponse: "I understand your concern about the response time. Let me help you with that immediately.",
    status: "pending",
    createdAt: "2024-02-25",
    priority: "high",
  },
  {
    id: 2,
    trigger: "Unknown product feature inquiry",
    context: "User asked about a feature not in knowledge base",
    suggestedResponse: "Let me gather more information about this specific feature to better assist you.",
    status: "completed",
    createdAt: "2024-02-24",
    priority: "medium",
  },
];

const Training = () => {
  const { workspaceSlug } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = mockLearningCards.filter(
    (card) =>
      card.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.context.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Training</h1>
          <p className="text-muted-foreground">
            Review and improve AI responses through learning cards
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/${workspaceSlug}/training/session`}>
            <Button variant="secondary">
              <Play className="mr-2 h-4 w-4" />
              Start Training Session
            </Button>
          </Link>
          <Link to={`/${workspaceSlug}/training/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Learning Card
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pending Cards</CardTitle>
            <CardDescription>Cards requiring review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {mockLearningCards.filter((card) => card.status === "pending").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Processed learning cards</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {mockLearningCards.filter((card) => card.status === "completed").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High Priority</CardTitle>
            <CardDescription>Urgent learning needs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {mockLearningCards.filter((card) => card.priority === "high").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Cards</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search learning cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredCards.map((card) => (
                <LearningCard key={card.id} card={card} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Training;