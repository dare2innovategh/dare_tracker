import React, { useState } from 'react';
import { Pen, Plus, Trash, Info, RotateCcw, Loader2, AlertCircle, Check } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Mastercard theme colors
const THEME = {
  primary: "#EB001B",       // Mastercard red
  secondary: "#FF5F00",     // Mastercard orange
  dark: "#000000",          // Black
  light: "#FFFFFF",         // White
  gray: "#F7F7F7",          // Light gray
  darkGray: "#333333",      // Dark gray
  lightText: "#666666",     // Light text color
  border: "#E0E0E0",        // Border color
  success: "#00A651",       // Success green
  warning: "#FFC107",       // Warning yellow
  error: "#EB001B",         // Error red (same as primary)
  info: "#2196F3",          // Info blue
};

// We'll no longer use a hardcoded admin role, as it should come from the database

export default function RoleManagement() {
  const { toast } = useToast();
  
  // Define role type to fix TypeScript errors
  type Role = {
    id: number | string;
    name: string;
    displayName: string;
    description: string;
    isActive: boolean;
    isSystem?: boolean;
  };

  // State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [localToast, setLocalToast] = useState({ show: false, title: '', message: '', type: '' });

  // Form state for new role
  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: '',
    isActive: true
  });

  // Fetch roles using TanStack Query
  const { 
    data: fetchedRoles = [], 
    isLoading: isLoadingRoles,
    isError: isRolesError,
    refetch: refetchRoles
  } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: async () => {
      const response = await fetch('/api/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      return response.json();
    }
  });
  
  // Handle query errors
  React.useEffect(() => {
    if (isRolesError) {
      console.error('Error fetching roles');
      showLocalToast('Error', 'Failed to load roles. Please try again.', 'error');
    }
  }, [isRolesError]);
  
  // Use only the roles fetched from the server (including admin role)
  const roles = fetchedRoles;

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      const res = await apiRequest('POST', '/api/roles', roleData);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate roles query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      
      // Reset form and close dialog
      setNewRole({
        name: '',
        displayName: '',
        description: '',
        isActive: true
      });
      setShowAddDialog(false);
      
      // Show success toast
      toast({
        title: "Success",
        description: `The ${newRole.displayName || newRole.name} role has been created`,
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create role. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      const res = await apiRequest('PUT', `/api/roles/${roleData.id}`, roleData);
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate roles query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      
      setShowEditDialog(false);
      
      toast({
        title: "Success",
        description: `The ${data.displayName || data.name} role has been updated`,
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update role. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string | number) => {
      await apiRequest('DELETE', `/api/roles/${roleId}`);
      return roleId; // Return the ID for reference in onSuccess
    },
    onSuccess: () => {
      // Invalidate roles query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      
      setShowDeleteDialog(false);
      
      toast({
        title: "Success",
        description: "The role has been deleted successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Hide local toast after 3 seconds
  React.useEffect(() => {
    if (localToast.show) {
      const timer = setTimeout(() => {
        setLocalToast({ ...localToast, show: false });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [localToast]);

  // Handle input change for new role form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRole(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (currentRole) {
      setCurrentRole({
        ...(currentRole as any),
        [name]: value
      });
    }
  };

  // Switch handlers
  const handleSwitchChange = (checked: boolean) => {
    setNewRole(prev => ({ ...prev, isActive: checked }));
  };

  const handleEditSwitchChange = (checked: boolean) => {
    if (currentRole) {
      setCurrentRole({ ...(currentRole as any), isActive: checked });
    }
  };

  // Start editing role
  const startEditing = (role: any) => {
    setCurrentRole({ ...role });
    setShowEditDialog(true);
  };

  // Confirm delete role
  const confirmDelete = (role: any) => {
    setCurrentRole(role);
    setShowDeleteDialog(true);
  };

  // Create new role
  const createRole = () => {
    // Simple validation
    if (!newRole.displayName) {
      toast({
        title: "Validation Error",
        description: "Display name is required",
        variant: "destructive",
      });
      return;
    }

    // Auto-generate name if not provided
    let roleName = newRole.name;
    if (!roleName) {
      roleName = newRole.displayName.toLowerCase().replace(/\s+/g, '_');
    }

    // Check for duplicate names
    if (roles.some((role: any) => role.name === roleName)) {
      toast({
        title: "Validation Error",
        description: "A role with this name already exists",
        variant: "destructive",
      });
      return;
    }

    // Prepare the role data
    const roleData = {
      name: roleName,
      displayName: newRole.displayName,
      description: newRole.description || '',
      isActive: newRole.isActive
    };

    // Call the mutation
    createRoleMutation.mutate(roleData);
  };

  // Update existing role
  const updateRole = () => {
    if (!currentRole) return;

    // Validation
    if (!(currentRole as any).displayName) {
      toast({
        title: "Validation Error",
        description: "Display name is required",
        variant: "destructive",
      });
      return;
    }

    // Call the mutation
    updateRoleMutation.mutate(currentRole as any);
  };

  // Delete role
  const deleteRole = () => {
    if (!currentRole) return;
    deleteRoleMutation.mutate((currentRole as any).id);
  };

  // Refresh roles
  const refreshRoles = () => {
    refetchRoles();
  };

  // Show local toast notification
  const showLocalToast = (title: string, message: string, type: 'success' | 'error') => {
    setLocalToast({
      show: true,
      title,
      message,
      type,
    });
  };

  // Toast notification component
  const Toast = () => {
    if (!localToast.show) return null;

    const bgColor = localToast.type === 'success' ? 'bg-[#00A651]/10' : 'bg-[#EB001B]/10';
    const borderColor = localToast.type === 'success' ? 'border-[#00A651]' : 'border-[#EB001B]';
    const textColor = localToast.type === 'success' ? 'text-[#00A651]' : 'text-[#EB001B]';
    const icon = localToast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />;

    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${borderColor} ${bgColor} shadow-md max-w-sm flex items-start`}>
        <div className={`${textColor} mr-3 mt-0.5 flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold mb-1 ${textColor}`}>{localToast.title}</h4>
          <p className="text-sm text-gray-600">{localToast.message}</p>
        </div>
        <button 
          onClick={() => setLocalToast({ ...localToast, show: false })}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Toast notification */}
      <Toast />

      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-[#E0E0E0]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EB001B] to-[#FF5F00] px-6 py-5 text-white">
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="mt-1 text-white/90">Create and manage user roles for the system</p>
        </div>

        {/* Main content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2 text-[#666666]">
              <Info size={18} className="text-[#FF5F00]" />
              <span className="text-sm">Manage access permissions with custom roles</span>
            </div>

            <button 
              className="bg-[#EB001B] hover:bg-[#C0001B] text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors duration-150"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus size={16} className="mr-2" />
              Add New Role
            </button>
          </div>

          {/* Roles table */}
          <div className="overflow-hidden rounded-xl border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F7]">
                    <th className="text-left py-3 px-4 font-semibold text-[#333333]">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#333333] hidden md:table-cell">Description</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#333333] w-[120px]">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#333333] w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingRoles ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <Loader2 size={24} className="animate-spin text-[#FF5F00] mr-2" />
                          <span className="text-[#666666]">Loading roles...</span>
                        </div>
                      </td>
                    </tr>
                  ) : roles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-[#666666]">
                        No roles found. Create your first custom role.
                      </td>
                    </tr>
                  ) : (
                    roles.map((role: any) => (
                      <tr key={role.id} className="border-t border-[#E0E0E0] hover:bg-[#F7F7F7]/50">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#333333]">{role.displayName}</span>
                            <span className="text-xs text-[#666666]">{role.name}</span>
                            {role.isSystem && (
                              <span className="text-xs text-[#FF5F00] bg-[#FF5F00]/10 rounded-full px-2 py-0.5 mt-1 inline-block w-fit">
                                System
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-[#666666] hidden md:table-cell">
                          {role.description || "No description provided"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            role.isActive 
                              ? 'bg-[#00A651]/10 text-[#00A651]' 
                              : 'bg-[#EB001B]/10 text-[#EB001B]'
                          }`}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-1">
                            <button
                              className={`p-1.5 rounded-md ${
                                role.isSystem 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-[#666666] hover:text-[#FF5F00] hover:bg-[#FF5F00]/10'
                              }`}
                              onClick={() => !role.isSystem && startEditing(role)}
                              disabled={role.isSystem}
                              title={role.isSystem ? "System roles cannot be edited" : "Edit role"}
                            >
                              <Pen size={16} />
                            </button>
                            <button
                              className={`p-1.5 rounded-md ${
                                role.isSystem 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-[#666666] hover:text-[#EB001B] hover:bg-[#EB001B]/10'
                              }`}
                              onClick={() => !role.isSystem && confirmDelete(role)}
                              disabled={role.isSystem}
                              title={role.isSystem ? "System roles cannot be deleted" : "Delete role"}
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!isLoadingRoles && roles.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-[#666666] italic">
                {roles.filter((r: any) => r.isSystem).length} system roles, {roles.filter((r: any) => !r.isSystem).length} custom roles
              </p>
              <button 
                className="text-[#666666] hover:text-[#FF5F00] px-3 py-1.5 rounded-md hover:bg-[#FF5F00]/10 flex items-center text-sm"
                onClick={refreshRoles}
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending || deleteRoleMutation.isPending}
              >
                <RotateCcw size={14} className={`mr-2 ${isLoadingRoles ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F7F7F7] p-4 border-t border-[#E0E0E0] flex items-center">
          <Info size={16} className="text-[#666666] mr-2" />
          <span className="text-sm text-[#666666]">
            System roles cannot be edited or deleted. They are essential for core functionality.
          </span>
        </div>
      </div>

      {/* Add Role Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-5 border-b border-[#E0E0E0]">
              <h3 className="text-xl font-semibold text-[#EB001B]">Create New Role</h3>
              <p className="text-sm text-[#666666] mt-1">
                Define a new user role for the system. Roles determine what actions users can perform.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#333333]">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  placeholder="e.g. District Supervisor"
                  value={newRole.displayName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#E0E0E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5F00]/30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#333333]">
                  Technical Name (optional)
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. district_supervisor"
                  value={newRole.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#E0E0E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5F00]/30"
                />
                <p className="text-xs text-[#666666]">
                  Leave blank to auto-generate from display name
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#333333]">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Describe the role's purpose and responsibilities"
                  value={newRole.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E0E0E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5F00]/30"
                />
              </div>

              <div className="flex items-center justify-between bg-[#F7F7F7] p-3 rounded-lg">
                <label className="text-sm font-medium text-[#333333]">
                  Active Status
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    id="isActive"
                    checked={newRole.isActive}
                    onChange={() => handleSwitchChange(!newRole.isActive)}
                    className="opacity-0 w-0 h-0 absolute"
                  />
                  <label 
                    htmlFor="isActive" 
                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      newRole.isActive ? 'bg-[#00A651]' : ''
                    }`}
                  >
                    <span 
                      className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                        newRole.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#E0E0E0] flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-[#333333] border border-[#E0E0E0] rounded-md hover:bg-[#F7F7F7] transition-colors"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-[#EB001B] text-white rounded-md hover:bg-[#C0001B] transition-colors"
                onClick={createRole}
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Dialog */}
      {showEditDialog && currentRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-5 border-b border-[#E0E0E0]">
              <h3 className="text-xl font-semibold text-[#FF5F00]">Edit Role</h3>
              <p className="text-sm text-[#666666] mt-1">
                Modify the selected role's properties
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#F7F7F7] rounded-lg p-3 border border-[#E0E0E0]">
                <p className="text-sm text-[#666666]">
                  Technical Name: <span className="font-medium text-[#333333]">{currentRole.name}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#333333]">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={currentRole.displayName || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-[#E0E0E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5F00]/30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#333333]">
                  Description
                </label>
                <textarea
                  name="description"
                  value={currentRole.description || ''}
                  onChange={handleEditChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E0E0E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5F00]/30"
                />
              </div>

              <div className="flex items-center justify-between bg-[#F7F7F7] p-3 rounded-lg">
                <label className="text-sm font-medium text-[#333333]">
                  Active Status
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    id="editIsActive"
                    checked={currentRole.isActive}
                    onChange={() => handleEditSwitchChange(!currentRole.isActive)}
                    className="opacity-0 w-0 h-0 absolute"
                  />
                  <label 
                    htmlFor="editIsActive" 
                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      currentRole.isActive ? 'bg-[#00A651]' : ''
                    }`}
                  >
                    <span 
                      className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                        currentRole.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#E0E0E0] flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-[#333333] border border-[#E0E0E0] rounded-md hover:bg-[#F7F7F7] transition-colors"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-[#FF5F00] text-white rounded-md hover:bg-[#E55000] transition-colors"
                onClick={updateRole}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && currentRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-5 border-b border-[#E0E0E0]">
              <h3 className="text-xl font-semibold text-[#EB001B]">Delete Role?</h3>
              <p className="text-sm text-[#666666] mt-2">
                This will permanently delete the <strong>{currentRole.displayName || currentRole.name}</strong> role and remove it from all users.
                This action cannot be undone.
              </p>
            </div>

            <div className="p-5 border-t border-[#E0E0E0] flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-[#333333] border border-[#E0E0E0] rounded-md hover:bg-[#F7F7F7] transition-colors"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-[#EB001B] text-white rounded-md hover:bg-[#C0001B] transition-colors"
                onClick={deleteRole}
              >
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}