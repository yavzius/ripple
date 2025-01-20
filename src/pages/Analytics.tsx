import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Brain, Clock, MessageSquare, Users } from "lucide-react";

const mockData = [
  { month: "Jan", tickets: 65, resolved: 45 },
  { month: "Feb", tickets: 75, resolved: 60 },
  { month: "Mar", tickets: 85, resolved: 70 },
  { month: "Apr", tickets: 70, resolved: 65 },
  { month: "May", tickets: 90, resolved: 80 },
  { month: "Jun", tickets: 100, resolved: 95 },
];

const stats = [
  {
    name: "Total Tickets",
    value: "485",
    change: "+12.3%",
    icon: MessageSquare,
  },
  {
    name: "Resolution Time",
    value: "2.4h",
    change: "-8.1%",
    icon: Clock,
  },
  {
    name: "AI Resolutions",
    value: "68%",
    change: "+5.4%",
    icon: Brain,
  },
  {
    name: "Active Users",
    value: "1,294",
    change: "+2.5%",
    icon: Users,
  },
];

const Analytics = () => {
  const chartConfig = {
    tickets: {
      label: "Total Tickets",
      theme: {
        light: "hsl(var(--primary))",
        dark: "hsl(var(--primary))",
      },
    },
    resolved: {
      label: "Resolved Tickets",
      theme: {
        light: "hsl(var(--muted))",
        dark: "hsl(var(--muted))",
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Monitor your support metrics and performance.
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

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Ticket Volume</h3>
            <p className="text-sm text-muted-foreground">
              Monthly ticket volume and resolution rates
            </p>
          </div>
          <div className="h-[400px]">
            <ChartContainer config={chartConfig}>
              <>
                <BarChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="var(--color-tickets)" />
                  <Bar dataKey="resolved" fill="var(--color-resolved)" />
                </BarChart>
                <ChartLegend>
                  <ChartLegendContent />
                </ChartLegend>
              </>
            </ChartContainer>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;