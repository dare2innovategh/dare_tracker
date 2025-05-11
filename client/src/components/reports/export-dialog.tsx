import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckSquare, DownloadCloud, FileSpreadsheet, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type ExportOption = {
  id: string;
  label: string;
  description: string;
  dataFn?: () => any[];
  available: boolean;
};

type ExportDialogProps = {
  reportData: any;
  reportType: string;
  downloadCSV: (data: any[], filename: string) => void;
  isLoading: boolean;
};

export function ExportDialog({ reportData, reportType, downloadCSV, isLoading }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Define export options based on the current report type and available data
  const getExportOptions = (): ExportOption[] => {
    const baseOptions: ExportOption[] = [];
    
    if (reportType === 'summary' || reportType === 'all') {
      baseOptions.push(
        {
          id: 'youthRegistration',
          label: 'Youth Registration Data',
          description: 'Monthly youth registration statistics',
          available: !!reportData?.youthRegistrationData?.length,
        },
        {
          id: 'businessDistrict',
          label: 'Business by District',
          description: 'Distribution of businesses across districts',
          available: !!reportData?.businessByDistrict?.length,
        },
        {
          id: 'businessModel',
          label: 'Business Models Data',
          description: 'Distribution of business models',
          available: !!reportData?.businessModelData?.length,
        },
        {
          id: 'genderDistribution',
          label: 'Gender Distribution',
          description: 'Gender breakdown of participants',
          available: !!reportData?.genderDistributionData?.length,
        }
      );
    }
    
    if (reportType === 'participants' || reportType === 'all') {
      baseOptions.push(
        {
          id: 'ageGroups',
          label: 'Age Group Distribution',
          description: 'Distribution of participants by age group',
          available: !!reportData?.ageGroupData?.length,
        },
        {
          id: 'participantsByDistrict',
          label: 'Participants by District',
          description: 'Distribution of participants across districts',
          available: !!reportData?.participantsByDistrict?.length,
        },
        {
          id: 'trainingStatus',
          label: 'Training Status Data',
          description: 'Training completion status distribution',
          available: !!reportData?.trainingStatusData?.length,
        }
      );
    }
    
    if (reportType === 'businesses' || reportType === 'all') {
      baseOptions.push(
        {
          id: 'revenueTiers',
          label: 'Revenue Tier Distribution',
          description: 'Business distribution by revenue tier',
          available: !!reportData?.revenueTierData?.length,
        },
        {
          id: 'businessStage',
          label: 'Business Stage Distribution',
          description: 'Distribution of businesses by stage',
          available: !!reportData?.businessStageData?.length,
        }
      );
    }
    
    if (reportType === 'performance' || reportType === 'all') {
      baseOptions.push(
        {
          id: 'revenueGrowth',
          label: 'Revenue Growth Over Time',
          description: 'Monthly average revenue data',
          available: !!reportData?.revenueGrowthData?.length,
        }
      );
    }
    
    return baseOptions;
  };

  const exportOptions = getExportOptions();
  const availableOptions = exportOptions.filter(option => option.available);

  const handleSelectAll = () => {
    if (selectedOptions.length === availableOptions.length) {
      setSelectedOptions([]);
    } else {
      setSelectedOptions(availableOptions.map(option => option.id));
    }
  };

  const handleExport = () => {
    if (selectedOptions.length === 0) return;
    
    // Export each selected dataset
    selectedOptions.forEach(optionId => {
      const option = exportOptions.find(opt => opt.id === optionId);
      if (!option || !option.available) return;
      
      let data: any[] = [];
      let filename = optionId;
      
      // Get the data based on the option ID
      switch (optionId) {
        case 'youthRegistration':
          data = reportData.youthRegistrationData;
          filename = 'youth-registration-data';
          break;
        case 'businessDistrict':
          data = reportData.businessByDistrict;
          filename = 'businesses-by-district';
          break;
        case 'businessModel':
          data = reportData.businessModelData;
          filename = 'business-models-distribution';
          break;
        case 'genderDistribution':
          data = reportData.genderDistributionData;
          filename = 'gender-distribution';
          break;
        case 'ageGroups':
          data = reportData.ageGroupData;
          filename = 'age-group-distribution';
          break;
        case 'participantsByDistrict':
          data = reportData.participantsByDistrict;
          filename = 'participants-by-district';
          break;
        case 'trainingStatus':
          data = reportData.trainingStatusData;
          filename = 'training-status-distribution';
          break;
        case 'revenueTiers':
          data = reportData.revenueTierData;
          filename = 'revenue-tier-distribution';
          break;
        case 'businessStage':
          data = reportData.businessStageData;
          filename = 'business-stage-distribution';
          break;
        case 'revenueGrowth':
          data = reportData.revenueGrowthData;
          filename = 'revenue-growth-over-time';
          break;
      }
      
      if (data && data.length > 0) {
        downloadCSV(data, filename);
      }
    });
    
    setOpen(false);
  };

  const handleExportAll = () => {
    // Create a workbook with all available data
    const allAvailableOptions = availableOptions.map(option => option.id);
    setSelectedOptions(allAvailableOptions);
    handleExport();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading || !reportData || availableOptions.length === 0}>
          <DownloadCloud className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Report Data</DialogTitle>
          <DialogDescription>
            Select the data you want to export from the {reportType} report.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={handleSelectAll}
            >
              <CheckSquare className="h-4 w-4" />
              {selectedOptions.length === availableOptions.length ? 'Deselect All' : 'Select All'}
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={handleExportAll}
                disabled={availableOptions.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export All as CSV
              </Button>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {exportOptions.map((option) => (
              <div 
                key={option.id} 
                className={`flex items-start space-x-2 ${!option.available ? 'opacity-50' : ''}`}
              >
                <Checkbox 
                  id={option.id} 
                  checked={selectedOptions.includes(option.id)} 
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedOptions([...selectedOptions, option.id]);
                    } else {
                      setSelectedOptions(selectedOptions.filter(id => id !== option.id));
                    }
                  }} 
                  disabled={!option.available}
                />
                <div className="grid gap-1">
                  <Label 
                    htmlFor={option.id} 
                    className={`font-medium ${!option.available ? 'text-muted-foreground' : ''}`}
                  >
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                    {!option.available && ' (No data available)'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleExport} 
            disabled={selectedOptions.length === 0}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Export Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}