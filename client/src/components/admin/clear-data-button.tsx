import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ClearYouthDataButton() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Check if user is an admin
  const isAdmin = user?.role === "admin";

  // Clear Youth Data Mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      setIsClearing(true);
      const response = await apiRequest("POST", "/api/admin/clear-youth-data");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to clear youth data");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Youth data cleared",
        description: "All youth profiles have been successfully removed",
      });
      
      // Close the dialog
      setIsOpen(false);
      
      // Invalidate queries to refresh the profiles list
      queryClient.invalidateQueries({
        queryKey: ['/api/youth-profiles'],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error clearing data",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsClearing(false);
    }
  });

  // Don't render the button if the user is not an admin
  if (!isAdmin) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="shadow-md hover:shadow-lg transition-all duration-300 border-red-300"
          style={{ 
            color: "#d32f2f"
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Youth Data</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete all youth profile data from the database.
            This is intended for testing purposes only and cannot be undone.
            Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              clearDataMutation.mutate();
            }}
            disabled={isClearing}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isClearing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              "Yes, Clear All Data"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}