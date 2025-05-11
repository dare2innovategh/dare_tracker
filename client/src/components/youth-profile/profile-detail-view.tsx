import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Briefcase, 
  Laptop, 
  UserCheck, 
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Users,
  CheckCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { YouthProfile, Education, YouthTraining, TrainingProgram } from "@shared/schema";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

interface ProfileDetailViewProps {
  profile: YouthProfile;
  education?: Education[];
  trainings?: (YouthTraining & { program: TrainingProgram })[];
  skills?: any[];
  certifications?: any[];
  portfolioProjects?: any[];
  socialLinks?: any[];
}

export default function ProfileDetailView({ 
  profile, 
  education = [], 
  trainings = []
}: ProfileDetailViewProps) {
  
  // Calculate age from year of birth if not directly provided
  const calculateAge = () => {
    if (profile.age) return profile.age;
    if (profile.yearOfBirth) {
      const currentYear = new Date().getFullYear();
      return currentYear - profile.yearOfBirth;
    }
    return null;
  };
  
  const age = calculateAge();
  
  // Get highest education
  const highestEducation = education.find(e => e.isHighestQualification === true) || education[0];
  
  return (
    <div className="space-y-6">
      {/* Basic Personal Information */}
      <Card className="shadow-md border border-gray-200 overflow-hidden">
        <div className="h-1.5 w-full" style={{ 
          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
        }}></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: THEME.dark }}>
            <User className="h-5 w-5" style={{ color: THEME.primary }} />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column with photo and basic contact info */}
            <div className="w-full lg:w-1/4 flex flex-col items-center">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-2 border-gray-100 shadow-md">
                <AvatarImage src={profile.profilePicture || ""} alt={profile.fullName} />
                <AvatarFallback className="text-2xl bg-blue-50 text-blue-700">
                  {profile.fullName?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="mt-4 text-center w-full">
                <h3 className="font-semibold text-lg">{profile.fullName}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {profile.participantCode ? `ID: ${profile.participantCode}` : 'No ID Assigned'}
                </p>
                
                <div className="mt-3">
                  <Badge 
                    variant="outline" 
                    className="bg-blue-50 border-blue-200"
                    style={{ color: THEME.dark }}
                  >
                    {profile.district || 'Unknown District'}
                  </Badge>
                </div>
                
                <div className="mt-4 flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <Phone className="h-3 w-3 mr-2 text-gray-400" />
                    {profile.phoneNumber || "No phone number"}
                  </div>
                  
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <Mail className="h-3 w-3 mr-2 text-gray-400" />
                    {profile.email || "No email address"}
                  </div>

                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                    {profile.town || "No town specified"}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column with personal details in a grid */}
            <div className="w-full lg:w-3/4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex gap-2">
                  <div className="font-medium text-gray-500 min-w-32">Gender:</div>
                  <div>{profile.gender || "Not specified"}</div>
                </div>
                
                <div className="flex gap-2">
                  <div className="font-medium text-gray-500 min-w-32">Age:</div>
                  <div>{age ? `${age} years` : "Not specified"}</div>
                </div>
                
                <div className="flex gap-2">
                  <div className="font-medium text-gray-500 min-w-32">Year of Birth:</div>
                  <div>{profile.yearOfBirth || "Not specified"}</div>
                </div>
                
                <div className="flex gap-2">
                  <div className="font-medium text-gray-500 min-w-32">Marital Status:</div>
                  <div>{profile.maritalStatus || "Not specified"}</div>
                </div>
                
                <div className="flex gap-2">
                  <div className="font-medium text-gray-500 min-w-32">Children:</div>
                  <div>{(profile.childrenCount !== null && profile.childrenCount !== undefined) ? profile.childrenCount : "Not specified"}</div>
                </div>
                
                <div className="flex gap-2">
                  <div className="font-medium text-gray-500 min-w-32">Age Group:</div>
                  <div>{profile.ageGroup || "Not specified"}</div>
                </div>
                
                <div className="flex gap-2">
                  <div className="font-medium text-gray-500 min-w-32">Dependents:</div>
                  <div>{profile.dependents || "Not specified"}</div>
                </div>
                
                <div className="flex gap-2">
                  <div className="font-medium text-gray-500 min-w-32">National ID:</div>
                  <div>{profile.nationalId || "Not specified"}</div>
                </div>
                
                <div className="flex gap-2">
                  <div className="font-medium text-gray-500 min-w-32">PWD Status:</div>
                  <div>{profile.pwdStatus || "Not specified"}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Guarantor Information */}
      <Card className="shadow-md border border-gray-200 overflow-hidden">
        <div className="h-1.5 w-full" style={{ 
          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
        }}></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: THEME.dark }}>
            <UserCheck className="h-5 w-5" style={{ color: THEME.primary }} />
            Guarantor Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Guarantor Name:</div>
              <div>{profile.guarantor || "Not specified"}</div>
            </div>
            
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Guarantor Phone:</div>
              <div>{profile.guarantorPhone || "Not specified"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Education Background */}
      <Card className="shadow-md border border-gray-200 overflow-hidden">
        <div className="h-1.5 w-full" style={{ 
          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
        }}></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: THEME.dark }}>
            <GraduationCap className="h-5 w-5" style={{ color: THEME.primary }} />
            Education Background
          </CardTitle>
        </CardHeader>
        <CardContent>
          {highestEducation ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex gap-2">
                <div className="font-medium text-gray-500 min-w-32">Qualification:</div>
                <div>{highestEducation.qualificationName || "Not specified"}</div>
              </div>
              
              <div className="flex gap-2">
                <div className="font-medium text-gray-500 min-w-32">Specialization:</div>
                <div>{highestEducation.specialization || "Not specified"}</div>
              </div>
              
              <div className="flex gap-2">
                <div className="font-medium text-gray-500 min-w-32">Institution:</div>
                <div>{highestEducation.institution || "Not specified"}</div>
              </div>
              
              <div className="flex gap-2">
                <div className="font-medium text-gray-500 min-w-32">Year:</div>
                <div>{highestEducation.graduationYear || "Not specified"}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex gap-2">
                <div className="font-medium text-gray-500 min-w-32">Education Level:</div>
                <div>{profile.educationLevel || "Not specified"}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Professional Background */}
      <Card className="shadow-md border border-gray-200 overflow-hidden">
        <div className="h-1.5 w-full" style={{ 
          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
        }}></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: THEME.dark }}>
            <Briefcase className="h-5 w-5" style={{ color: THEME.primary }} />
            Professional Background
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Years of Experience:</div>
              <div>{(profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined) ? profile.yearsOfExperience : "Not specified"}</div>
            </div>
            
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Employment Status:</div>
              <div>{profile.employmentStatus || "Not specified"}</div>
            </div>
            
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Specific Job:</div>
              <div>{profile.specificJob || "Not specified"}</div>
            </div>
            
            <div className="flex gap-2 sm:col-span-2">
              <div className="font-medium text-gray-500 min-w-32">Industry Expertise:</div>
              <div>{profile.industryExpertise || "Not specified"}</div>
            </div>
            
            <div className="flex gap-2 sm:col-span-2">
              <div className="font-medium text-gray-500 min-w-32">Work History:</div>
              <div className="break-words">
                {profile.workHistory 
                  ? (typeof profile.workHistory === 'string' 
                      ? profile.workHistory 
                      : JSON.stringify(profile.workHistory)) 
                  : "Not specified"}
              </div>
            </div>
            
            <div className="flex gap-2 sm:col-span-2">
              <div className="font-medium text-gray-500 min-w-32">Languages Spoken:</div>
              <div className="break-words">
                {profile.languagesSpoken 
                  ? (typeof profile.languagesSpoken === 'string' 
                      ? profile.languagesSpoken 
                      : JSON.stringify(profile.languagesSpoken)) 
                  : "Not specified"}
              </div>
            </div>
            
            <div className="flex gap-2 sm:col-span-2">
              <div className="font-medium text-gray-500 min-w-32">Communication Style:</div>
              <div>{profile.communicationStyle || "Not specified"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Digital & Financial */}
      <Card className="shadow-md border border-gray-200 overflow-hidden">
        <div className="h-1.5 w-full" style={{ 
          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
        }}></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: THEME.dark }}>
            <Laptop className="h-5 w-5" style={{ color: THEME.primary }} />
            Digital & Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex gap-2 sm:col-span-2">
              <div className="font-medium text-gray-500 min-w-32">Digital Skills:</div>
              <div>{profile.digitalSkills || "Not specified"}</div>
            </div>
            
            <div className="flex gap-2 sm:col-span-2">
              <div className="font-medium text-gray-500 min-w-32">Additional Digital Skills:</div>
              <div>{profile.digitalSkills2 || "Not specified"}</div>
            </div>
            
            <div className="flex gap-2 sm:col-span-2">
              <div className="font-medium text-gray-500 min-w-32">Financial Aspirations:</div>
              <div>{profile.financialAspirations || "Not specified"}</div>
            </div>
            
            <div className="flex gap-2 sm:col-span-2">
              <div className="font-medium text-gray-500 min-w-32">Business Interest:</div>
              <div>{profile.businessInterest || "Not specified"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Training & Program Status */}
      <Card className="shadow-md border border-gray-200 overflow-hidden">
        <div className="h-1.5 w-full" style={{ 
          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
        }}></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: THEME.dark }}>
            <UserCheck className="h-5 w-5" style={{ color: THEME.primary }} />
            DARE Program Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Training Status:</div>
              <div>
                {profile.trainingStatus ? (
                  <Badge className={`
                    ${profile.trainingStatus === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' : 
                      profile.trainingStatus === 'In Progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                      profile.trainingStatus === 'Dropped' ? 'bg-red-100 text-red-800 border-red-200' : 
                      'bg-gray-100 text-gray-800 border-gray-200'}
                  `}>
                    {profile.trainingStatus}
                  </Badge>
                ) : (
                  <span>Not specified</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Program Status:</div>
              <div>
                {profile.programStatus ? (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {profile.programStatus}
                  </Badge>
                ) : (
                  <span>Not specified</span>
                )}
              </div>
            </div>
          </div>
          
          {trainings.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="mt-2">
                <h3 className="font-medium text-gray-700 mb-2">Training Programs</h3>
                <div className="grid grid-cols-1 gap-2">
                  {trainings.map((training: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <CheckCircle className={`h-4 w-4 mr-2 ${
                          training.status === 'Completed' ? 'text-green-500' : 
                          training.status === 'In Progress' ? 'text-yellow-500' : 'text-gray-400'
                        }`} />
                        <span>{training.program?.programName || 'Unknown Program'}</span>
                      </div>
                      <Badge className={`
                        ${training.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' : 
                          training.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                          training.status === 'Dropped' ? 'bg-red-100 text-red-800 border-red-200' : 
                          'bg-gray-100 text-gray-800 border-gray-200'}
                      `}>
                        {training.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Apprenticeship/Madam Information */}
      <Card className="shadow-md border border-gray-200 overflow-hidden">
        <div className="h-1.5 w-full" style={{ 
          background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
        }}></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: THEME.dark }}>
            <Users className="h-5 w-5" style={{ color: THEME.primary }} />
            Apprenticeship Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Is Madam:</div>
              <div>{profile.isMadam !== null && profile.isMadam !== undefined ? (profile.isMadam ? 'Yes' : 'No') : 'Not specified'}</div>
            </div>
            
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Is Apprentice:</div>
              <div>{profile.isApprentice !== null && profile.isApprentice !== undefined ? (profile.isApprentice ? 'Yes' : 'No') : 'Not specified'}</div>
            </div>
            
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Madam Name:</div>
              <div>{profile.madamName || 'Not specified'}</div>
            </div>
            
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Madam Phone:</div>
              <div>{profile.madamPhone || 'Not specified'}</div>
            </div>
            
            <div className="flex gap-2 sm:col-span-2">
              <div className="font-medium text-gray-500 min-w-32">Apprentice Names:</div>
              <div className="break-words">
                {profile.apprenticeNames 
                  ? (typeof profile.apprenticeNames === 'string' 
                      ? profile.apprenticeNames 
                      : JSON.stringify(profile.apprenticeNames)) 
                  : "Not specified"}
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="font-medium text-gray-500 min-w-32">Apprentice Phone:</div>
              <div>{profile.apprenticePhone || 'Not specified'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}