import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BusinessProfile, insertBusinessProfileSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Store, 
  MapPin, 
  Phone, 
  Tag, 
  Calendar, 
  Building,
  Target,
  Briefcase,
  ArrowLeft,
  Save,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Service categories are organized in the dropdown menu with groups

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const staggerFormFields = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const formFieldVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

// Extending the business profile schema for the form validation
const formSchema = insertBusinessProfileSchema
  .extend({
    businessStartDate: z.string().optional(),
  })
  .omit({ createdAt: true, updatedAt: true });

type BusinessFormData = z.infer<typeof formSchema>;

interface BusinessFormProps {
  businessData?: BusinessProfile;
  isEdit?: boolean;
}

export default function BusinessForm({
  businessData,
  isEdit = false,
}: BusinessFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Set up form with default values
  const form = useForm<BusinessFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: businessData?.businessName || "",
      businessLogo: businessData?.businessLogo || "",
      district: businessData?.district || "Bekwai",
      businessLocation: businessData?.businessLocation || "",
      businessContact: businessData?.businessContact || "",
      serviceCategory: businessData?.serviceCategory || "",
      dareModel: businessData?.dareModel || "Collaborative",
      businessModel: businessData?.businessModel || "",
      businessObjectives: businessData?.businessObjectives || "",
      shortTermGoals: businessData?.shortTermGoals || "",
      targetMarket: businessData?.targetMarket || "",
      businessStartDate: businessData?.businessStartDate
        ? new Date(businessData.businessStartDate).toISOString().split("T")[0]
        : "",
    },
  });

  // Get district color
  const getDistrictColor = (district: string) => {
    if (district.includes("Bekwai")) return THEME.secondary;
    if (district.includes("Gushegu")) return THEME.primary;
    if (district.includes("Lower Manya")) return THEME.accent;
    if (district.includes("Yilo Krobo")) return THEME.dark;
    return "#6c757d";
  };

  // Get Digital Access for Rural Empowerment model color
  const getDareModelColor = (model: string) => {
    switch (model) {
      case "Collaborative":
        return THEME.primary;
      case "MakerSpace":
        return THEME.secondary;
      case "Madam Anchor":
        return THEME.accent;
      default:
        return THEME.primary;
    }
  };

  // Get current selected district
  const selectedDistrict = form.watch("district");
  const selectedDareModel = form.watch("dareModel");

  // Create or update business mutation
  const mutation = useMutation({
    mutationFn: async (data: BusinessFormData) => {
      let response;
      if (isEdit && businessData) {
        response = await apiRequest(
          "PUT",
          `/api/business-profiles/${businessData.id}`,
          data
        );
      } else {
        response = await apiRequest("POST", "/api/business-profiles", data);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate the business profiles query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/business-profiles"] });

      // Show success message
      toast({
        title: `Business ${isEdit ? "updated" : "created"} successfully`,
        description: `${data.businessName} has been ${isEdit ? "updated" : "created"}.`,
      });

      // Navigate to the business detail page
      navigate(`/businesses/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEdit ? "update" : "create"} business`,
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Form submission handler
  function onSubmit(data: BusinessFormData) {
    setIsSubmitting(true);
    mutation.mutate(data);
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <Card className="border-gray-100 shadow-md overflow-hidden">
        <div className="h-1 w-full" style={{ 
          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
        }}></div>
        <CardHeader className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3" style={{ 
              background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.primary}10 100%)` 
            }}>
              <Store className="h-5 w-5" style={{ color: THEME.primary }} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold" style={{ color: THEME.dark }}>
                {isEdit ? "Edit Business" : "Create New Business"}
              </CardTitle>
              <CardDescription className="mt-1">
                {isEdit 
                  ? "Update the details for this business profile" 
                  : "Fill in the details to create a new business profile"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <motion.div 
                variants={staggerFormFields}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Business Name */}
                <motion.div variants={formFieldVariant}>
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                          <Store className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                          Business Name <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter business name" 
                            {...field} 
                            className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Business Logo URL */}
                <motion.div variants={formFieldVariant}>
                  <FormField
                    control={form.control}
                    name="businessLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                          <img className="h-4 w-4 mr-2" src="/icons/logo.svg" alt="" style={{ color: THEME.primary }} />
                          Business Logo
                        </FormLabel>
                        <div>
                          <div className="flex flex-col items-center mb-3">
                            <div 
                              className="w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative border-2"
                              style={{ 
                                borderColor: field.value ? THEME.primary : "#ddd",
                                background: field.value ? `url(${field.value}) center/cover no-repeat` : "#f9f9f9" 
                              }}
                              onClick={() => document.getElementById('logo-upload-hidden')?.click()}
                            >
                              {imageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10">
                                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                              )}
                              {!field.value && !imageLoading && (
                                <div className="flex flex-col items-center justify-center text-center p-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" style={{color: "#aaa"}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm text-gray-500">Upload Logo</span>
                                </div>
                              )}
                              {field.value && !imageLoading && (
                                <div 
                                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    field.onChange("");
                                  }}
                                >
                                  <span className="text-white font-medium">Remove</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                id="logo-upload-hidden"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                placeholder="Logo URL" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setImageLoading(true);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      field.onChange(reader.result as string);
                                      setImageLoading(false);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <Input
                                placeholder="Enter logo URL" 
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1 pl-10"
                                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                <img className="h-4 w-4" src="/icons/link.svg" alt="" style={{ opacity: 0.5 }} />
                              </div>
                            </div>
                          </FormControl>
                        </div>
                        <FormDescription className="text-xs">
                          Upload logo or enter a URL to the business logo image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* District */}
                <motion.div variants={formFieldVariant}>
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                          <MapPin className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                          District <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                              <div className="flex items-center">
                                {selectedDistrict && (
                                  <div 
                                    className="w-2 h-2 rounded-full mr-2" 
                                    style={{ backgroundColor: getDistrictColor(selectedDistrict) }}
                                  ></div>
                                )}
                                <SelectValue placeholder="Select a district" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bekwai">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.secondary }}></div>
                                Bekwai
                              </div>
                            </SelectItem>
                            <SelectItem value="Gushegu">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.primary }}></div>
                                Gushegu
                              </div>
                            </SelectItem>
                            <SelectItem value="Lower Manya Krobo">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.accent }}></div>
                                Lower Manya Krobo
                              </div>
                            </SelectItem>
                            <SelectItem value="Yilo Krobo">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.dark }}></div>
                                Yilo Krobo
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Business Location */}
                <motion.div variants={formFieldVariant}>
                  <FormField
                    control={form.control}
                    name="businessLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                          <Building className="h-4 w-4 mr-2" style={{ color: THEME.dark }} />
                          Business Location
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter business location"
                            {...field}
                            value={field.value || ""}
                            className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Specific location within the district
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Business Contact */}
                <motion.div variants={formFieldVariant}>
                  <FormField
                    control={form.control}
                    name="businessContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                          <Phone className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                          Business Contact
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter business contact"
                            {...field}
                            value={field.value || ""}
                            className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Service Category */}
                <motion.div variants={formFieldVariant}>
                  <FormField
                    control={form.control}
                    name="serviceCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                          <Tag className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                          Service Category
                        </FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                                <SelectValue placeholder="Select a service category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              <SelectGroup>
                                <SelectLabel className="text-xs font-semibold">Food & Apparel</SelectLabel>
                                <SelectItem value="Catering & Food Services">Catering & Food Services</SelectItem>
                                <SelectItem value="Tailoring & Fashion">Tailoring & Fashion</SelectItem>
                              </SelectGroup>
                              <SelectSeparator />
                              
                              <SelectGroup>
                                <SelectLabel className="text-xs font-semibold">Retail & Services</SelectLabel>
                                <SelectItem value="Beauty & Cosmetics">Beauty & Cosmetics</SelectItem>
                                <SelectItem value="Retail & Commerce">Retail & Commerce</SelectItem>
                                <SelectItem value="Electronics & Repairs">Electronics & Repairs</SelectItem>
                                <SelectItem value="Cleaning Services">Cleaning Services</SelectItem>
                                <SelectItem value="Hospitality">Hospitality</SelectItem>
                              </SelectGroup>
                              <SelectSeparator />
                              
                              <SelectGroup>
                                <SelectLabel className="text-xs font-semibold">Technical & Skilled</SelectLabel>
                                <SelectItem value="Agriculture & Farming">Agriculture & Farming</SelectItem>
                                <SelectItem value="Artisanal Crafts">Artisanal Crafts</SelectItem>
                                <SelectItem value="Construction & Carpentry">Construction & Carpentry</SelectItem>
                              </SelectGroup>
                              <SelectSeparator />
                              
                              <SelectGroup>
                                <SelectLabel className="text-xs font-semibold">Professional Services</SelectLabel>
                                <SelectItem value="Healthcare Services">Healthcare Services</SelectItem>
                                <SelectItem value="Education & Training">Education & Training</SelectItem>
                                <SelectItem value="Transportation">Transportation</SelectItem>
                                <SelectItem value="Digital Services">Digital Services</SelectItem>
                                <SelectItem value="Financial Services">Financial Services</SelectItem>
                              </SelectGroup>
                              <SelectSeparator />
                              
                              <SelectGroup>
                                <SelectItem value="Other Services">Other Services</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        <FormDescription className="text-xs">
                          E.g. Catering, Tailoring, Artisan, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Digital Access for Rural Empowerment Model */}
                <motion.div variants={formFieldVariant}>
                  <FormField
                    control={form.control}
                    name="dareModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                          <Briefcase className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                          Digital Access for Rural Empowerment Model <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || "Collaborative"}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-200 focus:ring-offset-1">
                              <div className="flex items-center">
                                {selectedDareModel && (
                                  <div 
                                    className="w-2 h-2 rounded-full mr-2" 
                                    style={{ backgroundColor: getDareModelColor(selectedDareModel) }}
                                  ></div>
                                )}
                                <SelectValue placeholder="Select model" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Collaborative">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.primary }}></div>
                                Collaborative
                              </div>
                            </SelectItem>
                            <SelectItem value="MakerSpace">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.secondary }}></div>
                                MakerSpace
                              </div>
                            </SelectItem>
                            <SelectItem value="Madam Anchor">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: THEME.accent }}></div>
                                Madam Anchor
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Select the appropriate model for this business
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Business Start Date */}
                <motion.div variants={formFieldVariant}>
                  <FormField
                    control={form.control}
                    name="businessStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                          <Calendar className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                          Business Start Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            placeholder="Select start date"
                            {...field}
                            value={field.value || ""}
                            className="border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              </motion.div>

              {/* Business Description Fields */}
              <motion.div 
                variants={formFieldVariant}
                className="space-y-6 mt-4 pt-4 border-t border-gray-100"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3" style={{ 
                    background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.primary}10 100%)` 
                  }}>
                    <Target className="h-4 w-4" style={{ color: THEME.primary }} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: THEME.dark }}>Business Description</h3>
                </div>

                {/* Business Model */}
                <FormField
                  control={form.control}
                  name="businessModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                        <Briefcase className="h-4 w-4 mr-2" style={{ color: THEME.secondary }} />
                        Business Model
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the business model"
                          className="min-h-[100px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Describe how the business operates and generates income
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Business Objectives */}
                <FormField
                  control={form.control}
                  name="businessObjectives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                        <CheckCircle2 className="h-4 w-4 mr-2" style={{ color: THEME.primary }} />
                        Business Objectives
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter business objectives"
                          className="min-h-[100px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        What are the long-term goals and objectives of this business?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Short Term Goals */}
                <FormField
                  control={form.control}
                  name="shortTermGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                        <CheckCircle2 className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                        Short Term Goals
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter short term goals"
                          className="min-h-[100px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        What are the immediate goals this business plans to achieve in the next 3-6 months?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Market */}
                <FormField
                  control={form.control}
                  name="targetMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center font-medium" style={{ color: THEME.dark }}>
                        <Target className="h-4 w-4 mr-2" style={{ color: THEME.accent }} />
                        Target Market
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the target market"
                          className="min-h-[100px] border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-offset-1"
                          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Who are the customers or clients this business aims to serve?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Form Actions */}
              <motion.div 
                variants={formFieldVariant}
                className="flex justify-end space-x-4 pt-4 border-t border-gray-100"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/businesses")}
                  disabled={isSubmitting}
                  className="border-gray-200 hover:border-gray-300 transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="shadow-sm hover:shadow-md transition-all duration-300"
                  style={{ 
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none" 
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isEdit ? "Update" : "Create"} Business
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}