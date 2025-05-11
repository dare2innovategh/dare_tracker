import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import FeasibilityAssessmentDialog from "@/components/business/feasibility-assessment-dialog";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardCheck,
  ClipboardList,
  Trash2,
  Plus,
  Loader2,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Mastercard color theme
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
  success: "#2E7D32", // Dark Green
  warning: "#FFC107", // Amber
};

// Custom form field component to reduce repetition
const FormField = ({ label, children, required, hint }) => (
  <div className="space-y-1 mb-4">
    <Label className={`text-sm font-medium ${required ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""} text-gray-700`}>
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

// PercentageSelect Component
const PercentageSelect = ({ value, onChange, disabled }) => {
  // Create an array of percentage options [0, 10, 20, ... 100]
  const options = Array.from({ length: 11 }, (_, i) => i * 10);
  
  // Function to convert any value format to a normalized string
  const normalizeValue = (val) => {
    // Handle empty, null or undefined values
    if (val === "" || val === null || val === undefined) return "";
    
    // If it's already a string, clean it
    if (typeof val === 'string') {
      // Remove any non-numeric characters except for a decimal point
      const cleaned = val.replace(/[^\d.]/g, '');
      // If it's now empty, return empty string
      if (!cleaned) return "";
      // Try to parse as a number and round to nearest 10
      const num = parseFloat(cleaned);
      if (isNaN(num)) return "";
      // Round to nearest 10 and convert back to string
      return Math.round(num / 10) * 10 + "";
    }
    
    // If it's a number, round to nearest 10 and convert to string
    if (typeof val === 'number') {
      return Math.round(val / 10) * 10 + "";
    }
    
    // Default fallback
    return "";
  };
  
  // Normalize the current value
  const normalizedValue = normalizeValue(value);
  
  // Color function for the percentage indicator
  const getColorForPercentage = (percent) => {
    if (percent <= 25) return THEME.secondary;
    if (percent <= 50) return THEME.warning;
    if (percent <= 75) return THEME.accent;
    return THEME.success;
  };
  
  console.log("PercentageSelect - received value:", value, "normalized to:", normalizedValue);
  
  
  return (
    <Select 
      value={normalizedValue} 
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

// BusinessAssessmentsTab Component
const BusinessAssessmentsTab = ({ 
  business, 
  id, 
  isLoadingAssessments, 
  assessments = [], 
  refetchAssessments, 
  refetchBusiness 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for assessment management
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [hasFeasibilityAssessment, setHasFeasibilityAssessment] = useState(false);
  const [feasibilityAssessmentOpen, setFeasibilityAssessmentOpen] = useState(false);
  const [deleteAssessmentConfirmOpen, setDeleteAssessmentConfirmOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for editing the assessment directly in the tab
  const [formData, setFormData] = useState({
    plannedBusinessLocation: "",
    isGroundRentRequired: false,
    hasStructureOrStall: false,
    structureNeeds: "",
    estimatedSpaceCost: "",
    spaceCostContribution: "",
    equipmentNeeded: "",
    equipmentCurrentlyOwned: "",
    equipmentMissing: "",
    equipmentTotalCost: "",
    equipmentCostContribution: "",
    startupSuppliesNeeded: "",
    suppliesCurrentlyOwned: "",
    suppliesMissing: "",
    suppliesTotalCost: "",
    suppliesCostContribution: "",
    marketingToolsNeeded: "",
    marketingToolsCurrentlyOwned: "",
    marketingToolsMissing: "",
    marketingTotalCost: "",
    marketingCostContribution: "",
    needsDelivery: false,
    deliveryMethod: "",
    deliveryResourcesAvailable: "",
    deliverySetupCost: "",
    deliveryCostContribution: "",
    monthlyNonBusinessExpenses: "",
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
    seedCapitalNeeded: "",
    seedCapitalUsage: "",
    overallFeasibilityPercentage: "",
    reviewComments: "",
    recommendations: "",
    riskFactors: "",
    growthOpportunities: "",
    recommendedActions: "",
  });

  // Delete assessment mutation
 // Delete assessment mutation
const deleteAssessmentMutation = useMutation({
  mutationFn: async (assessmentId) => {
    console.log("Deleting assessment:", assessmentId);
    // FIXED: Changed from object format to correct parameter order
    const response = await apiRequest(
      "DELETE", 
      `/api/feasibility/assessments/${assessmentId}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete assessment");
    }
    return await response.json();
  },
  onSuccess: (data) => {
    console.log("Delete successful, response:", data);
    
    toast({
      title: "Assessment Deleted",
      description: "The feasibility assessment has been deleted successfully.",
    });
    
    // Reset state variables
    setHasFeasibilityAssessment(false);
    setCurrentAssessment(null);
    setFormData({
      plannedBusinessLocation: "",
      isGroundRentRequired: false,
      hasStructureOrStall: false,
      structureNeeds: "",
      estimatedSpaceCost: "",
      spaceCostContribution: "",
      equipmentNeeded: "",
      equipmentCurrentlyOwned: "",
      equipmentMissing: "",
      equipmentTotalCost: "",
      equipmentCostContribution: "",
      startupSuppliesNeeded: "",
      suppliesCurrentlyOwned: "",
      suppliesMissing: "",
      suppliesTotalCost: "",
      suppliesCostContribution: "",
      marketingToolsNeeded: "",
      marketingToolsCurrentlyOwned: "",
      marketingToolsMissing: "",
      marketingTotalCost: "",
      marketingCostContribution: "",
      needsDelivery: false,
      deliveryMethod: "",
      deliveryResourcesAvailable: "",
      deliverySetupCost: "",
      deliveryCostContribution: "",
      monthlyNonBusinessExpenses: "",
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
      seedCapitalNeeded: "",
      seedCapitalUsage: "",
      overallFeasibilityPercentage: "",
      reviewComments: "",
      recommendations: "",
      riskFactors: "",
      growthOpportunities: "",
      recommendedActions: "",
    });
    
    // Clear localStorage if needed
    try {
      localStorage.removeItem(`business_${id}_has_assessment`);
      localStorage.removeItem(`business_${id}_assessment_id`);
    } catch (e) {
      console.error("Error clearing localStorage:", e);
    }
    
    // Force data invalidation and refetch
    queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments`] });
    queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments`, id] });
    
    // Add a small delay before refetching to ensure the server has processed the delete
    setTimeout(() => {
      refetchAssessments();
      refetchBusiness();
    }, 300);
  },
  onError: (error) => {
    console.error("Delete error:", error);
    toast({
      title: "Delete Error",
      description: error.message || "Failed to delete assessment",
      variant: "destructive",
    });
  },
});

  // Process assessments data when it loads
useEffect(() => {
  if (assessments && Array.isArray(assessments) && assessments.length > 0) {
    console.log("Assessments loaded:", assessments);
    setHasFeasibilityAssessment(true);
    
    // Get the first assessment
    const assessmentWrapper = assessments[0];
    console.log("Setting current assessment:", assessmentWrapper);
    
    // Extract the actual assessment data from nested structure
    // The data is in assessmentWrapper.feasibility_assessments, not directly on assessmentWrapper
    const assessment = assessmentWrapper.feasibility_assessments || {};

     // Special handling for percentage field
    const normalizePercentage = (val) => {
      if (val === null || val === undefined) return "";
      if (typeof val === 'number') return val.toString();
      if (typeof val === 'string') {
        // Remove any non-numeric characters
        const cleaned = val.replace(/[^\d.]/g, '');
        if (!cleaned) return "";
        return cleaned;
      }
      return "";
    };
    
    // Log the percentage value before processing
    console.log("Original percentage value:", assessment.overallFeasibilityPercentage);
    
    // Store the complete wrapper for reference (needed when dealing with relations)
    setCurrentAssessment(assessmentWrapper);

    // Convert array fields to strings for textareas
    const processArrayForTextarea = (array) => {
      if (!array) return "";
      if (typeof array === 'string') return array;
      return Array.isArray(array) ? array.join('\n') : String(array);
    };

    // Format numeric fields
    const processNumericField = (value) => {
      if (value === null || value === undefined) return "";
      return String(value);
    };

    // Process boolean fields
    const processBooleanField = (value) => {
      return value === true || value === "true";
    };

    // Log the actual assessment data to check its structure
    console.log("Assessment data being used to fill form:", assessment);

    // Populate formData with the assessment data
    setFormData({
      plannedBusinessLocation: assessment.plannedBusinessLocation || "",
      isGroundRentRequired: processBooleanField(assessment.isGroundRentRequired),
      hasStructureOrStall: processBooleanField(assessment.hasStructureOrStall),
      structureNeeds: assessment.structureNeeds || "",
      estimatedSpaceCost: processNumericField(assessment.estimatedSpaceCost),
      spaceCostContribution: processNumericField(assessment.spaceCostContribution),
      equipmentNeeded: processArrayForTextarea(assessment.equipmentNeeded),
      equipmentCurrentlyOwned: processArrayForTextarea(assessment.equipmentCurrentlyOwned),
      equipmentMissing: processArrayForTextarea(assessment.equipmentMissing),
      equipmentTotalCost: processNumericField(assessment.equipmentTotalCost),
      equipmentCostContribution: processNumericField(assessment.equipmentCostContribution),
      startupSuppliesNeeded: processArrayForTextarea(assessment.startupSuppliesNeeded),
      suppliesCurrentlyOwned: processArrayForTextarea(assessment.suppliesCurrentlyOwned),
      suppliesMissing: processArrayForTextarea(assessment.suppliesMissing),
      suppliesTotalCost: processNumericField(assessment.suppliesTotalCost),
      suppliesCostContribution: processNumericField(assessment.suppliesCostContribution),
      marketingToolsNeeded: processArrayForTextarea(assessment.marketingToolsNeeded),
      marketingToolsCurrentlyOwned: processArrayForTextarea(assessment.marketingToolsCurrentlyOwned),
      marketingToolsMissing: processArrayForTextarea(assessment.marketingToolsMissing),
      marketingTotalCost: processNumericField(assessment.marketingTotalCost),
      marketingCostContribution: processNumericField(assessment.marketingCostContribution),
      needsDelivery: processBooleanField(assessment.needsDelivery),
      deliveryMethod: assessment.deliveryMethod || "",
      deliveryResourcesAvailable: assessment.deliveryResourcesAvailable || "",
      deliverySetupCost: processNumericField(assessment.deliverySetupCost),
      deliveryCostContribution: processNumericField(assessment.deliveryCostContribution),
      monthlyNonBusinessExpenses: processNumericField(assessment.monthlyNonBusinessExpenses),
      expectedPrice: processNumericField(assessment.expectedPrice),
      expectedSalesDaily: processNumericField(assessment.expectedSalesDaily),
      expectedSalesWeekly: processNumericField(assessment.expectedSalesWeekly),
      expectedSalesMonthly: processNumericField(assessment.expectedSalesMonthly),
      expectedMonthlyRevenue: processNumericField(assessment.expectedMonthlyRevenue),
      expectedMonthlyExpenditure: processNumericField(assessment.expectedMonthlyExpenditure),
      expectedMonthlySavings: processNumericField(assessment.expectedMonthlySavings),
      expectedPayToSelf: processNumericField(assessment.expectedPayToSelf),
      isPlanFeasible: processBooleanField(assessment.isPlanFeasible),
      planAdjustments: assessment.planAdjustments || "",
      seedCapitalNeeded: processNumericField(assessment.seedCapitalNeeded),
      seedCapitalUsage: assessment.seedCapitalUsage || "",
      overallFeasibilityPercentage: normalizePercentage(assessment.overallFeasibilityPercentage),
      reviewComments: assessment.reviewComments || "",
      recommendations: assessment.recommendations || "",
      riskFactors: assessment.riskFactors || "",
      growthOpportunities: assessment.growthOpportunities || "",
      recommendedActions: assessment.recommendedActions || "",
    });
    
    // Fix the localStorage error - use the correct path to the ID
    try {
      if (id && assessment.id) {
        localStorage.setItem(`business_${id}_has_assessment`, 'true');
        localStorage.setItem(`business_${id}_assessment_id`, assessment.id.toString());
      }
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
  } else {
    setHasFeasibilityAssessment(false);
    setCurrentAssessment(null);
    try {
      localStorage.removeItem(`business_${id}_has_assessment`);
      localStorage.removeItem(`business_${id}_assessment_id`);
    } catch (e) {
      console.error("Error clearing localStorage:", e);
    }
  }
}, [assessments, id]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle deleting an assessment
 const handleDeleteAssessment = (assessmentWrapper) => {
  // Extract the ID from the nested structure
  const assessmentId = assessmentWrapper?.feasibility_assessments?.id;
  if (!assessmentId) {
    console.error("Cannot delete: Assessment ID not found");
    toast({
      title: "Error",
      description: "Cannot delete assessment: ID not found",
      variant: "destructive",
    });
    return;
  }
  
  setAssessmentToDelete(assessmentId);
  setDeleteAssessmentConfirmOpen(true);
};

  // Handle creating a new assessment
  const handleCreateAssessment = () => {
    console.log("Creating new assessment");
    setCurrentAssessment(null);
    setFeasibilityAssessmentOpen(true);
  };

  // Handle save/update from the assessment dialog
  const handleAssessmentSaved = (savedAssessment) => {
    console.log("Assessment saved:", savedAssessment);
    
    // Update hasFeasibilityAssessment
    setHasFeasibilityAssessment(true);
    
    // Update currentAssessment with new data
    setCurrentAssessment(savedAssessment);
    
    // Update localStorage
    try {
      localStorage.setItem(`business_${id}_has_assessment`, 'true');
      localStorage.setItem(`business_${id}_assessment_id`, savedAssessment.id.toString());
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
    
    // Force data refresh
    queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments`] });
    queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments`, id] });
    refetchAssessments();
    refetchBusiness();
  };

// Handle saving the edited assessment directly from the tab
const handleSaveAssessment = async () => {
  const validation = validateForm();
  
  if (!validation.isValid) {
    toast({
      title: "Validation Error",
      description: `Please fill in all required fields: ${validation.missingFields.join(', ')}`,
      variant: "destructive",
    });
    return;
  }

  setIsLoading(true);
  
  try {
    // Transform textarea inputs to arrays
    const processArrayField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      return field.split('\n').filter(item => item.trim() !== '');
    };
    
    // Convert string numbers to actual numbers
    const processNumericField = (value) => {
      if (value === "" || value === null || value === undefined) return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };
    
    // Fix for Zod validation - handle nulls for string fields
    const stringifyNulls = (value) => {
      return value === null || value === undefined ? "" : value;
    };

    const processPercentageField = (value) => {
  if (value === "" || value === null || value === undefined) return "0";
  
  // If it's already a string, clean it
  if (typeof value === 'string') {
    // Remove any non-numeric characters
    const cleaned = value.replace(/[^\d.]/g, '');
    if (!cleaned) return "0";
    // Try to parse and round
    const num = parseFloat(cleaned);
    return isNaN(num) ? "0" : num.toString();
  }
  
  // If it's a number, convert to string
  if (typeof value === 'number') {
    return value.toString();
  }
  
  return "0";
};

    
    const formDataToSubmit = {
      businessId: parseInt(id || "0", 10),
      status: currentAssessment?.feasibility_assessments?.status || "Draft",
      
      // Location & Structure
      plannedBusinessLocation: stringifyNulls(formData.plannedBusinessLocation),
      isGroundRentRequired: formData.isGroundRentRequired,
      hasStructureOrStall: formData.hasStructureOrStall,
      structureNeeds: stringifyNulls(formData.structureNeeds),
      estimatedSpaceCost: processNumericField(formData.estimatedSpaceCost),
      spaceCostContribution: processNumericField(formData.spaceCostContribution),
      
      // Equipment
      equipmentNeeded: processArrayField(formData.equipmentNeeded),
      equipmentCurrentlyOwned: processArrayField(formData.equipmentCurrentlyOwned),
      equipmentMissing: processArrayField(formData.equipmentMissing),
      equipmentTotalCost: processNumericField(formData.equipmentTotalCost),
      equipmentCostContribution: processNumericField(formData.equipmentCostContribution),
      
      // Supplies
      startupSuppliesNeeded: processArrayField(formData.startupSuppliesNeeded),
      suppliesCurrentlyOwned: processArrayField(formData.suppliesCurrentlyOwned),
      suppliesMissing: processArrayField(formData.suppliesMissing),
      suppliesTotalCost: processNumericField(formData.suppliesTotalCost),
      suppliesCostContribution: processNumericField(formData.suppliesCostContribution),
      
      // Marketing
      marketingToolsNeeded: processArrayField(formData.marketingToolsNeeded),
      marketingToolsCurrentlyOwned: processArrayField(formData.marketingToolsCurrentlyOwned),
      marketingToolsMissing: processArrayField(formData.marketingToolsMissing),
      marketingTotalCost: processNumericField(formData.marketingTotalCost),
      marketingCostContribution: processNumericField(formData.marketingCostContribution),
      
      // Delivery - Fix for Zod validation
      needsDelivery: formData.needsDelivery,
      deliveryMethod: stringifyNulls(formData.deliveryMethod),
      deliveryResourcesAvailable: stringifyNulls(formData.deliveryResourcesAvailable),
      // For numeric fields that are null, convert to "0" string to pass Zod validation
      deliverySetupCost: formData.needsDelivery ? processNumericField(formData.deliverySetupCost) : "0",
      deliveryCostContribution: formData.needsDelivery ? processNumericField(formData.deliveryCostContribution) : "0",
      
      // Finance fields
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
      isPlanFeasible: formData.isPlanFeasible,
      planAdjustments: stringifyNulls(formData.planAdjustments),
      seedCapitalNeeded: processNumericField(formData.seedCapitalNeeded),
      seedCapitalUsage: stringifyNulls(formData.seedCapitalUsage),
      overallFeasibilityPercentage: processPercentageField(formData.overallFeasibilityPercentage),
      reviewComments: stringifyNulls(formData.reviewComments),
      recommendations: stringifyNulls(formData.recommendations),
      riskFactors: stringifyNulls(formData.riskFactors),
      growthOpportunities: stringifyNulls(formData.growthOpportunities),
      recommendedActions: stringifyNulls(formData.recommendedActions),
    };
    
    // Extract the assessment ID properly from the nested structure
    const assessmentId = currentAssessment?.feasibility_assessments?.id;
    
    console.log("Saving assessment data:", {
      isExisting: !!assessmentId,
      existingId: assessmentId,
      businessId: formDataToSubmit.businessId,
    });
    
    // Determine if this is an update or create operation based on assessment ID
    const isUpdate = !!assessmentId;
    
    // Set the correct method and URL based on the existence of an ID
    const method = isUpdate ? 'PATCH' : 'POST';
    const url = isUpdate
      ? `/api/feasibility/assessments/${assessmentId}`
      : '/api/feasibility/assessments';
    
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
          
          // If there's a detailed error message from Zod validation, display it
          if (errorData.error && typeof errorData.error === 'string' && errorData.error.includes('ZodError')) {
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
      if (id) {
        localStorage.setItem(`business_${id}_has_assessment`, 'true');
        if (responseData.id) {
          localStorage.setItem(`business_${id}_assessment_id`, responseData.id.toString());
        }
      }
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
    
    toast({
      title: isUpdate ? "Assessment Updated" : "Assessment Created",
      description: isUpdate 
        ? "The feasibility assessment has been updated successfully."
        : "A new feasibility assessment has been created successfully.",
    });
    
    // Update the current assessment with the new data
    // For updates, refetch from server to get the latest data
    // For new assessments, use the response data
    if (isUpdate) {
      queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments`] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/feasibility/assessments?businessId=${id}`] 
      });
      
      // Wait a moment and then refetch the data
      setTimeout(() => {
        refetchAssessments();
        refetchBusiness();
      }, 300);
    } else {
      // If it's a new assessment, update the current assessment with the response data
      setCurrentAssessment({
        feasibility_assessments: responseData,
        // Add any other properties that might be needed
      });
      setHasFeasibilityAssessment(true);
    }
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

  // Validate form data before submission
  const validateForm = () => {
    const requiredFields = [
      'plannedBusinessLocation',
      // 'isGroundRentRequired',
      // 'hasStructureOrStall',
      // 'estimatedSpaceCost',
      // 'spaceCostContribution',
      // 'equipmentNeeded',
      // 'equipmentTotalCost',
      // 'equipmentCostContribution',
      // 'startupSuppliesNeeded',
      // 'suppliesTotalCost',
      // 'suppliesCostContribution',
      // 'marketingToolsNeeded',
      // 'marketingTotalCost',
      // 'marketingCostContribution',
      // 'needsDelivery',
      // 'monthlyNonBusinessExpenses',
      // 'expectedPrice',
      // 'expectedSalesDaily',
      // 'expectedSalesWeekly',
      // 'expectedSalesMonthly',
      // 'expectedMonthlyRevenue',
      // 'expectedMonthlyExpenditure',
      // 'expectedMonthlySavings',
      // 'seedCapitalNeeded',
      // 'isPlanFeasible',
      // 'overallFeasibilityPercentage',
    ];
    
    const missingFields = requiredFields.filter(field => 
      formData[field] === "" || 
      formData[field] === null || 
      formData[field] === undefined
    );
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  };

  return (
    <>
      {/* Feasibility Assessment Dialog (only used for creating a new assessment) */}
      <FeasibilityAssessmentDialog
        open={feasibilityAssessmentOpen}
        onOpenChange={(open) => {
          setFeasibilityAssessmentOpen(open);
          if (!open) {
            console.log("Dialog closed, refreshing data");
            queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments`] });
            queryClient.invalidateQueries({ queryKey: [`/api/feasibility/assessments`, id] });
            setTimeout(() => {
              refetchAssessments();
              refetchBusiness();
            }, 300);
          }
        }}
        businessId={parseInt(id || "0", 10)}
        businessName={business?.businessName || ""}
        district={business?.district || ""}
        existingAssessment={null} // Only used for creating a new assessment
        onSave={handleAssessmentSaved}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteAssessmentConfirmOpen} onOpenChange={setDeleteAssessmentConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteAssessmentConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (assessmentToDelete) {
                  deleteAssessmentMutation.mutate(assessmentToDelete);
                  setDeleteAssessmentConfirmOpen(false);
                }
              }}
              disabled={deleteAssessmentMutation.isPending}
            >
              {deleteAssessmentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Assessment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Assessments Tab Content */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <Card className="border-gray-100 shadow-md overflow-hidden h-full">
          <div className="h-1 w-full" style={{ 
            background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.accent})` 
          }}></div>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center text-lg" style={{ color: THEME.dark }}>
                <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
                  background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.accent}10 100%)` 
                }}>
                  <ClipboardCheck className="h-5 w-5" style={{ color: THEME.secondary }} />
                </div>
                Feasibility Assessments
              </CardTitle>
              {!hasFeasibilityAssessment && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 hover:border-gray-300"
                  onClick={handleCreateAssessment}
                >
                  <Plus className="mr-2 h-4 w-4" style={{ color: THEME.primary }} />
                  Create Assessment
                </Button>
              )}
            </div>
            <CardDescription>
              Business feasibility assessments measuring viability across key dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAssessments ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : hasFeasibilityAssessment && currentAssessment ? (
              <div className="space-y-6">
                {/* Business Details */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.dark }}>
                    Business Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Business Name">
                      <Input 
                        value={business?.businessName || ""}
                        disabled={true}
                        className="bg-gray-50 border-gray-300"
                      />
                    </FormField>
                    <FormField label="District">
                      <Input 
                        value={business?.district || ""}
                        disabled={true}
                        className="bg-gray-50 border-gray-300"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Location & Structure */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.dark }}>
                    Location & Structure
                  </h3>
                  <FormField label="Planned Business Location" required>
                    <Input 
                      name="plannedBusinessLocation"
                      value={formData.plannedBusinessLocation || ""}
                      onChange={handleInputChange}
                      placeholder="e.g., Nampati Market Stall #15" 
                      className="border-gray-300" 
                    />
                  </FormField>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Will you need to pay ground rent?" required>
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
                    <FormField label="Do you have a structure or stall?" required>
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
                    <FormField label="Estimated Cost of Space/Stall" required>
                      <CurrencyInput 
                        name="estimatedSpaceCost"
                        value={formData.estimatedSpaceCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="How much can you contribute?" required>
                      <CurrencyInput 
                        name="spaceCostContribution"
                        value={formData.spaceCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                </div>

                {/* Equipment */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.dark }}>
                    Equipment
                  </h3>
                  <FormField label="Equipment Needed" required>
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
                    <FormField label="Estimated Total Cost" required>
                      <CurrencyInput 
                        name="equipmentTotalCost"
                        value={formData.equipmentTotalCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="How much can you contribute?" required>
                      <CurrencyInput 
                        name="equipmentCostContribution"
                        value={formData.equipmentCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                </div>

                {/* Supplies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.dark }}>
                    Supplies
                  </h3>
                  <FormField label="Startup Supplies Needed" required>
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
                    <FormField label="Estimated Total Cost" required>
                      <CurrencyInput 
                        name="suppliesTotalCost"
                        value={formData.suppliesTotalCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="How much can you contribute?" required>
                      <CurrencyInput 
                        name="suppliesCostContribution"
                        value={formData.suppliesCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                </div>

                {/* Marketing */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.dark }}>
                    Marketing
                  </h3>
                  <FormField label="Marketing Tools Needed" required>
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
                    <FormField label="Estimated Total Cost" required>
                      <CurrencyInput 
                        name="marketingTotalCost"
                        value={formData.marketingTotalCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="How much can you contribute?" required>
                      <CurrencyInput 
                        name="marketingCostContribution"
                        value={formData.marketingCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                  </div>
                </div>

                {/* Delivery */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.dark }}>
                    Delivery
                  </h3>
                  <FormField label="Does your business need delivery capabilities?" required>
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
                    <FormField label="Estimated Setup Cost" required>
                      <CurrencyInput 
                        name="deliverySetupCost"
                        value={formData.deliverySetupCost || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                        disabled={!formData.needsDelivery}
                      />
                    </FormField>
                    <FormField label="How much can you contribute?" required>
                      <CurrencyInput 
                        name="deliveryCostContribution"
                        value={formData.deliveryCostContribution || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                        disabled={!formData.needsDelivery}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Revenue & Financial Projections */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.dark }}>
                    Revenue & Financial Projections
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Expected Product/Service Price" required>
                      <CurrencyInput 
                        name="expectedPrice"
                        value={formData.expectedPrice || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="Monthly Non-Business Expenses" required>
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
                    <FormField label="Expected Daily Sales" required>
                      <CurrencyInput 
                        name="expectedSalesDaily"
                        value={formData.expectedSalesDaily || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="Expected Weekly Sales" required>
                      <CurrencyInput 
                        name="expectedSalesWeekly"
                        value={formData.expectedSalesWeekly || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="Expected Monthly Sales" required>
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
                    <FormField label="Expected Monthly Revenue" required>
                      <CurrencyInput 
                        name="expectedMonthlyRevenue"
                        value={formData.expectedMonthlyRevenue || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="Expected Monthly Expenditure" required>
                      <CurrencyInput 
                        name="expectedMonthlyExpenditure"
                        value={formData.expectedMonthlyExpenditure || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="Expected Monthly Savings" required>
                      <CurrencyInput 
                        name="expectedMonthlySavings"
                        value={formData.expectedMonthlySavings || ""}
                        onChange={handleInputChange}
                        placeholder="0.00" 
                      />
                    </FormField>
                    <FormField label="Expected Pay to Self" required>
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
                    <FormField label="Seed Capital Needed" required>
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
                    <FormField label="Is Plan Feasible?" required>
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
                    <FormField label="Overall Feasibility Percentage" required>
                    <PercentageSelect
                      value={formData.overallFeasibilityPercentage}
                      onChange={(val) => {
                        console.log("Percentage selected:", val);
                        handleSelectChange("overallFeasibilityPercentage", val);
                      }}
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
                  {currentAssessment.status === "Completed" && (
                    <div className="mt-8 p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <h3 className="text-lg font-semibold text-blue-800 mb-4">Assessment Review</h3>
                      <div className="space-y-4">
                        <FormField label="Review Comments">
                          <Textarea 
                            name="reviewComments"
                            value={formData.reviewComments || ""}
                            onChange={handleInputChange}
                            placeholder="Provide review comments for this assessment" 
                            className="border-blue-200 focus:border-blue-500 min-h-[100px]" 
                          />
                        </FormField>
                        <FormField label="Recommendations">
                          <Textarea 
                            name="recommendations"
                            value={formData.recommendations || ""}
                            onChange={handleInputChange}
                            placeholder="Provide recommendations based on this assessment" 
                            className="border-blue-200 focus:border-blue-500 min-h-[100px]" 
                          />
                        </FormField>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField label="Risk Factors">
                            <Textarea 
                              name="riskFactors"
                              value={formData.riskFactors || ""}
                              onChange={handleInputChange}
                              placeholder="Identify risk factors" 
                              className="border-blue-200 focus:border-blue-500 min-h-[100px]" 
                            />
                          </FormField>
                          <FormField label="Growth Opportunities">
                            <Textarea 
                              name="growthOpportunities"
                              value={formData.growthOpportunities || ""}
                              onChange={handleInputChange}
                              placeholder="Identify growth opportunities" 
                              className="border-blue-200 focus:border-blue-500 min-h-[100px]" 
                            />
                          </FormField>
                        </div>
                        <FormField label="Recommended Actions">
                          <Textarea 
                            name="recommendedActions"
                            value={formData.recommendedActions || ""}
                            onChange={handleInputChange}
                            placeholder="Provide specific recommended actions" 
                            className="border-blue-200 focus:border-blue-500 min-h-[100px]" 
                          />
                        </FormField>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                 <Button
                  variant="destructive"
                  onClick={() => handleDeleteAssessment(currentAssessment)}  // Pass the entire object
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Assessment
                </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSaveAssessment}
                    disabled={isLoading}
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
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ 
                  background: `linear-gradient(135deg, ${THEME.primary}10 0%, ${THEME.accent}10 100%)` 
                }}>
                  <ClipboardList className="h-8 w-8" style={{ color: THEME.primary }} />
                </div>
                <h3 className="text-lg font-medium" style={{ color: THEME.dark }}>No Assessments Yet</h3>
                <p className="text-gray-500 mt-2 mb-6 max-w-md mx-auto">
                  This business doesn't have any feasibility assessments yet. Create a new assessment to determine business viability and funding requirements.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default BusinessAssessmentsTab;