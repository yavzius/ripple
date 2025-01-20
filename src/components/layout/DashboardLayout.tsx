import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header isCollapsed={isCollapsed} onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <div className="flex">
        <Sidebar isCollapsed={isCollapsed} />
        <main className={`flex-1 transition-all duration-200 ${isCollapsed ? "pl-16" : "pl-64"}`}>
          <div className="content-area">{children}</div>
        </main>
      </div>
    </div>
  );
};