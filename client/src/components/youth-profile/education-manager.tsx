import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Education } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, GraduationCap, Pencil, Trash, Clock, Check, Award, BookOpen, School, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EducationForm } from "./education-section-new";

interface EducationManagerProps {
  youthId: number;
  onSaved?: () => void;
}

export function EducationManager({ youthId, onSaved }: EducationManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [deletingEducation, setDeletingEducation] = useState<Education | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Ensure we don't try to fetch with an invalid ID
  const isValidYouthId = youthId > 0;
  
  // Fetch education records
  const { 
    data: educationRecords = [], 
    isLoading, 
    isError 
  } = useQuery<Education[]>({
    queryKey: [`/api/education/${youthId}`],
    enabled: isValidYouthId,
    refetchOnMount: true
  });
  
  // Group education by qualification status
  const completedEducation = educationRecords.filter(
    record => record.qualificationStatus === "Completed"
  );
  
  const inProgressEducation = educationRecords.filter(
    record => record.qualificationStatus === "In Progress"
  );
  
  const incompleteEducation = educationRecords.filter(
    record => record.qualificationStatus === "Incomplete"
  );
  
  // Mutation for deleting education
  const deleteEducationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/education/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/education/${youthId}`] });
      toast({
        title: "Education deleted",
        description: "The education record has been deleted successfully."
      });
      setDeletingEducation(null);
      setIsDeleteDialogOpen(false);
      
      if (onSaved) {
        onSaved();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete education record: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Handle dialog open/close
  const handleAddClick = () => {
    setEditingEducation(null);
    setIsAddDialogOpen(true);
  };
  
  const handleEditClick = (education: Education) => {
    setEditingEducation(education);
    setIsAddDialogOpen(true);
  };
  
  const handleDeleteClick = (education: Education) => {
    setDeletingEducation(education);
    setIsDeleteDialogOpen(true);
  };
  
  const handleFormClose = () => {
    setIsAddDialogOpen(false);
    setEditingEducation(null);
  };
  
  const handleFormSuccess = () => {
    setIsAddDialogOpen(false);
    setEditingEducation(null);
    
    if (onSaved) {
      onSaved();
    }
  };
  
  const handleDeleteConfirm = () => {
    if (deletingEducation) {
      deleteEducationMutation.mutate(deletingEducation.id);
    }
  };
  
  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeletingEducation(null);
  };
  
  // For invalid youth ID
  if (!isValidYouthId) {
    return (
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-6 text-center">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Save Profile First</h3>
          <p className="text-sm text-gray-500 mb-4">
            Please save the profile before adding education records.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500">Loading education records...</span>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-1">Error Loading Education</h3>
          <p className="text-sm text-red-600 mb-4">
            Failed to load education records. Please try again.
          </p>
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/education/${youthId}`] })}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (educationRecords.length === 0) {
    return (
      <div>
        <Card className="border-dashed border-gray-300 mb-6">
          <CardContent className="p-6 text-center">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Education Records</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start adding education qualifications, certifications, and training records.
            </p>
            <Button onClick={handleAddClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Education
            </Button>
          </CardContent>
        </Card>
        
        {/* Add new education dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Add Education Record</DialogTitle>
            </DialogHeader>
            <EducationForm 
              youthId={youthId}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // Display education records with tabs for different status
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className="text-base font-medium">
            {educationRecords.length} Education Record{educationRecords.length !== 1 ? 's' : ''}
          </h4>
          <p className="text-sm text-gray-500">
            Qualifications, certifications, and formal education
          </p>
        </div>
        <Button onClick={handleAddClick} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Education
        </Button>
      </div>
      
      <Tabs defaultValue="completed" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="completed" className="gap-2">
            <Check className="h-4 w-4" />
            Completed ({completedEducation.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="gap-2">
            <Clock className="h-4 w-4" />
            In Progress ({inProgressEducation.length})
          </TabsTrigger>
          <TabsTrigger value="incomplete" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Incomplete ({incompleteEducation.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            All ({educationRecords.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="completed" className="mt-0">
          <div className="space-y-4">
            {completedEducation.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No completed education records.</p>
            ) : (
              completedEducation.map((education) => (
                <EducationCard 
                  key={education.id} 
                  education={education} 
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="in-progress" className="mt-0">
          <div className="space-y-4">
            {inProgressEducation.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No in-progress education records.</p>
            ) : (
              inProgressEducation.map((education) => (
                <EducationCard 
                  key={education.id} 
                  education={education} 
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="incomplete" className="mt-0">
          <div className="space-y-4">
            {incompleteEducation.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No incomplete education records.</p>
            ) : (
              incompleteEducation.map((education) => (
                <EducationCard 
                  key={education.id} 
                  education={education} 
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all" className="mt-0">
          <div className="space-y-4">
            {educationRecords.map((education) => (
              <EducationCard 
                key={education.id} 
                education={education} 
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit education dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingEducation ? 'Edit Education Record' : 'Add Education Record'}
            </DialogTitle>
          </DialogHeader>
          <EducationForm 
            youthId={youthId}
            initialData={editingEducation || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the education record: 
              <span className="font-semibold"> {deletingEducation?.qualificationName}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteEducationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Education card component
interface EducationCardProps {
  education: Education;
  onEdit: (education: Education) => void;
  onDelete: (education: Education) => void;
}

function EducationCard({ education, onEdit, onDelete }: EducationCardProps) {
  const statusColors = {
    "Completed": "bg-green-100 text-green-800 border-green-200",
    "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
    "Incomplete": "bg-gray-100 text-gray-800 border-gray-200"
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Completed": 
        return <Check className="h-3 w-3 mr-1" />;
      case "In Progress":
        return <Clock className="h-3 w-3 mr-1" />;
      case "Incomplete":
      default:
        return <BookOpen className="h-3 w-3 mr-1" />;
    }
  };
  
  const status = education.qualificationStatus || "Incomplete";
  const statusClass = statusColors[status as keyof typeof statusColors];
  
  return (
    <Card className="relative overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all duration-200">
      <div className={`absolute top-0 left-0 w-full h-1 ${status === "Completed" ? "bg-green-500" : status === "In Progress" ? "bg-blue-500" : "bg-gray-400"}`}></div>
      <CardContent className="p-4 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold">{education.qualificationName}</h3>
              {education.isHighestQualification && (
                <Badge className="ml-2 bg-amber-100 text-amber-800 border border-amber-200">
                  <Award className="h-3 w-3 mr-1" />
                  Highest Qualification
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-500 mb-3">
              <span className="font-medium">{education.qualificationType}</span>
              {education.specialization && (
                <span> in {education.specialization}</span>
              )}
              {education.levelCompleted && (
                <>
                  <span className="mx-1">|</span>
                  <span>{education.levelCompleted} Level</span>
                </>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
              {education.institution && (
                <div className="flex items-center text-gray-600">
                  <School className="h-4 w-4 mr-1 text-gray-400" />
                  {education.institution}
                </div>
              )}
              
              {education.graduationYear && (
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  Graduation: {education.graduationYear}
                </div>
              )}
            </div>
            
            {education.additionalDetails && (
              <p className="text-sm text-gray-600 mt-2">{education.additionalDetails}</p>
            )}
            
            <div className="mt-3 flex items-center space-x-2">
              <Badge className={`text-xs ${statusClass} flex items-center`}>
                {getStatusIcon(status)}
                {status}
              </Badge>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onEdit(education)}
              className="h-8 w-8 text-gray-500 hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onDelete(education)}
              className="h-8 w-8 text-gray-500 hover:text-red-600"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}