import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { format, parseISO, subMonths, getMonth, getYear, isSameMonth } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Loader2 } from "lucide-react";
import { BusinessTracking } from "@shared/schema";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71",   // Mastercard Dark Blue
};

type TimeRange = "last3months" | "last6months" | "last12months" | "year";

interface ChartDataPoint {
  date: string;
  actualRevenue: number;
  projectedRevenue: number;
  month: string;
}

interface BusinessGrowthChartProps {
  businessId?: number;  // Optional to show all businesses if not provided
  title?: string;
  description?: string;
}

export function BusinessGrowthChart({ 
  businessId, 
  title = "Business Growth", 
  description = "Monthly revenue metrics and performance trends"
}: BusinessGrowthChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("last6months");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  // Fetch business tracking data
  const { data: trackingData, isLoading, error } = useQuery<BusinessTracking[]>({
    queryKey: businessId 
      ? [`/api/business-tracking/businesses/${businessId}/tracking`] 
      : ['/api/business-tracking/all'],
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
  
  // Process data for the chart based on selected time range
  const chartData = useMemo(() => {
    if (!trackingData || trackingData.length === 0) return [];
    
    const today = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case "last3months":
        startDate = subMonths(today, 3);
        break;
      case "last6months":
        startDate = subMonths(today, 6);
        break;
      case "last12months":
        startDate = subMonths(today, 12);
        break;
      case "year":
        startDate = new Date(year, 0, 1); // January 1st of selected year
        break;
      default:
        startDate = subMonths(today, 6);
    }
    
    // Filter records based on date and create chart data points
    const filteredRecords = timeRange === "year"
      ? trackingData.filter(record => getYear(new Date(record.trackingMonth)) === year)
      : trackingData.filter(record => {
          const recordDate = new Date(record.trackingMonth);
          return recordDate >= startDate && recordDate <= today;
        });
    
    // Group by month (in case there are multiple records per month)
    const monthlyData = new Map<string, { actual: number, projected: number, count: number }>();
    
    filteredRecords.forEach(record => {
      const monthKey = format(new Date(record.trackingMonth), "yyyy-MM");
      const existing = monthlyData.get(monthKey) || { actual: 0, projected: 0, count: 0 };
      
      monthlyData.set(monthKey, {
        actual: existing.actual + (record.actualRevenue || 0),
        projected: existing.projected + (record.projectedRevenue || 0),
        count: existing.count + 1
      });
    });
    
    // Convert to array and sort by date
    return Array.from(monthlyData.entries())
      .map(([monthKey, data]) => {
        const date = parseISO(monthKey + "-01"); // Convert to date object
        return {
          date: monthKey,
          month: format(date, "MMM yyyy"),
          actualRevenue: Math.round(data.actual / data.count), // Average if multiple records
          projectedRevenue: Math.round(data.projected / data.count)
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [trackingData, timeRange, year]);
  
  // Generate available years from tracking data
  const availableYears = useMemo(() => {
    if (!trackingData || trackingData.length === 0) {
      return [new Date().getFullYear()];
    }
    
    const years = new Set<number>();
    trackingData.forEach(record => {
      years.add(getYear(new Date(record.trackingMonth)));
    });
    
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [trackingData]);
  
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(value);
  };
  
  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-md shadow-sm">
          <p className="font-medium">{data.month}</p>
          <p className="text-sm text-gray-600">
            <span className="inline-block w-3 h-3 bg-[#FF5F00] mr-1 rounded-sm"></span>
            Actual: {formatCurrency(data.actualRevenue)}
          </p>
          <p className="text-sm text-gray-600">
            <span className="inline-block w-3 h-3 bg-[#1A1F71] mr-1 rounded-sm"></span>
            Projected: {formatCurrency(data.projectedRevenue)}
          </p>
          {data.actualRevenue !== 0 && data.projectedRevenue !== 0 && (
            <p className="text-xs mt-1 font-medium">
              {data.actualRevenue >= data.projectedRevenue 
                ? "✓ On target" 
                : data.actualRevenue >= data.projectedRevenue * 0.75
                  ? "⚠ Below target"
                  : "⚠ Needs attention"
              }
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // Show error message if there was an error
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error loading chart data</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              The tracking data feature is currently being updated. Please check back later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show empty state if no data
  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No data available</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              There is no tracking data available for the selected period. Try selecting a different time range or add new tracking records.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex gap-2">
          {timeRange === "year" && (
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
            >
              <SelectTrigger className="w-[115px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="last12months">Last 12 Months</SelectItem>
              <SelectItem value="year">Full Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="actualRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={THEME.primary} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="projectedRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={THEME.dark} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={THEME.dark} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => value === "actualRevenue" ? "Actual Revenue" : "Projected Revenue"}
              />
              <Area
                type="monotone"
                dataKey="projectedRevenue"
                stroke={THEME.dark}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#projectedRevenue)"
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="actualRevenue"
                stroke={THEME.primary}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#actualRevenue)"
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 text-xs text-muted-foreground">
          <p>
            Data shown is based on monthly tracking records {timeRange === "year" ? `for ${year}` : "for the selected period"}
          </p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#FF5F00] mr-1"></div>
              <span>Actual</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#1A1F71] mr-1"></div>
              <span>Projected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}