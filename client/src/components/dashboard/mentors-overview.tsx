import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mentor } from "@shared/schema";
import { User, Calendar, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function MentorsOverview() {
  const [, navigate] = useLocation();

  // Fetch mentors
  const { data: mentors, isLoading, error } = useQuery<Mentor[]>({
    queryKey: ["/api/mentors"],
  });

  // Fetch mentor-business relationships
  const { data: mentorBusinesses = [] } = useQuery<any[]>({
    queryKey: ['/api/mentor-businesses'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Count assigned businesses per mentor
  const getAssignedBusinessesCount = (mentorId: number) => {
    if (!mentorBusinesses || !Array.isArray(mentorBusinesses)) {
      return 0;
    }
    
    // Filter relationships for this mentor
    const relationships = mentorBusinesses.filter(rel => rel && typeof rel === 'object' && rel.mentorId === mentorId);
    return relationships.length;
  };

  return (
    <Card>
      <CardHeader className="px-5 py-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Active Mentors</CardTitle>
          <button 
            className="text-sm text-primary-600 hover:text-primary-700"
            onClick={(e) => {
              e.preventDefault();
              navigate('/mentors');
            }}
          >
            <span className="flex items-center">
              <span>View All</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg">
                  <div className="flex items-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <div className="flex items-center mt-2">
                        <Skeleton className="h-4 w-24 mr-4" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {error && (
            <div className="p-3 text-sm text-red-500">
              Error loading mentors: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          )}

          {mentors && mentors.length === 0 && (
            <div className="p-3 text-sm text-gray-500 text-center">
              No mentors available
            </div>
          )}

          {mentors && mentors.slice(0, 3).map((mentor) => {
            const businessCount = getAssignedBusinessesCount(mentor.id);
            
            return (
              <div 
                key={mentor.id} 
                className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/mentors/${mentor.id}`);
                }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-medium">
                    {mentor.name.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{mentor.name}</p>
                        <p className="text-sm text-gray-500">{mentor.assignedDistrict}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <span className="flex items-center mr-4 text-gray-500">
                        <Building2 className="h-3.5 w-3.5 mr-1" />
                        <span>{businessCount} {businessCount === 1 ? "business" : "businesses"}</span>
                      </span>
                      <span className="flex items-center text-gray-500">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>Sessions</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
