import { useQuery } from "@tanstack/react-query";
import { YouthProfile } from "@shared/schema";
import { Link } from "wouter";
import { Loader2, Edit, BarChart2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrainingSection } from "./training-section-fixed";
import { CertificationsSection } from "./certifications-section";
import { EducationSection } from "./education-section-new";

interface ProfileViewProps {
  profileId: number;
}

export default function ProfileView({ profileId }: ProfileViewProps) {
  const { data: profile, isLoading, error } = useQuery<YouthProfile>({
    queryKey: [`/api/youth/profiles/${profileId}`],
  });
  
  // Check if the user is an admin to enable editing
  const { data: currentUser } = useQuery<{ id: number, username: string }>({
    queryKey: ["/api/user"],
  });
  
  // Allow editing if user is admin or if viewing their own profile
  const canEdit = Boolean(currentUser && (
    currentUser.username === "admin" || 
    currentUser.id === profile?.userId
  ));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading profile: {error.message}</p>
            <Button asChild className="mt-4">
              <Link href="/youth/profiles">Back to Profiles</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <p>Profile not found</p>
            <Button asChild className="mt-4">
              <Link href="/youth/profiles">Back to Profiles</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to format array data
  const formatArray = (data: any): string => {
    if (!data) return 'None';
    if (Array.isArray(data)) return data.join(', ');
    return String(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              ID: {profile.participantCode || 'N/A'}
            </Badge>
            <p className="text-sm text-gray-500">{profile.district} district, {profile.town || 'No town specified'}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/youth/profiles/${profile.id}/businesses`}>
            <Button variant="outline" size="sm">
              <BarChart2 className="mr-2 h-4 w-4" />
              <span>Businesses</span>
            </Button>
          </Link>
          <Link href={`/youth/profiles/${profile.id}/edit`}>
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Personal info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profile.profilePicture || undefined} alt={profile.fullName} />
                  <AvatarFallback className="text-2xl">{profile.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-medium text-center">{profile.fullName}</h3>
                {(profile.phoneNumber || profile.email) && (
                  <p className="text-sm text-gray-500 text-center">
                    {profile.phoneNumber && profile.phoneNumber}
                    {profile.phoneNumber && profile.email && ' • '}
                    {profile.email && profile.email}
                  </p>
                )}
                <div className="mt-1">
                  <Badge variant="outline" className="mr-1">
                    {profile.participantCode ? `ID: ${profile.participantCode}` : 'No ID'}
                  </Badge>
                  {profile.nationalId && (
                    <Badge variant="outline">
                      Ghana Card: {profile.nationalId}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">District</p>
                  <p>{profile.district}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Town</p>
                  <p>{profile.town || 'Not specified'}</p>
                </div>
                
                <Separator className="my-3" />
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p>{profile.gender || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Marital Status</p>
                  <p>{profile.maritalStatus || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Age</p>
                  <p>{profile.age ? `${profile.age} years` : (profile.yearOfBirth ? `Born ${profile.yearOfBirth}` : 'Not specified')}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Age Group</p>
                  <p>{profile.ageGroup || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Children</p>
                  <p>{profile.childrenCount !== undefined ? profile.childrenCount : 'Not specified'}</p>
                </div>
                
                {profile.dependents && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dependents</p>
                    <p>{profile.dependents}</p>
                  </div>
                )}
                
                {profile.pwdStatus && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Disability Status</p>
                    <p>{profile.pwdStatus}</p>
                  </div>
                )}
                
                <Separator className="my-3" />
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Languages Spoken</p>
                  <p>{formatArray(profile.languagesSpoken)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Communication Style</p>
                  <p>{profile.communicationStyle || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Skill Level</p>
                  <Badge variant="outline" className="mt-1">{profile.skillLevel || 'Not specified'}</Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Industry Expertise</p>
                  <p>{profile.industryExpertise || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Skills</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {/* We now display skills from the youth_skills relationship, not directly from profile */}
                    <span className="text-gray-500">
                      View skills in the Skills section below
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Middle column - Associated Businesses */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Associated Businesses</CardTitle>
              <CardDescription>Businesses this youth participates in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <p className="text-center text-gray-500">
                  View all businesses associated with this youth profile
                </p>
                
                <Link href={`/youth/profiles/${profile.id}/businesses`}>
                  <Button className="w-full">
                    View Associated Businesses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
        </div>
        
        {/* Right column - Experience and professional information */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Professional Background</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Years of Experience</p>
                  <p>{profile.yearsOfExperience || '0'} years</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Work History/Previous Clients</p>
                  {Array.isArray(profile.workHistory) && profile.workHistory.length > 0 ? (
                    <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                      {profile.workHistory.map((history, index) => (
                        <li key={index}>{history}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No work history</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Digital & Financial Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Digital Skills (Primary)</p>
                  <p>{profile.digitalSkills || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Digital Skills (Secondary)</p>
                  <p>{profile.digitalSkills2 || 'Not specified'}</p>
                </div>
                
                {profile.financialAspirations && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Financial Aspirations</p>
                    <p className="whitespace-pre-line">{profile.financialAspirations}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Guarantor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Guarantor Name</p>
                  <p>{profile.guarantor || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Guarantor Phone</p>
                  <p>{profile.guarantorPhone || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>DARE Program Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* DARE Model removed as requested - now only tracked at business level */}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Employment Status</p>
                  <p>{profile.employmentStatus || 'Not specified'}</p>
                </div>
                
                {profile.specificJob && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Specific Job/Role</p>
                    <p>{profile.specificJob}</p>
                  </div>
                )}
                
                {profile.businessInterest && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Interest</p>
                    <p>{profile.businessInterest}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Training Status</p>
                  <p>{profile.trainingStatus || 'Not specified'}</p>
                </div>
                
                {profile.programStatus && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Program Status</p>
                    <p>{profile.programStatus}</p>
                  </div>
                )}
                
                {(profile.isMadam || profile.isApprentice) && (
                  <>
                    <Separator className="my-3" />
                    <h4 className="text-sm font-bold">Madam/Apprentice Information</h4>
                    
                    {profile.isMadam && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Role</p>
                        <Badge>Madam</Badge>
                      </div>
                    )}
                    
                    {profile.isApprentice && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Role</p>
                        <Badge>Apprentice</Badge>
                      </div>
                    )}
                    
                    {profile.isApprentice && profile.madamName && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Supervising Madam</p>
                        <p>{profile.madamName} {profile.madamPhone ? `(${profile.madamPhone})` : ''}</p>
                      </div>
                    )}
                    
                    {profile.isMadam && Array.isArray(profile.apprenticeNames) && profile.apprenticeNames.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Apprentices</p>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                          {profile.apprenticeNames.map((name, index) => (
                            <li key={index}>{name}</li>
                          ))}
                        </ul>
                        {profile.apprenticePhone && (
                          <p className="text-sm text-gray-500 mt-1">Contact: {profile.apprenticePhone}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Education Section */}
          <EducationSection youthId={profile.id} isEditable={canEdit} />
          
          {/* Training Section */}
          <TrainingSection youthId={profile.id} isEditable={canEdit} />
          
          {/* Certifications Section */}
          <CertificationsSection youthId={profile.id} isEditable={canEdit} />
        </div>
      </div>
    </div>
  );
}
