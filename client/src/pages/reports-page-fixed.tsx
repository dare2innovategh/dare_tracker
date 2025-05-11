import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Report, ReportRun } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, Check, Download, FileText, Filter, Loader2, PlusCircle, RefreshCw, 
  AreaChart, User, Building2, GraduationCap, Settings, Users,
  Wrench // Import Wrench instead of Tool
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/dashboard-layout';
import Header from '@/components/layout/header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/hooks/use-auth';

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

// Helper functions for report data
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

const getReportTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'youth_basic': 'Youth Basic',
    'youth_detailed': 'Youth Detailed', 
    'business_basic': 'Business Basic',
    'business_detailed': 'Business Detailed',
    'makerspace_basic': 'Makerspace Basic',
    'makerspace_detailed': 'Makerspace Detailed',
    'mentor_basic': 'Mentor Basic',
    'mentor_detailed': 'Mentor Detailed',
    'training_basic': 'Training Basic',
    'training_detailed': 'Training Detailed',
    'mentor_business_relationship': 'Mentor-Business Relationship',
    'business_youth_relationship': 'Business-Youth Relationship',
    'makerspace_business_assignment': 'Makerspace-Business Assignment',
    'youth_demographics': 'Youth Demographics',
    'business_performance': 'Business Performance',
    'mentor_effectiveness': 'Mentor Effectiveness',
    'training_completion': 'Training Completion',
    'makerspace_utilization': 'Makerspace Utilization',
    'system_activity': 'System Activity',
    'user_activity': 'User Activity'
  };
  return labels[type] || type;
};

const getReportStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
    case 'running':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Running</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
    case 'failed':
      return <Badge variant="outline" className="bg-red-50 text-red-700">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Component to create a new report
function CreateReportForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reportType: '',
    isTemplate: false,
    columns: [] as string[],
    filters: {}
  });

  const { data: reportTypes } = useQuery({
    queryKey: ['/api/reports/types/available'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/reports/types/available');
      return await res.json();
    }
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/reports', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Report created',
        description: 'Your report has been created successfully.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create report',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReportMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Report Title</Label>
        <Input 
          id="title" 
          value={formData.title} 
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          value={formData.description} 
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportType">Report Type</Label>
        <Select 
          value={formData.reportType} 
          onValueChange={(value) => setFormData({...formData, reportType: value})}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            {reportTypes?.map((type: string) => (
              <SelectItem key={type} value={type}>
                {getReportTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="submit" className="w-full" disabled={createReportMutation.isPending}>
          {createReportMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>Create Report</>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Component to run a report
function RunReportForm({ report, onSuccess }: { report: Report, onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    reportId: report.id,
    format: 'excel',
    parameters: {}
  });

  const { data: reportFormats } = useQuery({
    queryKey: ['/api/reports/formats/available'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/reports/formats/available');
      return await res.json();
    }
  });

  const runReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/reports/run', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Report generation started',
        description: 'Your report is being generated. You can view its status in the Report Runs tab.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${report.id}/runs`] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to run report',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runReportMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-md font-medium">{report.title}</h3>
        <p className="text-sm text-muted-foreground">{report.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="format">Output Format</Label>
        <Select 
          value={formData.format} 
          onValueChange={(value) => setFormData({...formData, format: value})}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {reportFormats?.map((format: string) => (
              <SelectItem key={format} value={format}>
                {format.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* We could add more parameter fields based on the report type */}
      
      <DialogFooter>
        <Button type="submit" className="w-full" disabled={runReportMutation.isPending}>
          {runReportMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>Run Report</>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Component to display report runs
function ReportRunsList({ reportId }: { reportId: number }) {
  const { toast } = useToast();
  
  const { data: reportRuns, isLoading, error } = useQuery({
    queryKey: [`/api/reports/${reportId}/runs`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/reports/${reportId}/runs`);
      return await res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds to get updates on running reports
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load report runs: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!reportRuns?.length) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No report runs yet. Click the "Run Report" button to generate a report.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Report Runs</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}/runs`] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Results</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportRuns.map((run: ReportRun) => (
              <TableRow key={run.id}>
                <TableCell>{formatDate(run.startedAt)}</TableCell>
                <TableCell>{getReportStatusBadge(run.status)}</TableCell>
                <TableCell className="uppercase">{run.format || 'N/A'}</TableCell>
                <TableCell>
                  {run.resultUrl && run.status === 'completed' ? (
                    <a 
                      href={run.resultUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not available</span>
                  )}
                </TableCell>
                <TableCell>
                  {run.status === 'completed' && run.resultUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={run.resultUrl} download>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Component to display details about a report
function ReportCard({ report }: { report: Report }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const deleteReportMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/reports/${report.id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Report deleted',
        description: 'The report has been deleted successfully.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete report',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      deleteReportMutation.mutate();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{report.title}</CardTitle>
        <CardDescription>{report.description || 'No description'}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <div>{getReportTypeLabel(report.reportType)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <div>{formatDate(report.createdAt)}</div>
          </div>
        </div>
        {report.lastRunAt && (
          <div className="text-sm mb-2">
            <span className="text-muted-foreground">Last Run:</span>
            <div>{formatDate(report.lastRunAt)}</div>
          </div>
        )}
        {report.isTemplate && (
          <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700">Template</Badge>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              Run Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Run Report</DialogTitle>
              <DialogDescription>
                Select options for running {report.title}.
              </DialogDescription>
            </DialogHeader>
            <RunReportForm report={report} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
        
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost">
              <FileText className="h-4 w-4 mr-2" />
              View Runs
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Report Runs</SheetTitle>
              <SheetDescription>
                View all runs of {report.title}.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <ReportRunsList reportId={report.id} />
            </div>
          </SheetContent>
        </Sheet>
        
        {user?.role === 'admin' && (
          <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-700">
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Main Reports Page component
export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/reports');
      return await res.json();
    }
  });

  // Filter reports based on the active tab
  const filteredReports = reports?.filter((report: Report) => {
    if (activeTab === 'all') return !report.isTemplate;
    if (activeTab === 'templates') return report.isTemplate;
    if (activeTab === 'youth') return !report.isTemplate && report.reportType.includes('youth');
    if (activeTab === 'business') return !report.isTemplate && report.reportType.includes('business');
    if (activeTab === 'makerspace') return !report.isTemplate && report.reportType.includes('makerspace');
    if (activeTab === 'mentor') return !report.isTemplate && report.reportType.includes('mentor');
    if (activeTab === 'training') return !report.isTemplate && report.reportType.includes('training');
    if (activeTab === 'system') return !report.isTemplate && (report.reportType.includes('system') || report.reportType.includes('user'));
    return false;
  });

  return (
    <DashboardLayout>
      <div className="container p-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Header 
            title="Reports" 
            description="Create, manage, and run reports" 
            icon={<AreaChart className="h-6 w-6" />}
          />
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Reports Dashboard</h2>
            <div className="flex gap-2">
              {user?.role === 'admin' && !reports?.find((r: Report) => r.isTemplate) ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Create Templates
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Report Templates</DialogTitle>
                      <DialogDescription>
                        This will create default report templates for all modules.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Button
                        onClick={async () => {
                          try {
                            await apiRequest('POST', '/api/reports/create-templates');
                            toast({
                              title: 'Templates created',
                              description: 'Default report templates have been created.',
                              variant: 'default',
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
                          } catch (error) {
                            toast({
                              title: 'Failed to create templates',
                              description: error instanceof Error ? error.message : 'Unknown error',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        Create Default Templates
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : null}
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Report</DialogTitle>
                    <DialogDescription>
                      Create a customized report to analyze your data.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateReportForm onSuccess={() => setIsDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-4">
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="categories" className="p-4 bg-slate-50 rounded-md mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div variants={cardVariant}>
                  <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('youth')}>
                    <CardContent className="p-4 text-center flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                        <User className="h-6 w-6 text-green-700" />
                      </div>
                      <CardTitle className="text-sm">Youth</CardTitle>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={cardVariant}>
                  <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('business')}>
                    <CardContent className="p-4 text-center flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                        <Building2 className="h-6 w-6 text-blue-700" />
                      </div>
                      <CardTitle className="text-sm">Business</CardTitle>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={cardVariant}>
                  <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('makerspace')}>
                    <CardContent className="p-4 text-center flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                        <Wrench className="h-6 w-6 text-purple-700" />
                      </div>
                      <CardTitle className="text-sm">Makerspace</CardTitle>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={cardVariant}>
                  <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('mentor')}>
                    <CardContent className="p-4 text-center flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                        <Users className="h-6 w-6 text-yellow-700" />
                      </div>
                      <CardTitle className="text-sm">Mentor</CardTitle>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={cardVariant}>
                  <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('training')}>
                    <CardContent className="p-4 text-center flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                        <GraduationCap className="h-6 w-6 text-red-700" />
                      </div>
                      <CardTitle className="text-sm">Training</CardTitle>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={cardVariant}>
                  <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('system')}>
                    <CardContent className="p-4 text-center flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                        <Settings className="h-6 w-6 text-gray-700" />
                      </div>
                      <CardTitle className="text-sm">System</CardTitle>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>
            
            <TabsContent value={activeTab} className="p-0">
              {filteredReports?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No reports found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {activeTab === 'templates' 
                      ? "No report templates exist yet. Create them with the 'Create Templates' button." 
                      : "No reports in this category. Click 'New Report' to create one."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReports?.map((report: Report) => (
                    <motion.div key={report.id} variants={cardVariant}>
                      <ReportCard report={report} />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}