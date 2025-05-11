import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Trash2, GraduationCap, Calendar, Plus } from "lucide-react";
import { format, isValid, parse } from "date-fns";

export interface EducationRecord {
  id: number;
  schoolName: string;
  degreeObtained: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isOngoing: boolean;
  description: string;
  certificateUrl: string;
}

interface EducationFormProps {
  educationRecords: EducationRecord[];
  onChange: (records: EducationRecord[]) => void;
}

const DEGREE_OPTIONS = [
  "None",
  "BECE",
  "WASSCE/SSCE",
  "Certificate",
  "Diploma",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Other"
];

export function EducationForm({ educationRecords, onChange }: EducationFormProps) {
  const [expandedId, setExpandedId] = useState<number | null>(
    educationRecords.length === 0 ? 0 : null
  );

  // Create a new empty education record
  const addEducationRecord = () => {
    const newRecord: EducationRecord = {
      id: Date.now(), // Temporary ID for frontend use
      schoolName: "",
      degreeObtained: "None",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      isOngoing: false,
      description: "",
      certificateUrl: ""
    };
    
    const newRecords = [...educationRecords, newRecord];
    onChange(newRecords);
    setExpandedId(newRecord.id || null);
  };

  // Remove an education record
  const removeEducationRecord = (id: number) => {
    const newRecords = educationRecords.filter(record => record.id !== id);
    onChange(newRecords);
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  // Update a specific education record
  const updateEducationRecord = (id: number, updates: Partial<EducationRecord>) => {
    const newRecords = educationRecords.map(record => {
      if (record.id === id) {
        // If isOngoing is true, clear endDate
        if (updates.isOngoing === true) {
          return { ...record, ...updates, endDate: "" };
        }
        return { ...record, ...updates };
      }
      return record;
    });
    onChange(newRecords);
  };

  // Toggle expanded state for an education record
  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Format the date range for display
  const formatDateRange = (startDate: string, endDate: string, isOngoing: boolean) => {
    if (!startDate) return "No dates specified";
    
    const formattedStart = startDate;
    
    if (isOngoing) {
      return `${formattedStart} - Present`;
    }
    
    if (endDate) {
      return `${formattedStart} - ${endDate}`;
    }
    
    return formattedStart;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-medium">Education ({educationRecords.length})</h4>
          <p className="text-xs text-muted-foreground">
            Add education history and qualifications
          </p>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="h-8 flex items-center"
          onClick={addEducationRecord}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Education
        </Button>
      </div>

      {educationRecords.length === 0 ? (
        <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-md">
          No education records added. Click "Add Education" to include educational background.
        </div>
      ) : (
        <div className="space-y-3">
          {educationRecords.map((record) => (
            <div 
              key={record.id} 
              className={cn(
                "border rounded-md overflow-hidden",
                expandedId === record.id ? "border-primary/50" : "border-border"
              )}
            >
              <div 
                className={cn(
                  "p-3 flex justify-between items-center cursor-pointer",
                  expandedId === record.id ? "bg-primary/5" : "bg-background"
                )}
                onClick={() => toggleExpanded(record.id as number)}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary opacity-70" />
                  <div>
                    <div className="font-medium">
                      {record.schoolName || "Unnamed institution"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {record.degreeObtained !== "None" ? record.degreeObtained : "No degree"} 
                      {record.fieldOfStudy && `• ${record.fieldOfStudy}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-xs text-muted-foreground flex items-center mr-2">
                    <Calendar className="h-3 w-3 mr-1 opacity-70" />
                    {formatDateRange(record.startDate, record.endDate, record.isOngoing)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEducationRecord(record.id as number);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </div>
              </div>

              {expandedId === record.id && (
                <div className="p-3 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        School/Institution Name *
                      </label>
                      <Input
                        value={record.schoolName}
                        onChange={(e) => 
                          updateEducationRecord(record.id as number, { 
                            schoolName: e.target.value 
                          })
                        }
                        placeholder="School or institution name"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Degree/Certificate
                      </label>
                      <Select
                        value={record.degreeObtained}
                        onValueChange={(value) => 
                          updateEducationRecord(record.id as number, { 
                            degreeObtained: value 
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select degree type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEGREE_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-medium mb-1 block">
                      Field of Study
                    </label>
                    <Input
                      value={record.fieldOfStudy}
                      onChange={(e) => 
                        updateEducationRecord(record.id as number, { 
                          fieldOfStudy: e.target.value 
                        })
                      }
                      placeholder="Field of study or specialization"
                      className="h-8"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={record.startDate}
                        onChange={(e) => 
                          updateEducationRecord(record.id as number, { 
                            startDate: e.target.value 
                          })
                        }
                        className="h-8"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium mb-1 block">
                          End Date
                        </label>
                        <div className="flex items-center">
                          <Checkbox
                            id={`ongoing-${record.id}`}
                            checked={record.isOngoing}
                            onCheckedChange={(checked) => 
                              updateEducationRecord(record.id as number, { 
                                isOngoing: checked as boolean 
                              })
                            }
                            className="h-3.5 w-3.5 mr-1.5"
                          />
                          <label 
                            htmlFor={`ongoing-${record.id}`}
                            className="text-xs cursor-pointer"
                          >
                            Currently attending
                          </label>
                        </div>
                      </div>
                      <Input
                        type="date"
                        value={record.endDate}
                        onChange={(e) => 
                          updateEducationRecord(record.id as number, { 
                            endDate: e.target.value 
                          })
                        }
                        disabled={record.isOngoing}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-medium mb-1 block">
                      Description
                    </label>
                    <Textarea
                      value={record.description}
                      onChange={(e) => 
                        updateEducationRecord(record.id as number, { 
                          description: e.target.value 
                        })
                      }
                      placeholder="Additional details about your education"
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-medium mb-1 block">
                      Certificate URL
                    </label>
                    <Input
                      value={record.certificateUrl}
                      onChange={(e) => 
                        updateEducationRecord(record.id as number, { 
                          certificateUrl: e.target.value 
                        })
                      }
                      placeholder="Link to certificate (if available)"
                      className="h-8"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}