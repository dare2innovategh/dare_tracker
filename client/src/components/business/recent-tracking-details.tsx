import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { BusinessTracking } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  BarChart2, 
  CalendarClock, 
  Check, 
  CircleDollarSign, 
  Clock, 
  Loader2, 
  Users 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71",   // Mastercard Dark Blue
};

interface RecentTrackingDetailsProps {
  businessId: number;
}

export function RecentTrackingDetails({ businessId }: RecentTrackingDetailsProps) {
  // Fetch business tracking data - limited to the most recent record
  const { data: trackingData, isLoading, error } = useQuery<BusinessTracking[]>({
    queryKey: [`/api/business-tracking/businesses/${businessId}/tracking`],
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
  
  // Format currency
  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "N/A";
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(value);
  };

  // Get most recent tracking record
  const mostRecentRecord = trackingData && trackingData.length > 0 
    ? trackingData.sort((a, b) => {
        // Sort by most recent tracking date
        const dateA = new Date(a.trackingDate).getTime();
        const dateB = new Date(b.trackingDate).getTime();
        return dateB - dateA;
      })[0]
    : null;
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show error message if there was an error
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Business Data</CardTitle>
          <CardDescription>Latest tracking record details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error loading tracking data</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {error instanceof Error ? error.message : "Failed to load recent tracking data"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show empty state if no data
  if (!mostRecentRecord) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Business Data</CardTitle>
          <CardDescription>Latest tracking record details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <BarChart2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No tracking data available</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              There are no tracking records for this business yet. Add a new tracking record to see data here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate revenue achievement percentage
  const revenueAchievementPercent = mostRecentRecord.projectedRevenue && mostRecentRecord.actualRevenue
    ? Math.round((mostRecentRecord.actualRevenue / mostRecentRecord.projectedRevenue) * 100)
    : null;
  
  // Format tracking date
  const formattedTrackingDate = mostRecentRecord.trackingDate 
    ? format(new Date(mostRecentRecord.trackingDate), "PPP")
    : "Unknown date";
  
  // Format tracking month
  const formattedTrackingMonth = mostRecentRecord.trackingMonth
    ? format(new Date(mostRecentRecord.trackingMonth), "MMMM yyyy")
    : "Unknown month";
  
  // Verification status badge
  const VerificationBadge = () => {
    if (mostRecentRecord.isVerified) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-green-200 bg-green-50 text-green-700">
          <Check className="h-3 w-3" />
          <span>Verified</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1 border-amber-200 bg-amber-50 text-amber-700">
        <Clock className="h-3 w-3" />
        <span>Unverified</span>
      </Badge>
    );
  };
  
  return (
    <Card className="border-gray-100 shadow-md overflow-hidden mb-6">
      <div className="h-1 w-full" style={{ 
        background: `linear-gradient(to right, ${THEME.primary}, ${THEME.accent})` 
      }}></div>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
          <div>
            <CardTitle className="flex items-center text-base sm:text-lg" style={{ color: THEME.dark }}>
              <div 
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0"
                style={{ background: `linear-gradient(135deg, #FF5F0020 0%, #F79E1B10 100%)` }}
              >
                <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: THEME.primary }} />
              </div>
              <span className="truncate">Business Data</span>
            </CardTitle>
            <CardDescription className="mt-0.5 sm:mt-1">
              Data recorded for {formattedTrackingMonth}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
            <VerificationBadge />
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <CalendarClock className="h-3 w-3" />
              <span className="truncate">{formattedTrackingDate}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 sm:pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Financial Summary */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-medium uppercase text-muted-foreground tracking-wider">
              Financial Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <CircleDollarSign 
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0"
                    style={{ color: THEME.primary }}
                  />
                  <span className="text-xs sm:text-sm font-medium truncate">Actual Revenue</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: THEME.dark }}>
                  {formatCurrency(mostRecentRecord.actualRevenue)}
                </p>
                {revenueAchievementPercent !== null && (
                  <Badge
                    className={`mt-1 text-xs ${
                      revenueAchievementPercent >= 100
                        ? "bg-green-100 text-green-800"
                        : revenueAchievementPercent >= 75
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {revenueAchievementPercent}% of target
                  </Badge>
                )}
              </div>
              
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <CircleDollarSign 
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0"
                    style={{ color: THEME.dark }}
                  />
                  <span className="text-xs sm:text-sm font-medium truncate">Projected Revenue</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: THEME.dark }}>
                  {formatCurrency(mostRecentRecord.projectedRevenue)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <CircleDollarSign 
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0"
                    style={{ color: THEME.accent }}
                  />
                  <span className="text-xs sm:text-sm font-medium truncate">Expenditure</span>
                </div>
                <p className="text-lg sm:text-xl font-bold" style={{ color: THEME.dark }}>
                  {formatCurrency(mostRecentRecord.actualExpenditure)}
                </p>
              </div>
              
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <CircleDollarSign 
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0"
                    style={{ color: THEME.secondary }}
                  />
                  <span className="text-xs sm:text-sm font-medium truncate">Profit</span>
                </div>
                <p className="text-lg sm:text-xl font-bold" style={{ color: THEME.dark }}>
                  {formatCurrency(mostRecentRecord.actualProfit)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Operational Summary */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-medium uppercase text-muted-foreground tracking-wider">
              Operational Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <Users 
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0"
                    style={{ color: THEME.primary }}
                  />
                  <span className="text-xs sm:text-sm font-medium truncate">Current Employees</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: THEME.dark }}>
                  {mostRecentRecord.actualEmployees ?? "N/A"}
                </p>
              </div>
              
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <Users 
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0"
                    style={{ color: THEME.secondary }}
                  />
                  <span className="text-xs sm:text-sm font-medium truncate">New Employees</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: THEME.dark }}>
                  {mostRecentRecord.newEmployees ?? "0"}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
              <div className="flex items-center mb-1 sm:mb-2">
                <span className="text-xs sm:text-sm font-medium">Market Presence</span>
              </div>
              <p className="text-sm sm:text-base">
                {mostRecentRecord.prominentMarket || "No market information provided"}
              </p>
            </div>

            {mostRecentRecord.businessInsights && (
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center mb-1 sm:mb-2">
                  <span className="text-xs sm:text-sm font-medium">Key Insights</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700">
                  {mostRecentRecord.businessInsights}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Challenges and Next Steps */}
        {(Array.isArray(mostRecentRecord.challenges) && mostRecentRecord.challenges.length > 0) || 
         (Array.isArray(mostRecentRecord.nextStepsPlanned) && mostRecentRecord.nextStepsPlanned.length > 0) && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Challenges */}
              {Array.isArray(mostRecentRecord.challenges) && mostRecentRecord.challenges.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium uppercase text-muted-foreground tracking-wider mb-2 sm:mb-3">
                    Current Challenges
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {mostRecentRecord.challenges.map((challenge: string, index: number) => (
                      <li key={index} className="text-xs sm:text-sm text-gray-700">{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Next Steps */}
              {Array.isArray(mostRecentRecord.nextStepsPlanned) && mostRecentRecord.nextStepsPlanned.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium uppercase text-muted-foreground tracking-wider mb-2 sm:mb-3">
                    Planned Next Steps
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {mostRecentRecord.nextStepsPlanned.map((step: string, index: number) => (
                      <li key={index} className="text-xs sm:text-sm text-gray-700">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}