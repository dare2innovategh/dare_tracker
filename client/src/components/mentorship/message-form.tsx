import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMentorshipMessageSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart4, BookText, CircleDollarSign, LoaderCircle, 
  MessageSquareText, PencilRuler, Send, Store 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the form schema with enhanced business focus
const formSchema = insertMentorshipMessageSchema.extend({
  category: z.enum(["operations", "marketing", "finance", "management", "strategy", "other"]).optional(),
});

type MessageFormData = z.infer<typeof formSchema>;

interface MessageFormProps {
  mentorId: number;
  businessId: number;
}

export default function MessageForm({ mentorId, businessId }: MessageFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showCategories, setShowCategories] = useState(false);
  
  // Determine if user is mentor or business representative
  const senderRole: "mentor" | "business" = user?.role === "mentor" ? "mentor" : "business";
  const isMentor = senderRole === "mentor";
  
  const form = useForm<MessageFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mentorId,
      businessId,
      message: "",
      sender: senderRole,
      category: isMentor ? undefined : "other",
    },
  });

  // Create message mutation
  const mutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const res = await apiRequest("POST", "/api/mentorship-messages", data);
      return await res.json();
    },
    onSuccess: () => {
      // Reset form
      form.reset({
        mentorId,
        businessId,
        message: "",
        sender: senderRole,
        category: isMentor ? undefined : "other",
      });
      
      // Invalidate queries to refresh message list
      queryClient.invalidateQueries({
        queryKey: [`/api/mentorship-messages/mentor/${mentorId}/business/${businessId}`],
      });
      
      // Subtle toast for mentors to confirm advice sent
      if (isMentor) {
        toast({
          title: "Business advice sent",
          description: "Your guidance has been delivered to the business",
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: MessageFormData) {
    mutation.mutate(data);
  }

  // Get icon based on category
  const getCategoryIcon = (category?: string) => {
    switch(category) {
      case "operations": return <Store className="h-4 w-4" />;
      case "marketing": return <MessageSquareText className="h-4 w-4" />;
      case "finance": return <CircleDollarSign className="h-4 w-4" />;
      case "management": return <BookText className="h-4 w-4" />;
      case "strategy": return <BarChart4 className="h-4 w-4" />;
      default: return <PencilRuler className="h-4 w-4" />;
    }
  };

  return (
    <Card className="mt-2">
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Only show category selection for mentors */}
            {isMentor && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advice Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category of advice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="operations">
                          <div className="flex items-center">
                            <Store className="mr-2 h-4 w-4" />
                            Operations
                          </div>
                        </SelectItem>
                        <SelectItem value="marketing">
                          <div className="flex items-center">
                            <MessageSquareText className="mr-2 h-4 w-4" />
                            Marketing
                          </div>
                        </SelectItem>
                        <SelectItem value="finance">
                          <div className="flex items-center">
                            <CircleDollarSign className="mr-2 h-4 w-4" />
                            Finance
                          </div>
                        </SelectItem>
                        <SelectItem value="management">
                          <div className="flex items-center">
                            <BookText className="mr-2 h-4 w-4" />
                            Management
                          </div>
                        </SelectItem>
                        <SelectItem value="strategy">
                          <div className="flex items-center">
                            <BarChart4 className="mr-2 h-4 w-4" />
                            Strategy
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center">
                            <PencilRuler className="mr-2 h-4 w-4" />
                            Other
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isMentor ? "Business Advice" : "Question"}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={isMentor ? 
                        "Provide business advice, growth strategies, or actionable suggestions for the business..." : 
                        "Request specific guidance or ask questions about your business challenges..."}
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between items-center">
              {isMentor && (
                <div className="text-sm text-gray-500">
                  {form.getValues().category ? 
                    <span className="flex items-center">
                      {getCategoryIcon(form.getValues().category)}
                      <span className="ml-1 capitalize">{form.getValues().category} advice</span>
                    </span> : 
                    "Select a category for your advice"
                  }
                </div>
              )}
              <Button 
                type="submit"
                disabled={mutation.isPending || !form.getValues().message.trim() || (isMentor && !form.getValues().category)}
                className="ml-auto"
              >
                {mutation.isPending ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    {isMentor ? "Send Business Advice" : "Request Guidance"}
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
