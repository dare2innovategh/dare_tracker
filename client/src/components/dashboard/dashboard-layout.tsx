import { ReactNode } from "react";
import { SideNav } from "./sidenav";
import { Header } from "./header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0">
        <SideNav />
      </div>
      <div className="flex flex-1 flex-col md:pl-64">
        <Header />
        <main className="flex-1 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}