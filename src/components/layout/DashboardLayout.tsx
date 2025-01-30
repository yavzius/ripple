import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandCircle } from "./CommandCircle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      
      <div className="flex">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-200 ${isCollapsed ? "pl-16" : "pl-64"}`}>
      
          <div className="content-area">{children}</div>
        </main>
      </div>
      <CommandCircle />
    </div>
  );
};