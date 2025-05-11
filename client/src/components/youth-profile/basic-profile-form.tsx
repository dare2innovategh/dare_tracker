import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";

// Simple form schema with only required fields
const formSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }),
  district: z.string().min(1, { message: "District is required" }),
  town: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email" }).optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof formSchema>;

interface BasicProfileFormProps {
  userId: number;
}

export default function BasicProfileForm({ userId }: BasicProfileFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      district: '',
      town: '',
      phoneNumber: '',
      email: '',
    },
    mode: "onChange",
  });

  // Form submission handler
  async function onSubmit(data: ProfileFormData) {
    console.log("Form data:", data);
    setIsSubmitting(true);

    try {
      // Use JSON submission instead of FormData
      // This ensures the data is sent in a format the server expects
      const profileData = {
        fullName: data.fullName || "Test User",
        district: data.district || "Bekwai",
        town: data.town || "",
        phoneNumber: data.phoneNumber || "",
        email: data.email || "",
        userId: userId
      };
      
      console.log("Sending profile data:", profileData);
      
      // Send the request with JSON
      const response = await fetch('/api/youth/profiles', {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        // Try to parse the error response
        let errorMessage = '';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
          try {
            const errorText = await response.text();
            errorMessage = errorText.substring(0, 100);
          } catch {
            errorMessage = 'Unknown error';
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
      }
      
      // Handle success
      queryClient.invalidateQueries({ queryKey: ["/api/youth/profiles"] });
      toast({
        title: "Success",
        description: "Youth profile created successfully",
        variant: "default",
      });
      navigate('/youth/profiles');
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: `Failed to create profile: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg overflow-hidden border-t-4 border-t-[#0072CE]">
      <CardHeader className="bg-gradient-to-r from-[#0072CE] to-[#6C17C9] text-white">
        <CardTitle className="text-2xl font-bold">
          Create Basic Youth Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              <div className="mb-6 bg-[#F8FAFC] rounded-lg p-6 border border-[#E2E8F0]">
                <h3 className="text-lg font-semibold text-[#172449] mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-[#0072CE]" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#172449] font-medium">Full Name*</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter full name" 
                            {...field} 
                            className="bg-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#172449] font-medium">District*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select district" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bekwai">Bekwai</SelectItem>
                            <SelectItem value="Gushegu">Gushegu</SelectItem>
                            <SelectItem value="Lower Manya Krobo">Lower Manya Krobo</SelectItem>
                            <SelectItem value="Yilo Krobo">Yilo Krobo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="town"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#172449] font-medium">Town/Village</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter town or village" 
                            {...field} 
                            className="bg-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#172449] font-medium">Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter phone number" 
                            {...field} 
                            className="bg-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#172449] font-medium">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter email address" 
                            {...field} 
                            className="bg-white" 
                            type="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/youth/profiles')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#0072CE] hover:bg-[#005BB5]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}