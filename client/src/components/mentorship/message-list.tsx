import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MentorshipMessage, Mentor, BusinessProfile } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import MessageForm from "./message-form";
import { getMessageCategoryName } from "@/pages/mentorship-page";
import { 
  BarChart4, BookText, Building2, CircleDollarSign, 
  MessageSquareText, PencilRuler, Store, User 
} from "lucide-react";

interface MessageListProps {
  mentorId: number;
  businessId: number;
}

export default function MessageList({ mentorId, businessId }: MessageListProps) {
  const { user } = useAuth();
  
  // Get messages between mentor and business
  const { 
    data: messages, 
    isLoading: isLoadingMessages, 
    error 
  } = useQuery<MentorshipMessage[]>({
    queryKey: [`/api/mentorship-messages/mentor/${mentorId}/business/${businessId}`],
  });
  
  // Get mentor info
  const { data: mentor, isLoading: isLoadingMentor } = useQuery<Mentor>({
    queryKey: [`/api/mentors/${mentorId}`],
  });
  
  // Get business info
  const { data: business, isLoading: isLoadingBusiness } = useQuery<BusinessProfile>({
    queryKey: [`/api/business-profiles/${businessId}`],
  });

  // Get mentor-business relationship
  const { data: mentorBusinessRelationship } = useQuery({
    queryKey: [`/api/mentor-business-relationships/${mentorId}/${businessId}`],
  });
  
  const isLoading = isLoadingMessages || isLoadingMentor || isLoadingBusiness;
  
  // Get category icon
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

  // Get category badge color
  const getCategoryColor = (category?: string) => {
    switch(category) {
      case "operations": return "bg-green-100 text-green-800 border-green-200";
      case "marketing": return "bg-purple-100 text-purple-800 border-purple-200";
      case "finance": return "bg-blue-100 text-blue-800 border-blue-200";
      case "management": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "strategy": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading messages: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!mentor || !business) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <p>Mentor or business information not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Sort messages by date (oldest first)
  const sortedMessages = messages 
    ? [...messages].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ) 
    : [];

  // Group messages by date
  const groupedMessages: Record<string, MentorshipMessage[]> = {};
  sortedMessages.forEach(message => {
    const date = format(new Date(message.createdAt), 'MMMM d, yyyy');
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-xl">
                <Building2 className="h-5 w-5 mr-2 text-amber-600" />
                Business Advisory
              </CardTitle>
              <CardDescription>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1 text-indigo-500" />
                    <span className="text-indigo-700 font-medium">{mentor.name}</span>
                  </div>
                  <span className="hidden sm:block text-gray-400">•</span>
                  <div className="flex items-center">
                    <Building2 className="h-3 w-3 mr-1 text-amber-500" />
                    <span className="text-amber-700 font-medium">{business.businessName}</span>
                  </div>
                </div>
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <span className="text-sm">{sortedMessages.length}</span>
              <span className="text-xs">{sortedMessages.length === 1 ? 'entry' : 'entries'}</span>
            </Badge>
          </div>
        </CardHeader>

        {/* Mentorship Focus - if available */}
        {mentorBusinessRelationship && mentorBusinessRelationship.mentorshipFocus && (
          <div className="px-6 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <h4 className="text-sm font-semibold text-amber-800 mb-1 flex items-center">
                <BarChart4 className="h-4 w-4 mr-1" />
                Mentorship Focus
              </h4>
              <p className="text-sm text-amber-700">{mentorBusinessRelationship.mentorshipFocus}</p>
              {mentorBusinessRelationship.mentorshipGoals && Array.isArray(mentorBusinessRelationship.mentorshipGoals) && mentorBusinessRelationship.mentorshipGoals.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-xs font-medium text-amber-800 mb-1">Goals:</h5>
                  <ul className="text-xs text-amber-700 pl-4 list-disc">
                    {mentorBusinessRelationship.mentorshipGoals.map((goal: string, index: number) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        <CardContent>
          {sortedMessages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookText className="h-8 w-8 text-amber-500" />
              </div>
              <p className="mb-2 font-medium">No business advice yet</p>
              <p className="text-sm max-w-md mx-auto">
                {user?.role === 'mentor' 
                  ? 'Share your business expertise and guidance with this business below. Categorize your advice to help track progress in specific areas.'
                  : 'Request business advice or clarification from your mentor. Be specific about your business challenges to receive targeted guidance.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMessages).map(([date, dayMessages]) => (
                <div key={date} className="space-y-4">
                  <div className="relative">
                    <Separator className="absolute top-1/2 w-full" />
                    <span className="relative bg-white px-2 text-xs text-gray-500 z-10 mx-auto block w-fit">
                      {date}
                    </span>
                  </div>
                  
                  {dayMessages.map((message) => {
                    const isMentor = message.sender === 'mentor';
                    const isCurrentUser = (isMentor && user?.role === 'mentor') || (!isMentor && user?.role !== 'mentor');
                    
                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 ${isCurrentUser ? 'space-x-reverse' : ''}`}>
                          <Avatar className="h-9 w-9 mt-1 border-2" style={{
                            borderColor: isMentor ? '#4f46e5' : '#d97706',
                            opacity: isCurrentUser ? 1 : 0.85
                          }}>
                            {isMentor ? (
                              <>
                                <AvatarImage src="" alt={mentor.name} />
                                <AvatarFallback className="bg-indigo-50 text-indigo-600">
                                  {mentor.name.charAt(0)}
                                </AvatarFallback>
                              </>
                            ) : (
                              <>
                                <AvatarImage src={business.businessLogo || ""} alt={business.businessName} />
                                <AvatarFallback className="bg-amber-50 text-amber-600">
                                  {business.businessName.charAt(0)}
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          
                          <div>
                            {/* Message header with sender name */}
                            <div className={`text-xs font-medium mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                              {isMentor ? (
                                <span className="text-indigo-700">{mentor.name}</span>
                              ) : (
                                <span className="text-amber-700">{business.businessName}</span>
                              )}
                            </div>
                            
                            {/* Message content */}
                            <div className={`rounded-lg px-4 py-3 shadow-sm ${
                              isMentor 
                                ? 'bg-indigo-50 border border-indigo-100' 
                                : 'bg-amber-50 border border-amber-100'
                            }`}>
                              {/* Message category badge - only for mentor messages */}
                              {isMentor && message.category && (
                                <Badge 
                                  variant="outline" 
                                  className={`mb-2 text-xs ${getCategoryColor(message.category)}`}
                                >
                                  <span className="flex items-center">
                                    {getCategoryIcon(message.category)}
                                    <span className="ml-1">{getMessageCategoryName(message.category)}</span>
                                  </span>
                                </Badge>
                              )}
                              
                              {/* Message content */}
                              <div className={`text-sm ${isMentor ? 'text-indigo-800' : 'text-amber-800'}`}>
                                {message.message.split('\n').map((line, i) => (
                                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                            
                            {/* Message timestamp */}
                            <div className={`mt-1 text-xs text-gray-400 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                              {format(new Date(message.createdAt), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <MessageForm mentorId={mentorId} businessId={businessId} />
    </div>
  );
}
