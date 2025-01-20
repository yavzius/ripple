import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50/30">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 animate-in">{children}</main>
      </div>
    </div>
  );
};