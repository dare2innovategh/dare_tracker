import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Edit, Trash2, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { usePermissions } from "@/hooks/use-permissions";
import { PermissionGuard } from "@/components/permission-guard";
import { useAuth } from "@/hooks/use-auth";

type YouthProfile = {
  id: number;
  fullName: string;
  district: string;
  email?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  town?: string | null;
  createdAt: string;
};

export default function YouthManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();

  // Fetch all youth profiles
  const { data: profiles, isLoading } = useQuery<YouthProfile[]>({
    queryKey: ['/api/youth-profiles'],
    staleTime: 10000,
  });

  // Add youth profile mutation
  const addProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/youth-profiles', formData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add youth profile');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Youth profile added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/youth-profiles'] });
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete youth profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/youth-profiles/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete youth profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Youth profile deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/youth-profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    addProfileMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this youth profile?")) {
      deleteProfileMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Youth Profile Management</h1>
        {/* Triple-check to ensure mentors cannot see this button */}
        {hasPermission("youth_profiles", "create") && !user?.role?.toLowerCase().includes('mentor') && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus size={16} />
                Add Youth Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Youth Profile</DialogTitle>
                <DialogDescription>
                  Enter the details for the new youth profile. Fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" name="fullName" placeholder="Enter full name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District *</Label>
                      <Select name="district" required defaultValue="Bekwai">
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bekwai">Bekwai</SelectItem>
                          <SelectItem value="Gushegu">Gushegu</SelectItem>
                          <SelectItem value="Lower Manya Krobo">Lower Manya Krobo</SelectItem>
                          <SelectItem value="Yilo Krobo">Yilo Krobo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="Enter email address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input id="phoneNumber" name="phoneNumber" placeholder="Enter phone number" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select name="gender">
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="town">Town</Label>
                      <Input id="town" name="town" placeholder="Enter town" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coreSkills">Core Skills</Label>
                    <Textarea id="coreSkills" name="coreSkills" placeholder="Describe core skills" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessInterest">Business Interest</Label>
                    <Textarea id="businessInterest" name="businessInterest" placeholder="Describe business interests" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addProfileMutation.isPending}
                  >
                    {addProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !profiles || profiles.length === 0 ? (
        <Card className="w-full">
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium">No youth profiles yet</h3>
              <p className="text-muted-foreground mt-2">Add a new youth profile to get started.</p>
              {hasPermission("youth_profiles", "create") && !user?.role?.toLowerCase().includes('mentor') && (
                <Button 
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Youth Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="truncate">{profile.fullName}</CardTitle>
                <CardDescription>
                  <span className="font-medium">District:</span> {profile.district}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pb-3">
                {profile.email && (
                  <div className="text-sm">
                    <span className="font-medium">Email:</span> {profile.email}
                  </div>
                )}
                {profile.phoneNumber && (
                  <div className="text-sm">
                    <span className="font-medium">Phone:</span> {profile.phoneNumber}
                  </div>
                )}
                {profile.town && (
                  <div className="text-sm">
                    <span className="font-medium">Town:</span> {profile.town}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Added:</span> {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation(`/youth-profiles/${profile.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {hasPermission("youth_profiles", "edit") && !user?.role?.toLowerCase().includes('mentor') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation(`/youth-profiles/${profile.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {hasPermission("youth_profiles", "delete") && !user?.role?.toLowerCase().includes('mentor') && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(profile.id)}
                    disabled={deleteProfileMutation.isPending}
                  >
                    {deleteProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}