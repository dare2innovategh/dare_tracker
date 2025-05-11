import { useQuery, useMutation } from "@tanstack/react-query";
import { BusinessProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Hook for fetching all businesses
export function useBusinesses() {
  const { toast } = useToast();

  const query = useQuery<BusinessProfile[]>({
    queryKey: ["/api/business-profiles"]
  });
  
  if (query.error) {
    toast({
      title: "Error fetching businesses",
      description: (query.error as Error).message,
      variant: "destructive",
    });
  }
  
  return query;
}

// Hook for fetching a single business by ID
export function useBusiness(id: string | number | null) {
  const { toast } = useToast();

  const query = useQuery<BusinessProfile>({
    queryKey: [`/api/business-profiles/${id}`],
    enabled: !!id
  });
  
  if (query.error) {
    toast({
      title: "Error fetching business",
      description: (query.error as Error).message,
      variant: "destructive",
    });
  }
  
  return query;
}

// Hook for fetching businesses by DARE model
export function useBusinessesByModel(model: string | null = null) {
  const { toast } = useToast();
  const { data: allBusinesses, isLoading, error } = useBusinesses();

  // If a model is specified, filter businesses by that model
  const businesses = model && allBusinesses 
    ? allBusinesses.filter((business: BusinessProfile) => business.dareModel === model)
    : allBusinesses;

  return {
    businesses,
    isLoading,
    error
  };
}

// Hook for deleting a business
export function useDeleteBusiness() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/business-profiles/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      // Invalidate the businesses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/business-profiles"] });
      
      toast({
        title: "Business deleted",
        description: "The business has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting business",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}