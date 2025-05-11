import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Wrench, 
  Package, 
  Megaphone, 
  Truck, 
  BarChart2, 
  FileText,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Mastercard color theme with slight adjustments for better contrast
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
  success: "#2E7D32", // Dark Green
  warning: "#FFC107", // Amber
  light: "#F8F9FA", // Light Gray
  border: "#E0E0E0" // Light Gray Border
};

// TabProgressIndicator Component
const TabProgressIndicator = ({ tabs, activeTab, setActiveTab }) => {
  const getStatusColor = (tabKey) => {
    const tabIndex = tabs.findIndex(tab => tab.key === tabKey);
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    
    if (tabIndex === activeIndex) return "bg-blue-500"; // Current tab
    if (tabIndex < activeIndex) return "bg-green-500"; // Completed tab
    return "bg-gray-300"; // Upcoming tab
  };
  
  return (
    <div className="flex items-center justify-between mb-4 px-2">
      {tabs.map((tab, index) => (
        <div key={tab.key} className="flex flex-1 items-center">
          <button 
            className={`h-8 w-8 rounded-full flex items-center justify-center text-white transition-colors ${getStatusColor(tab.key)}`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {index + 1}
          </button>
          
          {index < tabs.length - 1 && (
            <div className="flex-1 h-1 mx-1">
              <div 
                className={`h-full ${
                  tabs.findIndex(t => t.key === activeTab) > index
                    ? "bg-green-500" 
                    : "bg-gray-300"
                }`}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// PercentageSelect Component
const PercentageSelect = ({ value, onChange, disabled }) => {
  const options = Array.from({ length: 11 }, (_, i) => i * 10); // [0, 10, 20, ... 100]
  
  const getColorForPercentage = (percent) => {
    if (percent <= 25) return THEME.secondary;
    if (percent <= 50) return THEME.warning;
    if (percent <= 75) return THEME.accent;
    return THEME.success;
  };
  
  return (
    <Select 
      value={value ? value.toString() : ""} 
      onValueChange={onChange} 
      disabled={disabled}
    >
      <SelectTrigger className="w-full border border-gray-300 rounded-md hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
        <SelectValue placeholder="Select percentage (0-100%)" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {options.map((percent) => (
          <SelectItem key={`percent-${percent}`} value={percent.toString()} className="flex items-center py-2">
            <span className="h-4 w-4 rounded-full mr-2" style={{ 
              backgroundColor: getColorForPercentage(percent)
            }}></span>
            {percent}%
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Custom form field component to reduce repetition
const FormField = ({ label, children, hint }) => (
  <div className="space-y-1 mb-4">
    <Label className="text-sm font-medium text-gray-700">
      {label}
    </Label>
    {children}
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
);

// Custom numeric input that simulates NumericFormat behavior
const CurrencyInput = ({ value, onChange, placeholder, name, disabled = false }) => {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">GHS</span>
      <Input 
        type="text" 
        name={name}
        className="pl-12 border-gray-300 rounded-md hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        value={value || ""}
        onChange={(e) => onChange?.(e)}
        placeholder={placeholder || "0.00"}
        disabled={disabled}
      />
    </div>
  );
};

// Section header component
const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center space-x-2 py-2 px-4 bg-gray-50 rounded-t-lg border-b border-gray-200">
    {icon}
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
  </div>
);

// FeasibilityAssessmentDialog Component
const FeasibilityAssessmentDialog = ({ 
  open, 
  onOpenChange,
  businessId,
  businessName,
  district,
  onSave = () => {}
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("business-location");
  const [formData, setFormData] = useState({
    businessId: businessId || null,
    status: "Draft",
    
    // Location & Structure
    plannedBusinessLocation: "",
    isGroundRentRequired: false,
    hasStructureOrStall: false,
    structureNeeds: "",
    estimatedSpaceCost: "",
    spaceCostContribution: "",
    
    // Equipment
    equipmentNeeded: "",
    equipmentCurrentlyOwned: "",
    equipmentMissing: "",
    equipmentTotalCost: "",
    equipmentCostContribution: "",
    
    // Supplies
    startupSuppliesNeeded: "",
    suppliesCurrentlyOwned: "",
    suppliesMissing: "",
    suppliesTotalCost: "",
    suppliesCostContribution: "",
    
    // Marketing
    marketingToolsNeeded: "",
    marketingToolsCurrentlyOwned: "",
    marketingToolsMissing: "",
    marketingTotalCost: "",
    marketingCostContribution: "",
    
    // Delivery
    needsDelivery: false,
    deliveryMethod: "",
    deliveryResourcesAvailable: "",
    deliverySetupCost: "",
    deliveryCostContribution: "",
    
    // Livelihood Expenses
    monthlyNonBusinessExpenses: "",
    fixedFinancialObligations: "",
    
    // Revenue & Financial Projections
    expectedPrice: "",
    expectedSalesDaily: "",
    expectedSalesWeekly: "",
    expectedSalesMonthly: "",
    expectedMonthlyRevenue: "",
    expectedMonthlyExpenditure: "",
    expectedMonthlySavings: "",
    expectedPayToSelf: "",
    isPlanFeasible: false,
    planAdjustments: "",
    
    // Seed Capital
    seedCapitalNeeded: "",
    seedCapitalUsage: "",
    
    // Assessment Status
    overallFeasibilityPercentage: ""
  });
  
  // Calculate completion percentages for different sections
  const calculateSectionCompletion = () => {
    const locationFields = [
      'plannedBusinessLocation', 'isGroundRentRequired', 'hasStructureOrStall', 
      'estimatedSpaceCost', 'spaceCostContribution'
    ];
    const equipmentFields = [
      'equipmentNeeded', 'equipmentTotalCost', 'equipmentCostContribution'
    ];
    const suppliesFields = [
      'startupSuppliesNeeded', 'suppliesTotalCost', 'suppliesCostContribution'
    ];
    const marketingFields = [
      'marketingToolsNeeded', 'marketingTotalCost', 'marketingCostContribution'
    ];
    const deliveryFields = [
      'needsDelivery', 'deliveryMethod', 'deliverySetupCost', 'deliveryCostContribution'
    ];
    const financesFields = [
      'monthlyNonBusinessExpenses', 'expectedPrice', 'expectedSalesDaily', 
      'expectedSalesWeekly', 'expectedSalesMonthly', 'expectedMonthlyRevenue', 
      'expectedMonthlyExpenditure', 'expectedMonthlySavings', 'seedCapitalNeeded'
    ];
    
    const calculatePercentage = (fields) => {
      const filledFields = fields.filter(field => 
        formData[field] !== "" && formData[field] !== null && formData[field] !== undefined
      );
      return Math.round((filledFields.length / fields.length) * 100);
    };
    
    return {
      location: calculatePercentage(locationFields),
      equipment: calculatePercentage(equipmentFields),
      supplies: calculatePercentage(suppliesFields),
      marketing: calculatePercentage(marketingFields),
      delivery: calculatePercentage(deliveryFields),
      finances: calculatePercentage(financesFields),
      overall: calculatePercentage([
        ...locationFields, ...equipmentFields, ...suppliesFields,
        ...marketingFields, ...deliveryFields, ...financesFields
      ])
    };
  };
  
  const completion = calculateSectionCompletion();

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission with enhanced Zod validation handling
const handleSubmit = async () => {
  setIsLoading(true);
  
  try {
    // Define helper functions to process data
    const processArrayField = (field) => {
      if (!field || typeof field !== 'string') return [];
      if (Array.isArray(field)) return field;
      return field.split('\n').filter(item => item.trim() !== '');
    };
    
    // Convert nulls to empty strings for string fields
    const stringifyNulls = (value) => {
      return value === null || value === undefined ? "" : value;
    };
    
    // Improved numeric field processing - NEVER return null, return "0" string instead
    // This is crucial for passing Zod validation
    const processNumericField = (value) => {
      if (value === "" || value === null || value === undefined) return "0";
      const num = parseFloat(value);
      return isNaN(num) ? "0" : num.toString();
    };
    
    const formDataToSubmit = {
      businessId: businessId,
      status: "Draft",  // Use a default status
      
      // Location & Structure - use empty strings instead of null for text fields
      plannedBusinessLocation: stringifyNulls(formData.plannedBusinessLocation),
      isGroundRentRequired: formData.isGroundRentRequired === true,
      hasStructureOrStall: formData.hasStructureOrStall === true,
      structureNeeds: stringifyNulls(formData.structureNeeds),
      estimatedSpaceCost: processNumericField(formData.estimatedSpaceCost),
      spaceCostContribution: processNumericField(formData.spaceCostContribution),
      
      // Equipment - ensure arrays are never null
      equipmentNeeded: processArrayField(formData.equipmentNeeded),
      equipmentCurrentlyOwned: processArrayField(formData.equipmentCurrentlyOwned),
      equipmentMissing: processArrayField(formData.equipmentMissing),
      equipmentTotalCost: processNumericField(formData.equipmentTotalCost),
      equipmentCostContribution: processNumericField(formData.equipmentCostContribution),
      
      // Supplies - ensure arrays are never null
      startupSuppliesNeeded: processArrayField(formData.startupSuppliesNeeded),
      suppliesCurrentlyOwned: processArrayField(formData.suppliesCurrentlyOwned),
      suppliesMissing: processArrayField(formData.suppliesMissing),
      suppliesTotalCost: processNumericField(formData.suppliesTotalCost),
      suppliesCostContribution: processNumericField(formData.suppliesCostContribution),
      
      // Marketing - ensure arrays are never null
      marketingToolsNeeded: processArrayField(formData.marketingToolsNeeded),
      marketingToolsCurrentlyOwned: processArrayField(formData.marketingToolsCurrentlyOwned),
      marketingToolsMissing: processArrayField(formData.marketingToolsMissing),
      marketingTotalCost: processNumericField(formData.marketingTotalCost),
      marketingCostContribution: processNumericField(formData.marketingCostContribution),
      
      // Delivery - never use null
      needsDelivery: formData.needsDelivery === true,
      deliveryMethod: stringifyNulls(formData.deliveryMethod),
      deliveryResourcesAvailable: stringifyNulls(formData.deliveryResourcesAvailable),
      deliverySetupCost: processNumericField(formData.deliverySetupCost),
      deliveryCostContribution: processNumericField(formData.deliveryCostContribution),
      
      // Finances - never use null for numeric fields
      monthlyNonBusinessExpenses: processNumericField(formData.monthlyNonBusinessExpenses),
      fixedFinancialObligations: stringifyNulls(formData.fixedFinancialObligations),
      expectedPrice: processNumericField(formData.expectedPrice),
      expectedSalesDaily: processNumericField(formData.expectedSalesDaily),
      expectedSalesWeekly: processNumericField(formData.expectedSalesWeekly),
      expectedSalesMonthly: processNumericField(formData.expectedSalesMonthly),
      expectedMonthlyRevenue: processNumericField(formData.expectedMonthlyRevenue),
      expectedMonthlyExpenditure: processNumericField(formData.expectedMonthlyExpenditure),
      expectedMonthlySavings: processNumericField(formData.expectedMonthlySavings),
      expectedPayToSelf: processNumericField(formData.expectedPayToSelf),
      isPlanFeasible: formData.isPlanFeasible === true,
      planAdjustments: stringifyNulls(formData.planAdjustments),
      seedCapitalNeeded: processNumericField(formData.seedCapitalNeeded),
      seedCapitalUsage: stringifyNulls(formData.seedCapitalUsage),
      overallFeasibilityPercentage: processNumericField(formData.overallFeasibilityPercentage),
      
      // Additional fields - never null
      reviewComments: stringifyNulls(formData.reviewComments),
      recommendations: stringifyNulls(formData.recommendations),
      riskFactors: stringifyNulls(formData.riskFactors),
      growthOpportunities: stringifyNulls(formData.growthOpportunities),
      recommendedActions: stringifyNulls(formData.recommendedActions),
    };
    
    console.log("Saving new assessment data:", {
      businessId: formDataToSubmit.businessId,
    });
    
    const url = '/api/feasibility/assessments';
    const method = 'POST';
    
    console.log(`Making ${method} request to ${url}`);
    
    // Make the API request
    const response = await apiRequest(
      method,
      url,
      formDataToSubmit,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("API response status:", response.status);
    
    // Check if response is ok
    if (!response.ok) {
      let errorMessage = 'Failed to save assessment';
      try {
        // Get the response text first to see what we're dealing with
        const text = await response.text();
        
        // Check if it's valid JSON
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
          
          // If there's a detailed error message from Zod validation, display it and log it
          if (errorData.error && typeof errorData.error === 'string') {
            console.error("Validation error details:", errorData.error);
            errorMessage = 'Validation error in the form. Please check all fields and try again.';
          }
        } catch (jsonError) {
          // Not JSON - might be HTML error page
          console.error("Response was not JSON:", text.substring(0, 100) + "...");
          
          // If it's an HTML page, provide a clearer error
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            errorMessage = `Server returned HTML instead of JSON. Status: ${response.status}`;
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
      } catch (e) {
        // If we can't even read the response text
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Parse the response safely
    let responseData;
    try {
      const text = await response.text();
      responseData = text ? JSON.parse(text) : {};
      console.log("API response data:", responseData);
    } catch (e) {
      console.error("Error parsing response:", e);
      responseData = {}; // Empty response object as fallback
    }
    
    // Update localStorage to indicate this business has an assessment
    try {
      if (businessId) {
        localStorage.setItem(`business_${businessId}_has_assessment`, 'true');
        if (responseData && responseData.id) {
          localStorage.setItem(`business_${businessId}_assessment_id`, responseData.id.toString());
        }
      }
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
    
    toast({
      title: "Assessment Created",
      description: "A new feasibility assessment has been created successfully.",
    });
    
    onSave(responseData);
    onOpenChange(false);
  } catch (error) {
    console.error("Error saving assessment:", error);
    
    toast({
      title: "Error",
      description: error.message || "Failed to save assessment",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
  
  // Define tabs for the assessment sections
  const tabs = [
    { key: "business-location", label: "Location", icon: <MapPin className="h-4 w-4 mr-1" /> },
    { key: "equipment", label: "Equipment", icon: <Wrench className="h-4 w-4 mr-1" /> },
    { key: "supplies", label: "Supplies", icon: <Package className="h-4 w-4 mr-1" /> },
    { key: "marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4 mr-1" /> },
    { key: "delivery", label: "Delivery", icon: <Truck className="h-4 w-4 mr-1" /> },
    { key: "finances", label: "Finances", icon: <BarChart2 className="h-4 w-4 mr-1" /> },
  ];
  
  // Navigate tabs
  const navigateTab = (direction) => {
    const currentIndex = tabs.findIndex(tab => tab.key === activeTab);
    if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].key);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].key);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white rounded-lg shadow-lg p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-semibold">Business Feasibility Assessment</DialogTitle>
              <DialogDescription className="text-blue-100 opacity-90">
                Evaluate the feasibility of this business plan and determine funding requirements
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-10rem)] p-4">
          <Card className="border border-gray-200 rounded-lg shadow-sm mb-4">
            <div className="bg-gray-50 rounded-t-lg border-b border-gray-200 p-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" /> 
                Business Details
              </h3>
            </div>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Business Name">
                <Input 
                  value={businessName || ""}
                  disabled={true}
                  className="bg-gray-50 border-gray-300"
                />
              </FormField>
              <FormField label="District">
                <Input 
                  value={district || ""}
                  disabled={true}
                  className="bg-gray-50 border-gray-300"
                />
              </FormField>
            </CardContent>
          </Card>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Completion</span>
              <span className="text-sm font-medium">{completion.overall}%</span>
            </div>
            <Progress value={completion.overall} className="h-2" 
              style={{ 
                backgroundColor: '#e9ecef',
                '--progress-background': completion.overall > 66 ? THEME.success : 
                                        completion.overall > 33 ? THEME.accent : 
                                        THEME.secondary
              }} 
            />
          </div>
          
          <TabProgressIndicator 
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList 
              className="grid w-full grid-cols-3 md:grid-cols-6 mb-4 bg-gray-100 p-1 rounded-lg sticky top-0 z-10"
              style={{ 
                backgroundColor: "#f3f4f6",
                border: "1px solid #e5e7eb"
              }}
            >
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.key}
                  value={tab.key} 
                  className="rounded-md data-[state=active]:shadow-md transition-all duration-300"
                  style={{ 
                    color: activeTab === tab.key ? "white" : THEME.dark,
                    background: activeTab === tab.key 
                      ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                      : "transparent"
                  }}
                >
                  {tab.icon}
                  <span className="hidden md:inline ml-1">{tab.label}</span>
                  {completion[tab.key.replace('business-', '')] > 0 && (
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-white bg-opacity-20">
                      {completion[tab.key.replace('business-', '')]}%
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="business-location" className="mt-0">
              <Card className="border border-gray-200 rounded-lg shadow-sm">
                <SectionHeader 
                  icon={<MapPin className="h-5 w-5 text-blue-600" />} 
                  title="Location & Structure" 
                />
                <CardContent className="p-4 space-y-4">
                  <FormField label="Planned Business Location">
                    <Input 
                      name="plannedBusinessLocation"
                      value={formData.plannedBusinessLocation || ""}
                      onChange={handleInputChange}
                      placeholder="e.g., Nampati Market Stall #15" 
                      className="border-gray-300" 
                    />
                  </FormField>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Will you need to pay ground rent?">
                      <Select
                        value={formData.isGroundRentRequired ? "true" : "false"}
                        onValueChange={(value) => handleSelectChange("isGroundRentRequired", value === "true")}
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="Select Yes/No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    
                    <FormField label="Do you have a structure or stall?">
                      <Select 
                        value={formData.hasStructureOrStall ? "true" : "false"}
                        onValueChange={(value) => handleSelectChange("hasStructureOrStall", value === "true")}
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="Select Yes/No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  
                  <FormField label="Structure Requirements" hint="What type of structure do you need?">
                    <Textarea 
                      name="structureNeeds"
                      value={formData.structureNeeds || ""}
                      onChange={handleInputChange}
                      placeholder="Describe the structure needed for your business" 
                      className="border-gray-300 min-h-[100px]" 
                    />
                  </FormField>
                  
                  <Separator className="my-2" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Estimated Cost of Space/Stall">
                      <CurrencyInput 
                        name="estimatedSpaceCost"
                        value={formData.estimatedSpaceCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="How much can you contribute?">
                      <CurrencyInput 
                        name="spaceCostContribution"
                        value={formData.spaceCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="equipment" className="mt-0">
              <Card className="border border-gray-200 rounded-lg shadow-sm">
                <SectionHeader 
                  icon={<Wrench className="h-5 w-5 text-blue-600" />} 
                  title="Equipment" 
                />
                <CardContent className="p-4">
                  <FormField label="Equipment Needed">
                    <Textarea 
                      name="equipmentNeeded"
                      value={formData.equipmentNeeded || ""}
                      onChange={handleInputChange}
                      placeholder="List all equipment needed for your business (one per line)"
                      className="min-h-[100px] border-gray-300"
                    />
                  </FormField>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="What Do You Currently Have?">
                      <Textarea 
                        name="equipmentCurrentlyOwned"
                        value={formData.equipmentCurrentlyOwned || ""}
                        onChange={handleInputChange}
                        placeholder="List equipment you already own (one per line)"
                        className="min-h-[100px] border-gray-300"
                      />
                    </FormField>
                    
                    <FormField label="What Don't You Have?">
                      <Textarea 
                        name="equipmentMissing"
                        value={formData.equipmentMissing || ""}
                        onChange={handleInputChange}
                        placeholder="List equipment you still need (one per line)"
                        className="min-h-[100px] border-gray-300"
                      />
                    </FormField>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Estimated Total Cost">
                      <CurrencyInput 
                        name="equipmentTotalCost"
                        value={formData.equipmentTotalCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="How much can you contribute?">
                      <CurrencyInput 
                        name="equipmentCostContribution"
                        value={formData.equipmentCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="supplies" className="mt-0">
              <Card className="border border-gray-200 rounded-lg shadow-sm">
                <SectionHeader 
                  icon={<Package className="h-5 w-5 text-blue-600" />} 
                  title="Supplies" 
                />
                <CardContent className="p-4">
                  <FormField label="Startup Supplies Needed">
                    <Textarea 
                      name="startupSuppliesNeeded"
                      value={formData.startupSuppliesNeeded || ""}
                      onChange={handleInputChange}
                      placeholder="List all supplies needed to start your business (one per line)"
                      className="min-h-[100px] border-gray-300"
                    />
                  </FormField>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="What Do You Currently Have?">
                      <Textarea 
                        name="suppliesCurrentlyOwned"
                        value={formData.suppliesCurrentlyOwned || ""}
                        onChange={handleInputChange}
                        placeholder="List supplies you already own (one per line)"
                        className="min-h-[100px] border-gray-300"
                      />
                    </FormField>
                    
                    <FormField label="What Don't You Have?">
                      <Textarea 
                        name="suppliesMissing"
                        value={formData.suppliesMissing || ""}
                        onChange={handleInputChange}
                        placeholder="List supplies you still need (one per line)"
                        className="min-h-[100px] border-gray-300"
                      />
                    </FormField>
                  </div>
                  
                <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Estimated Total Cost">
                      <CurrencyInput 
                        name="suppliesTotalCost"
                        value={formData.suppliesTotalCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="How much can you contribute?">
                      <CurrencyInput 
                        name="suppliesCostContribution"
                        value={formData.suppliesCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="marketing" className="mt-0">
              <Card className="border border-gray-200 rounded-lg shadow-sm">
                <SectionHeader 
                  icon={<Megaphone className="h-5 w-5 text-blue-600" />} 
                  title="Marketing" 
                />
                <CardContent className="p-4">
                  <FormField label="Marketing Tools Needed">
                    <Textarea 
                      name="marketingToolsNeeded"
                      value={formData.marketingToolsNeeded || ""}
                      onChange={handleInputChange}
                      placeholder="List all marketing tools needed (one per line)"
                      className="min-h-[100px] border-gray-300"
                    />
                  </FormField>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="What Do You Currently Have?">
                      <Textarea 
                        name="marketingToolsCurrentlyOwned"
                        value={formData.marketingToolsCurrentlyOwned || ""}
                        onChange={handleInputChange}
                        placeholder="List marketing tools you already have (one per line)"
                        className="min-h-[100px] border-gray-300"
                      />
                    </FormField>
                    
                    <FormField label="What Don't You Have?">
                      <Textarea 
                        name="marketingToolsMissing"
                        value={formData.marketingToolsMissing || ""}
                        onChange={handleInputChange}
                        placeholder="List marketing tools you still need (one per line)"
                        className="min-h-[100px] border-gray-300"
                      />
                    </FormField>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Estimated Total Cost">
                      <CurrencyInput 
                        name="marketingTotalCost"
                        value={formData.marketingTotalCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="How much can you contribute?">
                      <CurrencyInput 
                        name="marketingCostContribution"
                        value={formData.marketingCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="delivery" className="mt-0">
              <Card className="border border-gray-200 rounded-lg shadow-sm">
                <SectionHeader 
                  icon={<Truck className="h-5 w-5 text-blue-600" />} 
                  title="Delivery" 
                />
                <CardContent className="p-4">
                  <FormField label="Does your business need delivery capabilities?">
                    <Select
                      value={formData.needsDelivery ? "true" : "false"}
                      onValueChange={(value) => handleSelectChange("needsDelivery", value === "true")}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select Yes/No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField label="Delivery Method">
                      <Input 
                        name="deliveryMethod"
                        value={formData.deliveryMethod || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., Motorcycle, Bicycle, On foot" 
                        className="border-gray-300" 
                        disabled={!formData.needsDelivery}
                      />
                    </FormField>
                    
                    <FormField label="Delivery Resources Available">
                      <Input 
                        name="deliveryResourcesAvailable"
                        value={formData.deliveryResourcesAvailable || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., I own a bicycle" 
                        className="border-gray-300" 
                        disabled={!formData.needsDelivery}
                      />
                    </FormField>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Estimated Setup Cost">
                      <CurrencyInput 
                        name="deliverySetupCost"
                        value={formData.deliverySetupCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                        disabled={!formData.needsDelivery}
                      />
                    </FormField>
                    
                    <FormField label="How much can you contribute?">
                      <CurrencyInput 
                        name="deliveryCostContribution"
                        value={formData.deliveryCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                        disabled={!formData.needsDelivery}
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="finances" className="mt-0">
              <Card className="border border-gray-200 rounded-lg shadow-sm">
                <SectionHeader 
                  icon={<BarChart2 className="h-5 w-5 text-blue-600" />} 
                  title="Revenue & Financial Projections" 
                />
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Expected Product/Service Price">
                      <CurrencyInput 
                        name="expectedPrice"
                        value={formData.expectedPrice || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="Monthly Non-Business Expenses">
                      <CurrencyInput 
                        name="monthlyNonBusinessExpenses"
                        value={formData.monthlyNonBusinessExpenses || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Expected Daily Sales">
                      <CurrencyInput 
                        name="expectedSalesDaily"
                        value={formData.expectedSalesDaily || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="Expected Weekly Sales">
                      <CurrencyInput 
                        name="expectedSalesWeekly"
                        value={formData.expectedSalesWeekly || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="Expected Monthly Sales">
                      <CurrencyInput 
                        name="expectedSalesMonthly"
                        value={formData.expectedSalesMonthly || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Expected Monthly Revenue">
                      <CurrencyInput 
                        name="expectedMonthlyRevenue"
                        value={formData.expectedMonthlyRevenue || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="Expected Monthly Expenditure">
                      <CurrencyInput 
                        name="expectedMonthlyExpenditure"
                        value={formData.expectedMonthlyExpenditure || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="Expected Monthly Savings">
                      <CurrencyInput 
                        name="expectedMonthlySavings"
                        value={formData.expectedMonthlySavings || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="Expected Pay to Self">
                      <CurrencyInput 
                        name="expectedPayToSelf"
                        value={formData.expectedPayToSelf || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Seed Capital Needed">
                      <CurrencyInput 
                        name="seedCapitalNeeded"
                        value={formData.seedCapitalNeeded || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    
                    <FormField label="Seed Capital Usage">
                      <Input 
                        name="seedCapitalUsage"
                        value={formData.seedCapitalUsage || ""}
                        onChange={handleInputChange}
                        placeholder="How will you use the seed capital?" 
                        className="border-gray-300" 
                      />
                    </FormField>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Is Plan Feasible?">
                      <Select
                        value={formData.isPlanFeasible ? "true" : "false"}
                        onValueChange={(value) => handleSelectChange("isPlanFeasible", value === "true")}
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="Select Yes/No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    
                    <FormField label="Overall Feasibility Percentage">
                      <PercentageSelect
                        value={formData.overallFeasibilityPercentage}
                        onChange={(val) => handleSelectChange("overallFeasibilityPercentage", val)}
                      />
                    </FormField>
                  </div>
                  
                  <FormField label="Plan Adjustments">
                    <Textarea 
                      name="planAdjustments"
                      value={formData.planAdjustments || ""}
                      onChange={handleInputChange}
                      placeholder="Suggestions for improving the business plan" 
                      className="border-gray-300 min-h-[100px]" 
                    />
                  </FormField>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between my-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigateTab('prev')}
              disabled={activeTab === tabs[0].key}
              className="border-gray-300 flex items-center"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigateTab('next')}
              disabled={activeTab === tabs[tabs.length - 1].key}
              className="border-gray-300 flex items-center"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <DialogFooter className="p-4 border-t border-gray-200 sticky bottom-0 bg-white z-10">
          <div className="w-full flex flex-col-reverse sm:flex-row sm:justify-end sm:items-center gap-4">
            <div className="flex flex-wrap gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              
              <Button 
                type="button" 
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                disabled={isLoading}
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeasibilityAssessmentDialog;