import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, Check, History, Plus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function AdminPermissionsControls() {
  const { toast } = useToast();
  const [resetInProgress, setResetInProgress] = useState(false);
  const [generateInProgress, setGenerateInProgress] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Reset admin permissions mutation
  const resetPermissionsMutation = useMutation({
    mutationFn: async () => {
      setResetInProgress(true);
      const response = await fetch('/api/admin/permissions-control/reset-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset permissions');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Permissions Reset Successful",
        description: "Administrator permissions have been successfully reset.",
        variant: "default",
      });
      
      // Invalidate permissions and roles queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/role-permissions'] });
      
      setResetInProgress(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset administrator permissions.",
        variant: "destructive",
      });
      setResetInProgress(false);
    }
  });

  // Generate missing permissions mutation
  const generatePermissionsMutation = useMutation({
    mutationFn: async () => {
      setGenerateInProgress(true);
      const response = await fetch('/api/admin/permissions-control/generate-missing-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate missing permissions');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Missing Permissions Generated",
        description: `Created ${data.data?.created || 0} new permissions. Admin now has ${data.data?.adminHas || 0} permissions.`,
        variant: "default",
      });
      
      setResults(data.data);
      
      // Invalidate permissions and roles queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/role-permissions'] });
      
      setGenerateInProgress(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate missing permissions.",
        variant: "destructive",
      });
      setGenerateInProgress(false);
    }
  });

  return (
    <div className="rounded-lg border border-[#E0E0E0] shadow-sm bg-white p-5 mb-6">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <AlertCircle className="mr-2 h-5 w-5 text-[#FF5F00]" />
        Administrator Permissions Controls
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        These actions help ensure that the Administrator role has all possible permissions assigned. Use with caution.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-700 mb-2 flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Admin Permissions
          </h4>
          <p className="text-sm text-blue-600 mb-3">
            Reassigns all existing database permissions to the Administrator role. Use this if admins cannot access certain features.
          </p>
          <Button 
            variant="outline" 
            className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={() => resetPermissionsMutation.mutate()}
            disabled={resetInProgress}
          >
            {resetInProgress ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <History className="mr-2 h-4 w-4" />
                Reset Permissions
              </>
            )}
          </Button>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <h4 className="font-medium text-green-700 mb-2 flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Generate Missing Permissions
          </h4>
          <p className="text-sm text-green-600 mb-3">
            Creates any permissions that are defined in the schema but missing from the database. Use this to add new permission types.
          </p>
          <Button 
            variant="outline" 
            className="bg-white border-green-300 text-green-700 hover:bg-green-100"
            onClick={() => generatePermissionsMutation.mutate()}
            disabled={generateInProgress}
          >
            {generateInProgress ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate Missing
              </>
            )}
          </Button>
        </div>
      </div>
      
      {results && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center">
            <Check className="mr-2 h-4 w-4 text-green-600" />
            Operation Results
          </h4>
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">Total possible permissions:</span> {results.totalPossible}</p>
            <p><span className="font-medium">Existing permissions:</span> {results.existingPermissions}</p>
            <p><span className="font-medium">Missing permissions found:</span> {results.missingPermissions}</p>
            <p><span className="font-medium">New permissions created:</span> {results.created || 0}</p>
            <p><span className="font-medium">Admin now has:</span> {results.adminHas} permissions</p>
          </div>
        </div>
      )}
    </div>
  );
}