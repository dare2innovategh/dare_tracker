import React from 'react';
import { useBusinessesByDistrict } from '@/hooks/use-businesses';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Calendar, Phone, MapPin, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from 'date-fns';

interface DistrictBusinessesSectionProps {
  district: string;
}

const DistrictBusinessesSection: React.FC<DistrictBusinessesSectionProps> = ({ district }) => {
  const { data: businesses, isLoading, error } = useBusinessesByDistrict(district);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full rounded-md" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading businesses: {error.message}</div>;
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-lg font-medium">No Businesses Yet</h3>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          There are no businesses registered in this district yet. Check back later or contact the district mentor for more information.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{business.businessName}</CardTitle>
              <Badge variant={
                business.dareModel === 'Collaborative' ? 'default' :
                business.dareModel === 'MakerSpace' ? 'secondary' : 'outline'
              }>
                {business.dareModel}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-1 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {business.businessLocation || 'Location not specified'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm line-clamp-3 mb-3">
              {business.businessDescription || 'No description available.'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>{business.businessContact || 'No contact info'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {business.businessStartDate 
                    ? `Started ${formatDistance(new Date(business.businessStartDate), new Date(), { addSuffix: true })}` 
                    : 'Start date not set'}
                </span>
              </div>
              <div className="flex items-center gap-1 col-span-2">
                <Users className="h-3.5 w-3.5" />
                <span>Multiple youth participants</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" size="sm">
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default DistrictBusinessesSection;