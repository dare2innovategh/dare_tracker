import React from "react";
import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden border-r md:block w-64">
        <SidebarNavigation />
      </div>
      <div className="flex-1 flex flex-col">
        <ScrollArea className={cn("flex-1 p-4 md:p-8", className)}>
          {children}
        </ScrollArea>
      </div>
    </div>
  );
}