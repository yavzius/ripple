import { Card } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BarChart2, Users, MessageSquare, Brain } from "lucide-react";

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
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back. Here's what's happening today.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="p-6 card-hover">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-6 w-6 text-primary" />
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
                          ? "text-green-600"
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
    </DashboardLayout>
  );
};

export default Index;