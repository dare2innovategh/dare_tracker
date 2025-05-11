import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UploadCloud } from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useMutation } from '@tanstack/react-query';

export default function YouthProfileImportPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/youth-profiles-tsv-import', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import youth profiles');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setImportStatus({
        imported: data.imported,
        skipped: data.skipped,
      });
      toast({
        title: 'Import Completed',
        description: `Successfully imported ${data.imported} profiles, skipped ${data.skipped} profiles.`,
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // File change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a TSV file to import',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clearExisting', clearExisting.toString());
    
    uploadMutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Youth Profile TSV Import</h1>
          <p className="text-muted-foreground">
            Import youth profiles from a tab-separated values (TSV) file
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Select TSV File</Label>
                <div className="mt-2">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center">
                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop a TSV file here, or click to select a file
                    </p>
                    <Input
                      id="file"
                      type="file"
                      accept=".tsv,.txt"
                      onChange={handleFileChange}
                      className="max-w-sm"
                    />
                    {file && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clearExisting"
                  checked={clearExisting}
                  onCheckedChange={(checked) => setClearExisting(checked === true)}
                />
                <Label
                  htmlFor="clearExisting"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Clear existing youth profiles before import
                </Label>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={!file || uploadMutation.isPending}
                  className="bg-gradient-to-r from-[#EB001B] to-[#FF5F00] hover:from-[#C0001B] hover:to-[#FF4500]"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Profiles'
                  )}
                </Button>
              </div>
            </div>
          </form>

          {importStatus && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="text-lg font-medium">Import Results</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-md border">
                  <p className="text-sm text-muted-foreground">Profiles Imported</p>
                  <p className="text-2xl font-bold text-[#00A651]">{importStatus.imported}</p>
                </div>
                <div className="bg-background p-4 rounded-md border">
                  <p className="text-sm text-muted-foreground">Profiles Skipped</p>
                  <p className="text-2xl font-bold text-[#FF5F00]">{importStatus.skipped}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                The import process is complete. Check the youth profiles page to view the imported data.
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-[#F7F7F7] rounded-lg border border-[#E5E5E5]">
            <h3 className="text-lg font-semibold text-[#333333]">TSV File Format</h3>
            <p className="mt-2 text-sm text-[#666666]">
              The TSV file should include headers in the first row. Required fields include:
            </p>
            <ul className="mt-2 list-disc list-inside text-sm text-[#666666]">
              <li>Full Name</li>
              <li>District</li>
              <li>Participant Code (optional but recommended for unique identification)</li>
              <li>Phone Number (optional)</li>
              <li>Gender (optional)</li>
              <li>Other profile fields (optional)</li>
            </ul>
            <p className="mt-2 text-sm text-[#666666]">
              Note: All youth profiles will be imported with Training Status set to "Completed" and Program Status set to "Outreach" as requested.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}