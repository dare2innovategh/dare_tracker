import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface RefreshButtonProps {
  queryKeys?: string[];
  onRefresh?: () => void;
  className?: string;
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function RefreshButton({
  queryKeys = [],
  onRefresh,
  className = "",
  label = "Refresh",
  variant = "outline",
  size = "sm",
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Invalidate specific query keys if provided
      if (queryKeys.length > 0) {
        await Promise.all(
          queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
        );
      }
      
      // Call custom refresh handler if provided
      if (onRefresh) {
        await onRefresh();
      }
      
      toast({
        title: "Refreshed",
        description: "Data has been refreshed successfully.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh failed",
        description: "There was a problem refreshing the data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={className}
    >
      <RefreshCcw
        className={`h-4 w-4 ${isRefreshing ? "animate-spin" : "mr-2"}`}
      />
      {!isRefreshing && size !== "icon" && label}
      {isRefreshing && size !== "icon" && "Refreshing..."}
    </Button>
  );
}