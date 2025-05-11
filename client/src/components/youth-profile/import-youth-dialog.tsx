import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload,
  Download,
  UploadCloud,
  FileText,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImportYouthDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
}

export function ImportYouthDialog({ children, trigger }: ImportYouthDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Import mutation for handling file uploads
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/youth-profile-import/import', formData, {
        rawFormData: true,
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import youth profiles');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Import successful',
        description: `Successfully imported ${data.success} youth profiles.`,
      });
      
      // Reset state
      setSelectedFile(null);
      setUploadProgress(0);
      setIsOpen(false);
      
      // Refresh youth profiles data
      queryClient.invalidateQueries({
        queryKey: ['/api/youth-profiles'],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
      setUploadProgress(0);
    }
  });
  
  // Truncate mutation for clearing existing profiles
  const truncateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/youth-profile-import/truncate');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to truncate youth profiles');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Truncate successful',
        description: `Successfully cleared ${data.count} youth profiles.`,
      });
      
      // Refresh youth profiles data
      queryClient.invalidateQueries({
        queryKey: ['/api/youth-profiles'],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Truncate failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handler for file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type (CSV or Excel)
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV or Excel file',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  // Handler for file upload
  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Display a loading toast
      toast({
        title: 'Processing file',
        description: 'Your file is being uploaded and processed...',
      });
      
      importMutation.mutate(formData);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Handler for downloading template
  const handleDownloadTemplate = async () => {
    try {
      // Get the hostname dynamically
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = '5000'; // Always use port 5000 for our backend
      
      // Build the API URL
      const apiUrl = `${protocol}//${hostname}:${port}/api/youth-profile-import/template`;
      
      // Fetch the template
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'text/csv',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      
      // Process the download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'youth-profiles-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Template downloaded',
        description: 'Youth profiles CSV template has been downloaded.',
      });
    } catch (error) {
      console.error('Download template error:', error);
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download template',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            <span>Import Profiles</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Youth Profiles</DialogTitle>
          <DialogDescription>
            Upload CSV or Excel file with youth profile data or use our template.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="template">Get Template</TabsTrigger>
            <TabsTrigger value="truncate">Clear Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="border rounded-md p-6 flex flex-col items-center justify-center space-y-4">
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm text-center text-muted-foreground">
                  <p>Drag and drop your file here or click to browse</p>
                  <p className="text-xs">Supports CSV and Excel files up to 10MB</p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="max-w-sm"
                  onChange={handleFileChange}
                />
              </div>
              
              {selectedFile && (
                <Alert className="bg-muted/50">
                  <FileText className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
                    <Check className="h-4 w-4 text-green-500" />
                  </AlertDescription>
                </Alert>
              )}
              
              {importMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uploading...</span>
                    <span className="text-sm">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              <Alert variant="destructive" className={importMutation.isError ? "block" : "hidden"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {importMutation.error instanceof Error ? importMutation.error.message : 'An error occurred'}
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="template" className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Download our CSV template to ensure your data is in the correct format for importing.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2">
              <div className="rounded-md border p-4">
                <div className="space-y-1">
                  <h4 className="font-medium">Required Fields</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>Full Name</li>
                    <li>District</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-1">
                  <h4 className="font-medium">Recommended Fields</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>Participant Code (D00XXXXXX format)</li>
                    <li>Phone Number</li>
                    <li>Gender</li>
                    <li>Age / Year of Birth</li>
                    <li>Town</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="truncate" className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: This will permanently delete ALL youth profiles and associated user accounts.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
            
            {truncateMutation.isPending ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Clearing data...</span>
              </div>
            ) : (
              <div className="rounded-md border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Use this option before importing a new complete set of youth profiles to avoid duplicates.
                  Only proceed if you have a backup or are sure you want to start fresh.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          
          {activeTab === 'upload' && (
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || importMutation.isPending}
              className="gap-2"
            >
              {importMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importMutation.isPending ? 'Importing...' : 'Import Data'}
            </Button>
          )}
          
          {activeTab === 'template' && (
            <Button onClick={handleDownloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          )}
          
          {activeTab === 'truncate' && (
            <Button 
              variant="destructive" 
              onClick={() => truncateMutation.mutate()}
              disabled={truncateMutation.isPending}
              className="gap-2"
            >
              {truncateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {truncateMutation.isPending ? 'Clearing...' : 'Clear All Data'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}