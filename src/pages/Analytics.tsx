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
        light: "#9b87f5",
        dark: "#9b87f5",
      },
    },
    resolved: {
      label: "Resolved Tickets",
      theme: {
        light: "#D6BCFA",
        dark: "#D6BCFA",
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Analytics
            </h2>
            <p className="text-muted-foreground mt-2">
              Monitor your support metrics and performance.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card 
              key={stat.name} 
              className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-white to-purple-50/50 border-purple-100"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 p-2 text-white shadow-lg">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
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

        <Card className="p-6 bg-gradient-to-br from-white to-purple-50/50 border-purple-100">
          <div className="mb-4">
            <h3 className="text-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Ticket Volume
            </h3>
            <p className="text-sm text-muted-foreground">
              Monthly ticket volume and resolution rates
            </p>
          </div>
          <div className="h-[400px]">
            <ChartContainer config={chartConfig}>
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748B"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748B"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: "white",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar 
                      dataKey="tickets" 
                      fill="#9b87f5"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="resolved" 
                      fill="#D6BCFA"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
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