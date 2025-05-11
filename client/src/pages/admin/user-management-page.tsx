import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Loader2, 
  RefreshCw, 
  XCircle, 
  CheckCircle2,
  User as UserIcon,
  Shield,
  AtSign,
  MapPin,
  UserCog,
  Search,
  Info,
  Filter,
  Eye,
  EyeOff,
  ArrowUpDown,
  AlertCircle,
  Users,
  UserCheck
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import DashboardLayout from '@/components/layout/dashboard-layout';

// Type definition for the users from the API
type UserResponse = {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: string;
  district: string | null;
  profilePicture: string | null;
  createdAt: string;
  [key: string]: string | number | null | undefined; // Allow string indexing
};

// Type for paginated response
type PaginatedUsersResponse = {
  users: UserResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Schema for creating/updating users
const userFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().optional().refine(value => {
    // If provided, password should be at least 6 characters
    return !value || value.length >= 6;
  }, {
    message: 'Password must be at least 6 characters',
  }),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email().nullable().optional(),
  role: z.string().min(1, 'Role is required'),
  district: z.enum(['Bekwai', 'Gushegu', 'Lower Manya Krobo', 'Yilo Krobo']).nullable().optional(),
  profilePicture: z.string().nullable().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// Type for custom roles
type CustomRole = {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export default function UserManagementPage() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [sortField, setSortField] = useState('fullName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [allRoles, setAllRoles] = useState<{value: string, label: string}[]>([
    { value: 'admin', label: 'Admin' }
  ]);

  // Fetch users with pagination
  const { data: usersData, isLoading, error, refetch } = useQuery<PaginatedUsersResponse>({
    queryKey: ['/api/users', { page: currentPage, limit: pageSize }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const { page, limit } = params as { page: number, limit: number };
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
  
  // Fetch roles from database
  const { data: fetchedRoles, isLoading: isLoadingRoles, error: rolesError } = useQuery<CustomRole[]>({
    queryKey: ['/api/roles'],
    staleTime: 60000, // 1 minute
  });

  // Effect to update role options when roles are fetched
  useEffect(() => {
    if (fetchedRoles && Array.isArray(fetchedRoles)) {
      console.log("Found database roles:", fetchedRoles);
      
      // Update custom roles state
      setCustomRoles(fetchedRoles);
      
      // Create a list for all roles directly from database
      const roleOptions: {value: string, label: string}[] = fetchedRoles.map(role => ({
        value: role.name,
        label: role.name.charAt(0).toUpperCase() + role.name.slice(1), // Capitalize first letter
      }));
      
      console.log("Updated role options from database:", roleOptions);
      
      // Update the state with the new role options
      setAllRoles(roleOptions);
    }
  }, [fetchedRoles]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      const res = await apiRequest('POST', '/api/users', userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Created',
        description: 'The user has been created successfully.',
        variant: 'default',
      });
      setIsCreateDialogOpen(false);
      // Invalidate all user queries regardless of pagination params
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      createForm.reset();
      // Reset to first page to see the new user
      setCurrentPage(1);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: UserFormValues }) => {
      const res = await apiRequest('PATCH', `/api/users/${id}`, userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Updated',
        description: 'The user has been updated successfully.',
        variant: 'default',
      });
      setIsEditDialogOpen(false);
      // Invalidate all user queries regardless of pagination params
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/users/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Deleted',
        description: 'The user has been deleted successfully.',
        variant: 'default',
      });
      setIsDeleteDialogOpen(false);
      // Invalidate all user queries regardless of pagination params
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      // Update page if we're on the last page and it's now empty
      if (displayedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form for creating a new user
  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      email: null,
      role: 'admin', // Default role is admin (our only role)
      district: null,
      profilePicture: null,
    },
  });
  
  // Update form when roles load to set the default role value
  useEffect(() => {
    if (fetchedRoles && Array.isArray(fetchedRoles) && fetchedRoles.length > 0) {
      console.log("Updating role options in form with fetched roles");
      
      // Set default role from first available role in database
      if (fetchedRoles[0]) {
        createForm.setValue('role', fetchedRoles[0].name);
      }
    }
  }, [fetchedRoles]);

  // Form for editing an existing user
  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      password: '', // Optional for updates
      fullName: '',
      email: null,
      role: 'admin', // Default role is admin (our only role)
      district: null,
      profilePicture: null,
    },
  });

  const handleCreateSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  const handleEditSubmit = (data: UserFormValues) => {
    if (selectedUser) {
      // If password is empty, remove it from the request
      if (!data.password) {
        const { password, ...restData } = data;
        updateUserMutation.mutate({ id: selectedUser.id, userData: restData });
      } else {
        updateUserMutation.mutate({ id: selectedUser.id, userData: data });
      }
    }
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const openEditDialog = (user: UserResponse) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      password: '', // Don't populate password field
      fullName: user.fullName,
      email: user.email,
      role: user.role as 'admin' | 'mentor' | 'user',
      district: user.district as any,
      profilePicture: user.profilePicture,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: UserResponse) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter and sort users from paginated response
  const displayedUsers = usersData?.users || [];
  const totalUsers = usersData?.pagination ? usersData.pagination.total || 0 : 0;
  const totalPages = usersData?.pagination ? usersData.pagination.totalPages || 1 : 1;
  
  // For UI display of how many users are currently shown with filters
  const filteredCount = displayedUsers.length;
  
  // TODO: When server-side filtering is implemented, 
  // we'll need to pass filter parameters to the API
  // For now, we'll still apply client-side filtering for the existing UI
  const filteredUsers = displayedUsers
    .filter(user => {
      // Search filter (applied client-side for now)
      const searchMatch = searchTerm === '' || 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

      // Role filter
      const roleMatch = filterRole === 'all' || user.role === filterRole;

      // District filter
      const districtMatch = 
        filterDistrict === 'all' || 
        user.district === filterDistrict ||
        (filterDistrict === 'none' && !user.district);

      return searchMatch && roleMatch && districtMatch;
    })
    .sort((a, b) => {
      // Handle null values
      const aValue = a[sortField as keyof UserResponse] || '';
      const bValue = b[sortField as keyof UserResponse] || '';

      // Sort direction
      return sortDirection === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  // Toggle sort
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterDistrict('all');
  };

  // Helper function to render roles from database
  const renderRoleOptions = () => {
    if (isLoadingRoles) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Loading roles...</span>
        </div>
      );
    }
    
    if (!allRoles.length) {
      return (
        <div className="flex items-center justify-center p-4">
          <span className="text-gray-500">No roles available</span>
        </div>
      );
    }
    
    return (
      <>
        {allRoles.map((role) => (
          <SelectItem 
            key={role.value} 
            value={role.value}
          >
            <div className="flex items-center gap-2">
              {role.value === 'admin' && <Shield className="h-4 w-4 text-[#EB001B]" />}
              {role.label}
            </div>
          </SelectItem>
        ))}
      </>
    );
  };

  // Helper function to render role badge with appropriate color
  const getRoleBadge = (role: string) => {
    // Get the display name for the role from allRoles if available
    const roleInfo = allRoles.find(r => r.value === role);
    const displayName = roleInfo ? roleInfo.label : role;
    
    // Map of badge classes by role
    const badgeClasses = {
      admin: "bg-[#EB001B] text-white",
      mentor: "bg-[#0072CE] text-white",
      user: "bg-gray-500 text-white",
      program_manager: "bg-[#FF5F00] text-white",
      mentor_lead: "bg-blue-600 text-white",
      // Default for any other roles
      default: "bg-gray-400 text-white"
    };

    // Map of icons by role
    const iconMap = {
      admin: <Shield className="h-3 w-3 mr-1" />,
      mentor: <UserCog className="h-3 w-3 mr-1" />,
      user: <UserIcon className="h-3 w-3 mr-1" />,
      program_manager: <Users className="h-3 w-3 mr-1" />,
      mentor_lead: <UserCheck className="h-3 w-3 mr-1" />,
      // Default for any other roles
      default: <UserIcon className="h-3 w-3 mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeClasses[role as keyof typeof badgeClasses] || badgeClasses.default}`}>
        {iconMap[role as keyof typeof iconMap] || iconMap.default}
        {displayName}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-[#EB001B] to-[#FF5F00] text-white p-6 mb-6 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <UserCog className="h-7 w-7" />
                User Management
              </h1>
              <p className="mt-2 text-white/80 max-w-2xl">
                Create, update, and manage system users for the DARE Youth-in-Jobs Tracker Platform
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
                className="bg-white text-[#EB001B] hover:bg-white/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-[#E0E0E0]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-[#E0E0E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5F00]/30"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select 
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="appearance-none pl-9 pr-8 py-2 border border-[#E0E0E0] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5F00]/30"
                >
                  <option value="all">All Roles</option>
                  {isLoadingRoles ? (
                    <option disabled>Loading roles...</option>
                  ) : (
                    allRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <select 
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="appearance-none pl-9 pr-8 py-2 border border-[#E0E0E0] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5F00]/30"
                >
                  <option value="all">All Districts</option>
                  <option value="Bekwai">Bekwai</option>
                  <option value="Gushegu">Gushegu</option>
                  <option value="Lower Manya Krobo">Lower Manya Krobo</option>
                  <option value="Yilo Krobo">Yilo Krobo</option>
                  <option value="none">No District</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <Button 
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="px-3 py-2 text-sm border border-[#E0E0E0]"
              >
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Card className="shadow-md border-[#E0E0E0]">
          <CardHeader className="bg-[#F7F7F7] border-b border-[#E0E0E0]">
            <div className="flex justify-between items-center">
              <CardTitle>System Users</CardTitle>
              <CardDescription>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-[#FF5F00]" />
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-16 text-center">
                <XCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-muted-foreground mb-3">Failed to load users. Please try again.</p>
                <Button 
                  onClick={() => refetch()}
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="font-medium mb-1">No users found</p>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or create a new user</p>
                <Button 
                  onClick={resetFilters}
                  variant="outline"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="relative overflow-x-auto rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F7F7F7] hover:bg-[#F0F0F0]">
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => toggleSort('fullName')}
                      >
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1 text-[#FF5F00]" />
                          <span>Name</span>
                          {sortField === 'fullName' && (
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => toggleSort('username')}
                      >
                        <div className="flex items-center">
                          <span>Username</span>
                          {sortField === 'username' && (
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => toggleSort('email')}
                      >
                        <div className="flex items-center">
                          <AtSign className="h-4 w-4 mr-1 text-[#FF5F00]" />
                          <span>Email</span>
                          {sortField === 'email' && (
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => toggleSort('role')}
                      >
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-1 text-[#FF5F00]" />
                          <span>Role</span>
                          {sortField === 'role' && (
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => toggleSort('district')}
                      >
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-[#FF5F00]" />
                          <span>District</span>
                          {sortField === 'district' && (
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-[#F7F7F7]/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-[#F0F0F0] flex items-center justify-center text-[#333333] mr-3">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span>{user.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.district ? (
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              {user.district}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="hover:text-[#FF5F00] hover:bg-[#FF5F00]/10"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            disabled={user.role === 'admin' && user.id === 1}
                            className="hover:text-[#EB001B] hover:bg-[#EB001B]/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center py-4 border-t border-[#E0E0E0]">
                    <Pagination>
                      <PaginationContent>
                        {/* Previous Page */}
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                          />
                        </PaginationItem>
                        
                        {/* First Page */}
                        {currentPage > 2 && (
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                          </PaginationItem>
                        )}
                        
                        {/* Ellipsis if needed */}
                        {currentPage > 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        {/* Previous Page Number if not first */}
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
                              {currentPage - 1}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        {/* Current Page */}
                        <PaginationItem>
                          <PaginationLink isActive>{currentPage}</PaginationLink>
                        </PaginationItem>
                        
                        {/* Next Page Number if not last */}
                        {currentPage < totalPages && (
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
                              {currentPage + 1}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        {/* Ellipsis if needed */}
                        {currentPage < totalPages - 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        {/* Last Page */}
                        {currentPage < totalPages - 1 && (
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(totalPages)}>
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        {/* Next Page */}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t border-[#E0E0E0] py-3 px-4 bg-[#F7F7F7]">
            <div className="w-full flex justify-between items-center text-sm text-muted-foreground">
              <div>
                <span>Total users: {totalUsers}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  className="bg-white border border-[#E0E0E0] rounded px-2 py-1 text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="bg-gradient-to-r from-[#EB001B] to-[#FF5F00] -mx-5 -mt-5 px-6 py-4 rounded-t-lg text-white">
              <DialogTitle className="text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Create New User
              </DialogTitle>
              <DialogDescription className="text-white/80">
                Add a new user to the system. All users need a username and password to login.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4 pt-2">
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={passwordVisible ? "text" : "password"} 
                            placeholder="••••••" 
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                          {passwordVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="email" 
                            placeholder="user@example.com" 
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            className="pl-9"
                          />
                          <AtSign className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                      </FormControl>
                      <FormDescription>Optional email address</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <div className="relative">
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="pl-9">
                                <Shield className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {renderRoleOptions()}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <div className="relative">
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="pl-9">
                                <MapPin className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <SelectValue placeholder="Select a district" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Bekwai">Bekwai</SelectItem>
                              <SelectItem value="Gushegu">Gushegu</SelectItem>
                              <SelectItem value="Lower Manya Krobo">Lower Manya Krobo</SelectItem>
                              <SelectItem value="Yilo Krobo">Yilo Krobo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <FormDescription>Required for Mentors</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mt-2">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Security Note:</span> Make sure to use strong passwords and share credentials securely with users.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="bg-[#EB001B] hover:bg-[#EB001B]/90"
                  >
                    {createUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="bg-gradient-to-r from-[#0072CE] to-[#00A651] -mx-5 -mt-5 px-6 py-4 rounded-t-lg text-white">
              <DialogTitle className="text-white flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                {selectedUser && `Edit User: ${selectedUser.fullName}`}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                Update user information. Leave the password field empty to keep the current password.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 pt-2">
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={passwordVisible ? "text" : "password"} 
                            placeholder="Leave blank to keep current password" 
                            {...field} 
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                          {passwordVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormDescription>
                        Leave empty to keep the current password
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="email" 
                            placeholder="user@example.com" 
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            className="pl-9"
                          />
                          <AtSign className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <div className="relative">
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={selectedUser?.id === 1} // Can't change role for main admin
                          >
                            <FormControl>
                              <SelectTrigger className="pl-9">
                                <Shield className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {renderRoleOptions()}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedUser?.id === 1 && (
                          <FormDescription className="text-amber-600">
                            Main admin role cannot be changed
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <div className="relative">
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="pl-9">
                                <MapPin className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <SelectValue placeholder="Select a district" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Bekwai">Bekwai</SelectItem>
                              <SelectItem value="Gushegu">Gushegu</SelectItem>
                              <SelectItem value="Lower Manya Krobo">Lower Manya Krobo</SelectItem>
                              <SelectItem value="Yilo Krobo">Yilo Krobo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="bg-[#00A651] hover:bg-[#00A651]/90"
                  >
                    {updateUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader className="bg-gradient-to-r from-[#EB001B] to-[#EB001B]/80 -mx-5 -mt-5 px-6 py-4 rounded-t-lg text-white">
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Delete User
              </AlertDialogTitle>
            </AlertDialogHeader>

            {selectedUser && (
              <div className="pt-2">
                <div className="mb-4">
                  <p className="text-[#333333] mb-2">
                    Are you sure you want to delete the following user?
                  </p>

                  <div className="bg-[#F7F7F7] p-4 rounded-lg mb-4">
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 rounded-full bg-[#EB001B]/10 flex items-center justify-center text-[#EB001B] mr-3">
                        {selectedUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[#333333]">{selectedUser.fullName}</div>
                        <div className="text-sm text-[#666666]">{selectedUser.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-[#666666]">
                      <Shield className="h-4 w-4 mr-1 text-[#666666]" />
                      <span>Role: {selectedUser.role}</span>
                    </div>

                    {selectedUser.district && (
                      <div className="flex items-center text-sm text-[#666666] mt-1">
                        <MapPin className="h-4 w-4 mr-1 text-[#666666]" />
                        <span>District: {selectedUser.district}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg mb-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-amber-700">
                        <span className="font-medium">Warning:</span> This action cannot be undone. The user will be permanently removed from the system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser}
                className="bg-[#EB001B] text-white hover:bg-[#EB001B]/90"
                disabled={deleteUserMutation.isPending || (selectedUser?.role === 'admin' && selectedUser?.id === 1)}
              >
                {deleteUserMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}