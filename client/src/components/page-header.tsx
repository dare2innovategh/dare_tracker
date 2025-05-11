import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  heading: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  heading,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-2 mb-4", className)}>
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {description && (
          <p className="text-md text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}