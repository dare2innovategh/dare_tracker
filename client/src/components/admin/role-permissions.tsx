import React, { useState, useEffect } from "react";
import {
  Loader2,
  Info,
  ChevronDown,
  Search,
  Check,
  AlertCircle,
  ChevronRight,
  ChevronUp,
  X,
  Shield,
  Lock,
  Users,
  FileText,
  Settings,
  User,
  Building,
  Award,
  Briefcase,
  MessageSquare,
  BarChart,
  GraduationCap
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { permissionResourceEnum, permissionActionEnum } from "@shared/schema";
import type { PermissionResource, PermissionAction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Mastercard theme colors
const THEME = {
  primary: "#EB001B", // Mastercard red
  secondary: "#FF5F00", // Mastercard orange
  dark: "#000000", // Black
  light: "#FFFFFF", // White
  gray: "#F7F7F7", // Light gray
  darkGray: "#333333", // Dark gray
  lightText: "#666666", // Light text color
  border: "#E0E0E0", // Border color
  success: "#00A651", // Success green
  warning: "#FFC107", // Warning yellow
  error: "#EB001B", // Error red (same as primary)
  info: "#2196F3", // Info blue
};

// Type definitions
interface ResourceStructure {
  resource: PermissionResource;
  label: string;
  description: string;
  icon: React.ReactNode;
  module: string;
}

interface ActionStructure {
  action: PermissionAction;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ModuleStructure {
  name: string;
  icon: React.ReactNode;
  resources: ResourceStructure[];
}

interface Role {
  id: string | number;
  name: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
}

interface ResourceActionPermission {
  id?: number;
  role: string;
  resource: PermissionResource;
  action: PermissionAction;
  createdAt?: Date;
  updatedAt?: Date | null;
}

// Get the valid values from the zod enums
const validResources = permissionResourceEnum.options;
const validActions = permissionActionEnum.options;

// Resources and their human-readable labels with icons organized by module
const resourcesList: ResourceStructure[] = [
  // User Management Module
  {
    resource: "users",
    label: "Users",
    description: "User accounts and profiles",
    icon: <User className="h-5 w-5" />,
    module: "User Management"
  },
  {
    resource: "roles",
    label: "Roles",
    description: "User roles and permissions",
    icon: <Shield className="h-5 w-5" />,
    module: "User Management"
  },
  {
    resource: "permissions",
    label: "Permissions",
    description: "Permission settings and management",
    icon: <Lock className="h-5 w-5" />,
    module: "User Management"
  },
  
  // Youth Management Module
  {
    resource: "youth_profiles",
    label: "Youth Profiles",
    description: "Youth participant profiles",
    icon: <Users className="h-5 w-5" />,
    module: "Youth Management"
  },
  {
    resource: "youth_education",
    label: "Youth Education",
    description: "Education records for youth participants",
    icon: <GraduationCap className="h-5 w-5" />,
    module: "Youth Management"
  },
  {
    resource: "youth_certifications",
    label: "Youth Certifications",
    description: "Certification records for youth participants",
    icon: <Award className="h-5 w-5" />,
    module: "Youth Management"
  },
  {
    resource: "youth_skills",
    label: "Youth Skills",
    description: "Skills records for youth participants",
    icon: <FileText className="h-5 w-5" />,
    module: "Youth Management"
  },
  {
    resource: "education",
    label: "Education",
    description: "Education management",
    icon: <GraduationCap className="h-5 w-5" />,
    module: "Youth Management"
  },
  {
    resource: "portfolio",
    label: "Portfolio",
    description: "Youth portfolio management",
    icon: <FileText className="h-5 w-5" />,
    module: "Youth Management"
  },
  
  // Business Module
  {
    resource: "businesses",
    label: "Businesses",
    description: "Business entities and their data",
    icon: <Building className="h-5 w-5" />,
    module: "Business Management"
  },
  {
    resource: "business_youth",
    label: "Business-Youth Relationships",
    description: "Relationships between businesses and youth participants",
    icon: <Users className="h-5 w-5" />,
    module: "Business Management"
  },
  {
    resource: "business_tracking",
    label: "Business Tracking",
    description: "Business performance data and tracking",
    icon: <BarChart className="h-5 w-5" />,
    module: "Business Management"
  },
  
  // Mentor Module
  {
    resource: "mentors",
    label: "Mentors",
    description: "Mentor profiles and assignments",
    icon: <User className="h-5 w-5" />,
    module: "Mentorship"
  },
  {
    resource: "mentor_assignments",
    label: "Mentor Assignments",
    description: "Assignment of mentors to businesses",
    icon: <Briefcase className="h-5 w-5" />,
    module: "Mentorship"
  },
  {
    resource: "mentorship_messages",
    label: "Mentorship Messages",
    description: "Communication between mentors and mentees",
    icon: <MessageSquare className="h-5 w-5" />,
    module: "Mentorship"
  },
  {
    resource: "business_advice",
    label: "Business Advice",
    description: "Business advice from mentors",
    icon: <MessageSquare className="h-5 w-5" />,
    module: "Mentorship"
  },
  
  // Training Module
  {
    resource: "training",
    label: "Training",
    description: "Training programs and courses",
    icon: <GraduationCap className="h-5 w-5" />,
    module: "Training"
  },
  
  // Dashboard Module
  {
    resource: "dashboard",
    label: "Dashboard",
    description: "Dashboard access and analytics",
    icon: <BarChart className="h-5 w-5" />,
    module: "Dashboard"
  },
  {
    resource: "activities",
    label: "Activities",
    description: "User activity tracking",
    icon: <FileText className="h-5 w-5" />,
    module: "Dashboard"
  },
  
  // Admin Module
  {
    resource: "reports",
    label: "Reports",
    description: "Analytics, exports and reports",
    icon: <BarChart className="h-5 w-5" />,
    module: "Administration"
  },
  {
    resource: "system_settings",
    label: "System Settings",
    description: "Application configuration",
    icon: <Settings className="h-5 w-5" />,
    module: "Administration"
  },
  {
    resource: "diagnostics",
    label: "Diagnostics",
    description: "System diagnostics and troubleshooting",
    icon: <Settings className="h-5 w-5" />,
    module: "Administration"
  },
  {
    resource: "uploads",
    label: "Uploads",
    description: "File upload management",
    icon: <FileText className="h-5 w-5" />,
    module: "Administration"
  },
  
  // Additional Resources
  {
    resource: "skills",
    label: "Skills",
    description: "Skills catalog management",
    icon: <FileText className="h-5 w-5" />,
    module: "System Resources"
  },
  {
    resource: "makerspaces",
    label: "Makerspaces",
    description: "Makerspace management",
    icon: <Building className="h-5 w-5" />,
    module: "System Resources"
  },
  {
    resource: "certificates",
    label: "Certificates",
    description: "Certificate management",
    icon: <Award className="h-5 w-5" />,
    module: "System Resources"
  },
  {
    resource: "system",
    label: "System",
    description: "System maintenance",
    icon: <Settings className="h-5 w-5" />,
    module: "System Resources"
  }
];

// Actions and their human-readable labels
const actionsList: ActionStructure[] = [
  {
    action: "view",
    label: "View",
    description: "Can view/read data",
    icon: <Eye className="h-4 w-4" />
  },
  {
    action: "create",
    label: "Create",
    description: "Can create new entries",
    icon: <Plus className="h-4 w-4" />
  },
  {
    action: "edit",
    label: "Edit",
    description: "Can modify existing entries",
    icon: <Edit className="h-4 w-4" />
  },
  {
    action: "delete",
    label: "Delete",
    description: "Can delete entries",
    icon: <Trash className="h-4 w-4" />
  },
  {
    action: "manage",
    label: "Manage",
    description: "Complete administrative control",
    icon: <Settings className="h-4 w-4" />
  },
];

// Custom Icons
function Eye({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Plus({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Edit({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function Trash({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

// Admin role definition
const adminRole: Role = {
  id: "admin",
  name: "admin",
  displayName: "Administrator",
  description: "Full access to all system functions",
  isActive: true,
  isSystem: true,
};

export default function RolePermissions() {
  const { toast: showUiToast } = useToast();

  // State
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
    type: "",
  });
  const [expandedSections, setExpandedSections] = useState<
    PermissionResource[]
  >([]);

  // Fetch roles using TanStack Query
  const { 
    data: fetchedRoles = [], 
    isLoading: isLoadingRoles,
    isError: isRolesError,
  } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: async () => {
      const response = await fetch('/api/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      return response.json();
    },
  });

  // Combine admin role with fetched custom roles
  const roles = [adminRole, ...fetchedRoles];

  // Fetch permissions for the selected role
  const { 
    data: permissions = [], 
    isLoading: isLoadingPermissions,
    refetch: refetchPermissions
  } = useQuery({
    queryKey: ['/api/role-permissions', selectedRoleName],
    queryFn: async () => {
      if (!selectedRoleName) return [];

      const response = await fetch(`/api/role-permissions/${selectedRoleName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      return response.json();
    },
    enabled: !!selectedRoleName,
  });

  // Add permission mutation
  const addPermissionMutation = useMutation({
    mutationFn: async (permission: ResourceActionPermission) => {
      const response = await apiRequest(
        'POST',
        '/api/role-permissions',
        permission
      );
      return response.json();
    },
    onSuccess: () => {
      refetchPermissions();
    },
    onError: (error: Error) => {
      console.error('Error adding permission:', error);
      showToast(
        'Error',
        'Failed to add permission. Please try again.',
        'error'
      );
    }
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (permission: ResourceActionPermission) => {
      const response = await apiRequest(
        'DELETE',
        '/api/role-permissions',
        permission
      );
      return response.json();
    },
    onSuccess: () => {
      refetchPermissions();
    },
    onError: (error: Error) => {
      console.error('Error removing permission:', error);
      showToast(
        'Error',
        'Failed to remove permission. Please try again.',
        'error'
      );
    }
  });

  // Toggle section expansion
  const toggleSection = (resource: PermissionResource) => {
    if (expandedSections.includes(resource)) {
      setExpandedSections(expandedSections.filter((r) => r !== resource));
    } else {
      setExpandedSections([...expandedSections, resource]);
    }
  };

  // Check if a section is expanded
  const isSectionExpanded = (resource: PermissionResource) => {
    return expandedSections.includes(resource);
  };

  // Expand all sections
  const expandAllSections = () => {
    setExpandedSections(resourcesList.map((r) => r.resource));
  };

  // Collapse all sections
  const collapseAllSections = () => {
    setExpandedSections([]);
  };

  // Set first role on initial load
  useEffect(() => {
    if (!isLoadingRoles && roles.length > 0 && !selectedRoleName) {
      setSelectedRoleName(roles[0].name);
    }
  }, [isLoadingRoles, roles, selectedRoleName]);

  // Update selected role when name changes
  useEffect(() => {
    if (selectedRoleName) {
      const role = roles.find((r) => r.name === selectedRoleName);
      setSelectedRole(role || null);
    }
  }, [selectedRoleName, roles]);

  // Hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check if a specific permission exists
  const hasPermission = (
    resource: PermissionResource,
    action: PermissionAction,
  ): boolean => {
    return permissions.some(
      (p: any) =>
        p.role === selectedRoleName &&
        p.resource === resource &&
        p.action === action,
    );
  };

  // Toggle permission
  const togglePermission = (
    resource: PermissionResource,
    action: PermissionAction,
  ) => {
    if (!selectedRoleName) return;

    const permissionExists = hasPermission(resource, action);
    // Ensure resource and action are valid enum values
    if (!validResources.includes(resource)) {
      console.error(`Invalid resource: ${resource}`);
      return;
    }

    if (!validActions.includes(action)) {
      console.error(`Invalid action: ${action}`);
      return;
    }

    const permission = {
      role: selectedRoleName,
      resource,
      action,
    };

    if (permissionExists) {
      // Remove permission
      deletePermissionMutation.mutate(permission);
      showToast(
        "Permission Removed",
        `${action} permission for ${resource} has been removed from ${selectedRole?.displayName}`,
        "success"
      );
    } else {
      // Add permission
      addPermissionMutation.mutate(permission);
      showToast(
        "Permission Added",
        `${action} permission for ${resource} has been added to ${selectedRole?.displayName}`,
        "success"
      );
    }
  };

  // Show toast notification
  const showToast = (
    title: string,
    message: string,
    type: "success" | "error",
  ) => {
    setToast({
      show: true,
      title,
      message,
      type,
    });
  };

  // Filter resources based on search term
  const filteredResources = searchTerm
    ? resourcesList.filter(
        (resource) =>
          resource.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : resourcesList;

  // Toast notification component
  const Toast = () => {
    if (!toast.show) return null;

    const bgColor =
      toast.type === "success" ? "bg-[#00A651]/10" : "bg-[#EB001B]/10";
    const borderColor =
      toast.type === "success" ? "border-[#00A651]" : "border-[#EB001B]";
    const textColor =
      toast.type === "success" ? "text-[#00A651]" : "text-[#EB001B]";
    const icon =
      toast.type === "success" ? (
        <Check size={20} />
      ) : (
        <AlertCircle size={20} />
      );

    return (
      <div
        className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${borderColor} ${bgColor} shadow-md max-w-sm flex items-start`}
      >
        <div className={`${textColor} mr-3 mt-0.5 flex-shrink-0`}>{icon}</div>
        <div className="flex-1">
          <h4 className={`font-semibold mb-1 ${textColor}`}>{toast.title}</h4>
          <p className="text-sm text-gray-600">{toast.message}</p>
        </div>
        <button
          onClick={() => setToast({ ...toast, show: false })}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
    );
  };

  // Main render
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Toast notification */}
      <Toast />

      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-[#E0E0E0]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EB001B] to-[#FF5F00] px-6 py-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold flex items-center">
              <Lock className="h-6 w-6 mr-2" />
              Role Permissions
            </h1>
            <p className="mt-1 text-white/90 max-w-2xl">
              Manage permissions for each role in the system. Control what actions users can perform based on their assigned roles.
            </p>
          </div>

          {/* Background pattern */}
          <div className="absolute top-0 right-0 opacity-10">
            <Shield className="h-32 w-32 -mt-5 -mr-5" />
          </div>
        </div>

        {/* Main content */}
        <div className="p-6">
          {/* Role Selector */}
          <div className="mb-8 relative z-20">
            <div className="flex flex-wrap items-start gap-4 mb-3">
              <div className="flex-grow max-w-md">
                <label className="block text-sm font-medium text-[#333333] mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-[#FF5F00]" />
                  Select Role
                </label>
                <div className="relative">
                  <div
                    className="w-full p-2.5 border border-[#E0E0E0] rounded-md flex justify-between items-center cursor-pointer bg-white hover:border-[#FF5F00] transition-colors"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {isLoadingRoles ? (
                      <span className="text-gray-400 flex items-center">
                        <Loader2 size={16} className="animate-spin mr-2 text-[#FF5F00]" />
                        Loading roles...
                      </span>
                    ) : (
                      <span
                        className={`flex items-center gap-2 ${
                          selectedRoleName ? "text-[#333333]" : "text-gray-400"
                        }`}
                      >
                        {selectedRole?.isSystem ? (
                          <Shield className="h-5 w-5 text-[#FF5F00]" />
                        ) : selectedRole ? (
                          <Users className="h-5 w-5 text-[#0E4C92]" />
                        ) : null}
                        <span>{selectedRole ? selectedRole.displayName : "Select a role"}</span>
                        {selectedRole?.isSystem && (
                          <span className="bg-[#FF5F00]/10 text-[#FF5F00] text-xs px-2 py-0.5 rounded-full">
                            System
                          </span>
                        )}
                      </span>
                    )}
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isDropdownOpen && !isLoadingRoles && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-[#E0E0E0] rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] p-2">
                        <div className="relative">
                          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search roles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-2 py-2 border border-[#E0E0E0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5F00] text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {roles.filter(role => 
                        role.name.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((role) => (
                        <div
                          key={role.name}
                          className={`p-3 cursor-pointer hover:bg-[#F7F7F7] transition-colors ${selectedRoleName === role.name ? "bg-[#F7F7F7]" : ""}`}
                          onClick={() => {
                            setSelectedRoleName(role.name);
                            setIsDropdownOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {role.isSystem ? (
                                <Shield className="h-5 w-5 text-[#FF5F00]" />
                              ) : (
                                <Users className="h-5 w-5 text-[#0E4C92]" />
                              )}
                              <div>
                                <div className="font-medium text-[#333333]">
                                  {role.displayName}
                                </div>
                                <div className="text-xs text-[#666666] flex items-center gap-1">
                                  <span>{role.name}</span>
                                  {role.isSystem && (
                                    <span className="bg-[#FF5F00]/10 text-[#FF5F00] text-xs px-1.5 py-0.5 rounded-full">
                                      System
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {selectedRoleName === role.name && (
                              <Check size={16} className="text-[#FF5F00]" />
                            )}
                          </div>
                        </div>
                      ))}

                      {roles.filter(role => 
                        role.name.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="p-3 text-center text-sm text-gray-500">
                          No roles match your search
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!isLoadingRoles && !isLoadingPermissions && selectedRole && (
                <div className="flex-shrink-0 flex items-center gap-4 mt-6">
                  <div className="text-center px-4 py-2 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="block text-sm text-blue-600 font-medium">{permissions.length}</span>
                    <span className="block text-xs text-blue-500">Permissions</span>
                  </div>

                  <div className="text-center px-4 py-2 rounded-lg bg-green-50 border border-green-100">
                    <span className="block text-sm text-green-600 font-medium">
                      {resourcesList.filter(resource => 
                        actionsList.some(action => 
                          hasPermission(resource.resource, action.action)
                        )
                      ).length}
                    </span>
                    <span className="block text-xs text-green-500">Resources</span>
                  </div>
                </div>
              )}
            </div>

            {selectedRole && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                <div className="flex">
                  <Info size={18} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-blue-700 font-medium">{selectedRole.displayName}</p>
                    <p className="text-sm text-blue-600">
                      {selectedRole.description ||
                        `Manage permissions for the ${selectedRole.displayName} role`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isLoadingRoles || (selectedRoleName && isLoadingPermissions) ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={40} className="animate-spin text-[#FF5F00] mb-4" />
              <span className="text-[#666666] font-medium">
                {isLoadingRoles ? "Loading roles..." : "Loading permissions..."}
              </span>
              <span className="text-sm text-[#666666] mt-1">
                Please wait while we fetch the data
              </span>
            </div>
          ) : selectedRole ? (
            <>
              {/* Permissions Manager */}
              <div className="border border-[#E0E0E0] rounded-lg overflow-hidden shadow-sm">
                {/* Toolbar */}
                <div className="bg-gradient-to-r from-[#F7F7F7] to-white border-b border-[#E0E0E0] p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-[#666666]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-[#E0E0E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5F00]/30 shadow-sm"
                    />
                    {searchTerm && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setSearchTerm("")}
                      >
                        <X size={16} className="text-[#666666]" />
                      </button>
                    )}
                  </div>

                  {/* Expand/Collapse All & Counter */}
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-[#666666] hidden sm:block">
                      <span className="font-medium">{filteredResources.length}</span> resources found
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="px-3 py-1.5 text-sm border border-[#E0E0E0] rounded-md bg-white hover:bg-[#F7F7F7] flex items-center gap-1 shadow-sm transition-colors"
                        onClick={expandAllSections}
                      >
                        <ChevronDown size={14} className="text-[#FF5F00]" />
                        <span>Expand All</span>
                      </button>
                      <button
                        className="px-3 py-1.5 text-sm border border-[#E0E0E0] rounded-md bg-white hover:bg-[#F7F7F7] flex items-center gap-1 shadow-sm transition-colors"
                        onClick={collapseAllSections}
                      >
                        <ChevronUp size={14} className="text-[#FF5F00]" />
                        <span>Collapse All</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action headers - on larger screens */}
                <div className="hidden md:grid grid-cols-[3fr_repeat(5,1fr)] border-b border-[#E0E0E0] bg-[#F7F7F7]">
                  <div className="p-3 font-medium text-[#666666]">Resource</div>
                  {actionsList.map(action => (
                    <div 
                      key={action.action} 
                      className="p-3 font-medium text-[#666666] text-center flex items-center justify-center gap-1"
                      title={action.description}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </div>
                  ))}
                </div>

                {/* Permissions List */}
                <div className="divide-y divide-[#E0E0E0]">
                  {filteredResources.length === 0 ? (
                    <div className="p-8 text-center text-[#666666]">
                      No resources match your search
                    </div>
                  ) : (
                    filteredResources.map((resource) => (
                      <div
                        key={resource.resource}
                        className="border-b border-[#E0E0E0] last:border-b-0"
                      >
                        {/* Resource Header (always visible) */}
                        <div
                          className={`flex justify-between items-center py-3 px-4 cursor-pointer transition-colors hover:bg-[#F7F7F7] ${
                            isSectionExpanded(resource.resource) ? "bg-blue-50" : ""
                          }`}
                          onClick={() => toggleSection(resource.resource)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isSectionExpanded(resource.resource)
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {resource.icon}
                            </div>
                            <div>
                              <h3 className="font-medium text-[#333333]">
                                {resource.label}
                              </h3>
                              <p className="text-xs text-[#666666] mt-0.5">
                                {resource.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {/* Resource Permission Indicators - desktop only */}
                            <div className="hidden md:flex items-center gap-3 mr-4">
                              {actionsList.map((action) => {
                                const permissionEnabled = hasPermission(
                                  resource.resource,
                                  action.action
                                );
                                return (
                                  <div
                                    key={action.action}
                                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                                      permissionEnabled
                                        ? "bg-green-100 text-green-600"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                    title={`${action.label}: ${
                                      permissionEnabled
                                        ? "Allowed"
                                        : "Denied"
                                    }`}
                                  >
                                    {action.icon}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Mobile permission summary */}
                            <div className="md:hidden mr-3">
                              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {actionsList.filter(action => 
                                  hasPermission(resource.resource, action.action)
                                ).length} / {actionsList.length}
                              </div>
                            </div>

                            {/* Expand/Collapse Indicator */}
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                isSectionExpanded(resource.resource)
                                  ? "bg-blue-100 text-blue-700 rotate-90"
                                  : "bg-gray-100 text-gray-500 rotate-0"
                              } transition-all`}
                            >
                              <ChevronRight size={20} />
                            </div>
                          </div>
                        </div>

                        {/* Resource Permissions (expandable) */}
                        {isSectionExpanded(resource.resource) && (
                          <div className="p-4 bg-blue-50/30 border-t border-[#E0E0E0]">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                              {actionsList.map((action) => {
                                const permissionEnabled = hasPermission(
                                  resource.resource,
                                  action.action
                                );

                                return (
                                  <div
                                    key={action.action}
                                    className="flex flex-col bg-white rounded-xl border border-[#E0E0E0] overflow-hidden hover:shadow transition-shadow"
                                  >
                                    <div className="p-3 bg-[#F7F7F7] border-b border-[#E0E0E0] flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`p-1 rounded ${
                                          permissionEnabled 
                                            ? "bg-green-100 text-green-600" 
                                            : "bg-gray-100 text-gray-500"
                                        }`}>
                                          {action.icon}
                                        </div>
                                        <p className="font-medium text-[#333333]">
                                          {action.label}
                                        </p>
                                      </div>
                                      <div>
                                        {(addPermissionMutation.isPending || deletePermissionMutation.isPending) ? (
                                          <div className="w-10 flex justify-center">
                                            <Loader2 size={18} className="animate-spin text-[#FF5F00]" />
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>

                                    <div className="p-3 flex items-center justify-between">
                                      <p className="text-xs text-[#666666] flex-1">
                                        {action.description}
                                      </p>

                                      <div className="relative h-6 w-12">
                                        <input
                                          type="checkbox"
                                          id={`toggle-${resource.resource}-${action.action}`}
                                          checked={permissionEnabled}
                                          onChange={() =>
                                            togglePermission(
                                              resource.resource,
                                              action.action
                                            )
                                          }
                                          disabled={
                                            selectedRole?.isSystem || 
                                            addPermissionMutation.isPending || 
                                            deletePermissionMutation.isPending
                                          }
                                          className="opacity-0 w-0 h-0 absolute"
                                        />
                                        <label
                                          htmlFor={`toggle-${resource.resource}-${action.action}`}
                                          className={`absolute inset-0 rounded-full transition-colors cursor-pointer ${
                                            selectedRole?.isSystem
                                              ? "bg-gray-300 cursor-not-allowed"
                                              : permissionEnabled
                                                ? "bg-[#00A651]"
                                                : "bg-gray-300"
                                          }`}
                                        >
                                          <span
                                            className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${
                                              permissionEnabled
                                                ? "translate-x-6"
                                                : "translate-x-0"
                                            }`}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Info Banner */}
              {selectedRole?.isSystem && (
                <div className="mt-6 p-4 bg-gradient-to-r from-[#FF5F00]/5 to-[#FF5F00]/10 border-l-4 border-[#FF5F00] rounded-r-lg flex items-start">
                  <Shield
                    size={20}
                    className="text-[#FF5F00] mt-0.5 mr-3 flex-shrink-0"
                  />
                  <div>
                    <p className="font-medium text-[#FF5F00]">System Role Permissions</p>
                    <p className="text-sm text-[#666666] mt-1">
                      The {selectedRole.displayName} role is a system role with
                      predefined permissions. These permissions cannot be modified
                      to ensure proper system functionality and security.
                    </p>
                  </div>
                </div>
              )}

              {/* Permissions Legend */}
              <div className="mt-6 bg-white rounded-lg border border-[#E0E0E0] p-4 shadow-sm">
                <h3 className="text-[#333333] font-medium mb-3 flex items-center">
                  <Info size={16} className="text-[#666666] mr-2" />
                  Permission Types
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {actionsList.map(action => (
                    <div key={action.action} className="bg-[#F7F7F7] rounded-lg p-3 flex items-start">
                      <div className="bg-white p-1.5 rounded-md shadow-sm text-[#333333] mr-2">
                        {action.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[#333333]">{action.label}</p>
                        <p className="text-xs text-[#666666] mt-0.5">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-md border border-[#E0E0E0] p-8 text-center bg-gray-50">
              <Shield size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-[#333333] mb-1">Select a Role</p>
              <p className="text-[#666666] max-w-md mx-auto">
                Choose a role from the dropdown above to view and manage its permissions
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F7F7F7] p-4 border-t border-[#E0E0E0] flex items-center">
          <Info size={16} className="text-[#666666] mr-2 flex-shrink-0" />
          <span className="text-sm text-[#666666]">
            Permission changes are automatically saved and take effect immediately. Each role defines what actions users can perform within the system.
          </span>
        </div>
      </div>
    </div>
  );
}