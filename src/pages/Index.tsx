import { Card } from "@/components/ui/card";
import { BarChart2, Users, MessageSquare, Brain } from "lucide-react";
import { useOutletContext } from "react-router-dom";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

interface WorkspaceContextType {
  workspace: Workspace;
}

const stats = [
  {
    name: "Active Tickets",
    value: "24",
    change: "+4.75%",
    icon: MessageSquare,
  },
  {
    name: "AI Resolution Rate",
    value: "88.2%",
    change: "+1.25%",
    icon: Brain,
  },
  {
    name: "Training Cards",
    value: "12",
    change: "-2.35%",
    icon: Users,
  },
  {
    name: "Avg. Response Time",
    value: "2.4m",
    change: "-0.45%",
    icon: BarChart2,
  },
];

const Index = () => {
  const { workspace } = useOutletContext<WorkspaceContextType>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Welcome to {workspace.name}</h2>
        <p className="text-sm text-muted-foreground">
          Here's what's happening in your AI support platform today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="supabase-card">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <span
                    className={`text-xs font-medium ${
                      stat.change.startsWith("+")
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;