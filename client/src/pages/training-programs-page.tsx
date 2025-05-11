import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen,
  ChevronRight,
  Loader2,
  Filter
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Application theme - consistent with the dashboard
const THEME = {
  primary: "#0072CE", // Mastercard blue
  secondary: "#6C17C9", // Purple
  accent: "#00B8A9", // Teal
  dark: "#172449", // Dark blue
  warning: "#EB001B", // Mastercard red
  success: "#00A36C", // Green
  mastercard: {
    red: "#EB001B", 
    yellow: "#F79E1B",
    orange: "#FF5F00"
  }
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

// Define schema for training program form
const trainingProgramSchema = z.object({
  name: z.string().min(3, { message: "Program name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string(),
  totalModules: z.coerce.number().min(1, { message: "Program must have at least 1 module" })
});

type TrainingProgram = {
  id: number;
  name: string;
  description: string;
  category: string;
  totalModules: number;
  enrolledParticipants?: number;
  completionRate?: number;
  createdAt?: string;
};

type TrainingProgramFormValues = z.infer<typeof trainingProgramSchema>;

export default function TrainingProgramsPage() {
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();
  const { toast } = useToast();
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Check permissions
  const canViewTraining = hasPermission("training", "view");
  const canCreateTraining = hasPermission("training", "create");
  const canEditTraining = hasPermission("training", "edit");
  const canDeleteTraining = hasPermission("training", "delete");

  // Fetch training programs
  const { data: trainingPrograms = [], isLoading } = useQuery<TrainingProgram[]>({
    queryKey: ['/api/training/programs'],
    queryFn: async ({ queryKey }) => {
      const [url] = queryKey;
      try {
        const response = await fetch(url as string);
        
        if (!response.ok) {
          throw new Error(`Request failed with status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Query error:", error);
        throw error;
      }
    },
    enabled: canViewTraining, // Only fetch if user has view permission
  });

  // Filter programs based on search query
  const filteredPrograms = trainingPrograms.filter((program: TrainingProgram) => 
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create training program mutation
  const createMutation = useMutation({
    mutationFn: async (data: TrainingProgramFormValues) => {
      const res = await apiRequest('POST', '/api/training/programs', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training program created successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/programs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create training program",
        variant: "destructive",
      });
    },
  });

  // Update training program mutation
  const updateMutation = useMutation({
    mutationFn: async (data: TrainingProgram) => {
      // Remove date fields - let the server set these
      const submitData = {
        name: data.name,
        description: data.description,
        category: data.category,
        totalModules: data.totalModules
      };
      console.log("Submitting training program update:", submitData);
      const res = await apiRequest('PATCH', `/api/training/programs/${data.id}`, submitData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training program updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/programs'] });
      setIsEditOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update training program",
        variant: "destructive",
      });
    },
  });

  // Delete training program mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/training/programs/${id}`);
      return await res.text();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training program deleted successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/programs'] });
      setIsDeleteOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete training program",
        variant: "destructive",
      });
    },
  });

  // Form for creating new training program
  const createForm = useForm<TrainingProgramFormValues>({
    resolver: zodResolver(trainingProgramSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "digital-skills",
      totalModules: 1
    }
  });

  // Form for editing existing training program
  const editForm = useForm<TrainingProgramFormValues>({
    resolver: zodResolver(trainingProgramSchema),
    defaultValues: {
      name: selectedProgram?.name || "",
      description: selectedProgram?.description || "",
      category: selectedProgram?.category || "digital-skills",
      totalModules: selectedProgram?.totalModules || 1
    }
  });

  // Handler for create form submission
  const handleCreateSubmit = (data: TrainingProgramFormValues) => {
    createMutation.mutate(data);
  };

  // Handler for edit form submission
  const handleEditSubmit = (data: TrainingProgramFormValues) => {
    if (selectedProgram) {
      updateMutation.mutate({ ...selectedProgram, ...data });
    }
  };

  // Handler for delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedProgram) {
      deleteMutation.mutate(selectedProgram.id);
    }
  };

  // Handler for opening the edit dialog
  const handleEditOpen = (program: TrainingProgram) => {
    setSelectedProgram(program);
    // Reset form with program values
    editForm.reset({
      name: program.name,
      description: program.description,
      category: program.category,
      totalModules: program.totalModules
    });
    setIsEditOpen(true);
  };

  // Function to generate badge color based on category
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'pre-outreach':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'post-outreach':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Function to format category display name
  const formatCategoryName = (category: string) => {
    if (!category) return '';
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get query function helper
  function getQueryFn(options?: { on401?: 'returnNull' }) {
    return async ({ queryKey }: { queryKey: string[] }) => {
      const [url] = queryKey;
      try {
        const response = await fetch(url);
        
        if (response.status === 401 && options?.on401 === 'returnNull') {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`Request failed with status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Query error:", error);
        throw error;
      }
    };
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-xl font-medium mb-2" style={{ color: THEME.dark }}>
            Loading Training Programs
          </h3>
          <p className="text-gray-500">
            Please wait while we fetch the training programs
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Access denied state
  if (isLoadingPermissions) {
    return (
      <DashboardLayout pageTitle="Training Programs">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canViewTraining) {
    return (
      <DashboardLayout pageTitle="Training Programs">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <div className="bg-red-50 border border-red-300 rounded-xl p-8 max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-5">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10v4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to view Training Programs. Please contact your administrator for access.
            </p>
            <div className="flex justify-center">
              <Link href="/dashboard">
                <Button variant="outline" className="mr-2">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header with animation */}
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={fadeIn}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <div className="flex items-center">
              <GraduationCap className="mr-2 h-6 w-6" style={{ color: THEME.primary }} />
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: THEME.dark }}>
                Training Programs
              </h1>
            </div>
            <p className="text-gray-500 mt-1">
              Manage digital training programs and educational resources
            </p>
          </div>
          
          {canCreateTraining && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="shadow-sm transition-colors"
                  style={{ 
                    background: `linear-gradient(135deg, ${THEME.secondary}, ${THEME.primary})`,
                    border: "none" 
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Training Program
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle style={{ color: THEME.dark }}>Create New Training Program</DialogTitle>
                  <DialogDescription>
                    Add a new training program to the platform. Fill out the details below.
                  </DialogDescription>
                </DialogHeader>

                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Digital Marketing Fundamentals" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a brief description of this training program" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pre-outreach">Pre-Outreach</SelectItem>
                                <SelectItem value="post-outreach">Post-Outreach</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="totalModules"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Modules</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter className="pt-4">
                      <DialogClose asChild>
                        <Button variant="outline" type="button">Cancel</Button>
                      </DialogClose>
                      <Button 
                        type="submit"
                        disabled={createMutation.isPending}
                        style={{ background: THEME.primary }}
                      >
                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Program
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Search and filter controls */}
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={fadeIn}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search training programs..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSearchQuery("")}>
                  All Programs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchQuery("pre-outreach")}>
                Pre-Outreach
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchQuery("post-outreach")}>
                Post-Outreach
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Programs List */}
        {filteredPrograms.length === 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-gray-50 rounded-lg p-8 text-center"
          >
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No training programs found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {searchQuery 
                ? `No programs match your search for "${searchQuery}". Try a different search term.` 
                : "There are no training programs in the system yet. Add your first program to get started."}
            </p>
            {canCreateTraining && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Training Program
                  </Button>
                </DialogTrigger>
                {/* Dialog content would be duplicated here but omitted for brevity */}
              </Dialog>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPrograms.map((program) => (
              <motion.div key={program.id} variants={itemVariants}>
                <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div 
                      className="absolute -top-[1px] left-0 right-0 h-1.5 rounded-t-lg"
                      style={{ 
                        background: `linear-gradient(to right, ${THEME.mastercard.red}, ${THEME.mastercard.orange}, ${THEME.mastercard.yellow})` 
                      }}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge 
                          variant="secondary" 
                          className={getCategoryBadgeColor(program.category)}
                        >
                          {formatCategoryName(program.category)}
                        </Badge>
                        
                        {canEditTraining && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedProgram(program);
                                setIsViewOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canEditTraining && (
                                <DropdownMenuItem onClick={() => handleEditOpen(program)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Program
                                </DropdownMenuItem>
                              )}
                              {canDeleteTraining && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedProgram(program);
                                    setIsDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Program
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <CardTitle className="text-lg" style={{ color: THEME.dark }}>
                        {program.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-600">Modules</span>
                            <span className="text-gray-700">{program.totalModules}</span>
                          </div>
                        </div>
                        
                        {program.completionRate !== undefined && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-600">Completion Rate</span>
                              <span className="text-gray-700">{program.completionRate}%</span>
                            </div>
                            <Progress value={program.completionRate} className="h-1.5" />
                          </div>
                        )}
                        
                        {program.enrolledParticipants !== undefined && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-600">Enrolled Participants</span>
                              <span className="text-gray-700">{program.enrolledParticipants}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-4">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-center hover:bg-gray-50"
                        onClick={() => {
                          setSelectedProgram(program);
                          setIsViewOpen(true);
                        }}
                      >
                        <span className="mr-1" style={{ color: THEME.primary }}>View Details</span>
                        <ChevronRight className="h-4 w-4" style={{ color: THEME.primary }} />
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View Program Dialog */}
        {selectedProgram && (
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={getCategoryBadgeColor(selectedProgram.category)}
                  >
                    {formatCategoryName(selectedProgram.category)}
                  </Badge>
                  <DialogTitle style={{ color: THEME.dark }}>{selectedProgram.name}</DialogTitle>
                </div>
                <DialogDescription>
                  {selectedProgram.createdAt && (
                    <p className="text-sm text-gray-500 mt-1">
                      Added on {new Date(selectedProgram.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <h4 className="text-sm font-medium mb-1" style={{ color: THEME.dark }}>Description</h4>
                  <p className="text-gray-700">{selectedProgram.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1" style={{ color: THEME.dark }}>Total Modules</h4>
                    <p className="text-gray-700">{selectedProgram.totalModules}</p>
                  </div>

                  {selectedProgram.enrolledParticipants !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium mb-1" style={{ color: THEME.dark }}>Enrolled Participants</h4>
                      <p className="text-gray-700">{selectedProgram.enrolledParticipants}</p>
                    </div>
                  )}
                </div>

                {selectedProgram.completionRate !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium mb-1" style={{ color: THEME.dark }}>Completion Rate</h4>
                    <div className="flex items-center gap-3">
                      <Progress value={selectedProgram.completionRate} className="h-2 flex-1" />
                      <span className="text-sm font-medium text-gray-700">{selectedProgram.completionRate}%</span>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                
                {canEditTraining && (
                  <Button 
                    variant="outline"
                    style={{ color: THEME.primary, borderColor: THEME.primary }}
                    onClick={() => {
                      setIsViewOpen(false);
                      handleEditOpen(selectedProgram);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Program
                  </Button>
                )}
                
                {canDeleteTraining && (
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setIsViewOpen(false);
                      setIsDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Program Dialog */}
        {selectedProgram && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle style={{ color: THEME.dark }}>Edit Training Program</DialogTitle>
                <DialogDescription>
                  Update the training program details. Make your changes below.
                </DialogDescription>
              </DialogHeader>

              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pre-outreach">Pre-Outreach</SelectItem>
                              <SelectItem value="post-outreach">Post-Outreach</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="totalModules"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Modules</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter className="pt-4">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => setIsEditOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateMutation.isPending}
                      style={{ background: THEME.primary }}
                    >
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {selectedProgram && (
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle style={{ color: THEME.dark }}>Delete Training Program</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{selectedProgram.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Program
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}