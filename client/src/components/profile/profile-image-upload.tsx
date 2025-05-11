import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Pencil, Trash2, Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProfileImageUploadProps {
  profileId: number;
  profileImage: string | null;
  name: string;
  onImageChange?: (imageUrl: string | null) => void;
}

export function ProfileImageUpload({ 
  profileId, 
  profileImage, 
  name,
  onImageChange 
}: ProfileImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mutation for uploading a new profile image
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      try {
        // Use direct profile update endpoint with FormData
        const res = await fetch(`/api/youth-profiles/${profileId}`, {
          method: 'PUT',  // Use PUT for full update
          body: formData,
          credentials: 'include',
        });
        
        if (!res.ok) {
          throw new Error(`Upload failed with status: ${res.status}`);
        }
        
        // Get the updated profile data
        const updatedProfile = await res.json();
        
        return updatedProfile;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Profile image uploaded',
        description: 'Your profile image has been updated successfully',
      });
      if (onImageChange) {
        onImageChange(data.profilePicture);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for deleting the profile image
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/youth-profiles/${profileId}/profile-picture`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error(`Delete failed with status: ${res.status}`);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile image removed',
        description: 'Your profile image has been removed',
      });
      if (onImageChange) {
        onImageChange(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Removal failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle file selection and upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Selected file:', selectedFile.name, 'type:', selectedFile.type, 'size:', selectedFile.size);
      
      // Create a FormData object for the upload
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);
      
      setIsUploading(true);
      
      // Generate a unique timestamp for this upload to use as a cache buster
      const timestamp = Date.now();
      
      // Use the direct dedicated profile picture upload endpoint
      fetch(`/api/youth-profiles/${profileId}/profile-picture?t=${timestamp}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        cache: 'no-cache', // Force no caching
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Profile image uploaded successfully:', data);
          
          // Add a cache-busting parameter to force browsers to reload the image
          if (onImageChange && data.profilePicture) {
            const pictureUrl = data.profilePicture;
            // Force cache-busting with current timestamp
            const imageUrlWithCache = pictureUrl.includes('?') 
              ? `${pictureUrl}&t=${timestamp}` 
              : `${pictureUrl}?t=${timestamp}`;
            
            // Call onImageChange with the cache-busted URL
            onImageChange(imageUrlWithCache);
            
            // Force reload of the current image
            const img = new Image();
            img.src = imageUrlWithCache;
          }
          
          toast({
            title: 'Profile image uploaded',
            description: 'Your profile image has been updated successfully',
          });
        })
        .catch(error => {
          console.error('Error uploading profile image:', error);
          toast({
            title: 'Upload failed',
            description: error.message,
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsUploading(false);
        });
    }
  };
  
  // Trigger file input click when upload button is clicked
  const handleUploadClick = (e: React.MouseEvent) => {
    // Prevent the event from propagating up to parent forms
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle image delete
  const handleDeleteClick = (e: React.MouseEvent) => {
    // Prevent the event from propagating up to parent forms
    e.preventDefault();
    e.stopPropagation();
    
    if (profileImage) {
      deleteMutation.mutate();
    }
  };
  
  // Get the initials for the avatar fallback
  const getInitials = () => {
    if (!name) return 'U';
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  // Add cache-busting parameter to the profile image URL
  const imageWithCacheBusting = profileImage ? 
    profileImage.includes('?') ? 
      `${profileImage}&t=${Date.now()}` : 
      `${profileImage}?t=${Date.now()}` : 
    undefined;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Image with Avatar */}
      <div className="relative">
        <Avatar className="h-32 w-32 border-2 border-border">
          {profileImage ? (
            <AvatarImage src={imageWithCacheBusting} alt={name} />
          ) : null}
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {/* Edit button overlay */}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 rounded-full"
          onClick={handleUploadClick}
          disabled={isUploading || uploadMutation.isPending}
        >
          {isUploading || uploadMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          disabled={isUploading || uploadMutation.isPending}
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4 mr-1" />
          {profileImage ? 'Change' : 'Upload'}
        </Button>
        
        {profileImage && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1"
          >
            {deleteMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-1" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}