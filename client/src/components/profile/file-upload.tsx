import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
}

export function FileUpload({ onImageUploaded, currentImage }: FileUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mutation for uploading a new image
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      try {
        // Use fetch directly for FormData
        const res = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!res.ok) {
          throw new Error(`Upload failed with status: ${res.status}`);
        }
        
        return await res.json();
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Image uploaded',
        description: 'Image has been uploaded successfully',
      });
      if (data.url) {
        onImageUploaded(data.url);
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
      
      // Create FormData and upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      uploadMutation.mutate(formData);
    }
  };
  
  // Trigger file input click when upload button is clicked
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      {/* Upload button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleUploadClick}
        disabled={isUploading || uploadMutation.isPending}
        className="flex items-center gap-1"
      >
        {isUploading || uploadMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-1" />
        )}
        {currentImage ? 'Change Image' : 'Upload Image'}
      </Button>
      
      {isUploading && <p className="text-sm text-gray-500">Uploading image...</p>}
    </div>
  );
}