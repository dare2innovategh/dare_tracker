import React, { useState } from "react";
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
  CheckCircle,
  Award,
  Heart,
  Building,
  Globe,
  BookOpen
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { YouthProfile, Education, YouthTraining, TrainingProgram } from "@shared/schema";
import CertificationManager from "./fixed-certification-manager";
import { format } from "date-fns";

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

// Component to display a field with label and value
const ProfileField = ({ label, value, colSpan = 1 }: { label: string, value: React.ReactNode, colSpan?: number }) => (
  <div className={`flex flex-col gap-1 ${colSpan > 1 ? 'sm:col-span-' + colSpan : ''}`}>
    <div className="font-medium text-gray-500">{label}:</div>
    <div className="text-gray-700 break-words">{value || "Not specified"}</div>
  </div>
);

// Profile card component for better organization
const ProfileCard = ({ 
  title, 
  icon, 
  children, 
  className = "",
  colSpan = 1,
  rowSpan = 1
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) => (
  <Card className={`shadow-md border border-gray-200 overflow-hidden h-full ${className}`} style={{
    gridColumn: `span ${colSpan}`,
    gridRow: `span ${rowSpan}`
  }}>
    <div className="h-1.5 w-full" style={{ 
      background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.primary}, ${THEME.accent})`
    }}></div>
    <CardHeader className="pb-2">
      <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: THEME.dark }}>
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

// Helper function to format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), "PPP");
  } catch (e) {
    return dateString;
  }
};

// Helper function to parse JSON if needed
const parseJsonField = (field: any) => {
  if (!field) return null;
  
  if (typeof field === 'string') {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(field);
      
      if (Array.isArray(parsed)) {
        return parsed.join(", ");
      } else if (typeof parsed === 'object') {
        // For objects like emergencyContact
        return Object.entries(parsed)
          .filter(([_, value]) => value) // Filter out empty values
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
      }
      
      return field;
    } catch (e) {
      // Not valid JSON, return as is
      return field;
    }
  }
  
  if (Array.isArray(field)) {
    return field.join(", ");
  }
  
  if (typeof field === 'object' && field !== null) {
    return JSON.stringify(field);
  }
  
  return field;
};

export default function ProfileDetailView({ 
  profile, 
}: ProfileDetailViewProps) {
  
  const [, navigate] = useLocation();
  
  // Parse JSON fields
  const emergencyContact = parseJsonField(profile.emergencyContact);
  const languagesSpoken = parseJsonField(profile.languagesSpoken);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Personal Information */}
      <ProfileCard 
        title="Personal Information" 
        icon={<User className="h-5 w-5" style={{ color: THEME.primary }} />}
        colSpan={1} 
        rowSpan={2}
        className="col-span-1 md:col-span-1"
      >
        <div className="flex flex-col items-center mb-6">
          <Avatar 
            className="h-32 w-32 md:h-40 md:w-40 border-2 border-gray-100 shadow-md overflow-hidden"
            style={{
              borderRadius: '50%', // Ensure perfect circle
              position: 'relative' // For proper positioning of the image
            }}
          >
            {profile.profilePicture ? (
          <AvatarImage 
                src={profile.profilePicture || ""} 
                alt={profile.fullName}
                className="object-cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 30%', // Position toward top for better face framing
                  transform: 'scale(1.02)', // Slight scale to avoid potential white edges
                }}
                loading="eager" // Prioritize loading
              />
            ) : (
              <AvatarFallback 
                className="text-2xl bg-blue-50 text-blue-700 flex items-center justify-center"
                style={{
                  width: '100%',
                  height: '100%'
                }}
              >
                {profile.fullName?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            )}
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
        
        <Separator className="my-4" />
        
        <div className="space-y-4">
          <ProfileField label="First Name" value={profile.firstName} />
          <ProfileField label="Middle Name" value={profile.middleName} />
          <ProfileField label="Last Name" value={profile.lastName} />
          <ProfileField label="Preferred Name" value={profile.preferredName} />
          <ProfileField label="Gender" value={profile.gender} />
          <ProfileField label="Date of Birth" value={formatDate(profile.dateOfBirth as string)} />
          <ProfileField label="Age" value={profile.age} />
          <ProfileField label="Age Group" value={profile.ageGroup} />
          <ProfileField label="Marital Status" value={profile.maritalStatus} />
          <ProfileField label="Children Count" value={profile.childrenCount} />
          <ProfileField label="Dependents" value={profile.dependents} />
          <ProfileField label="National ID" value={profile.nationalId} />
          <ProfileField label="PWD Status" value={profile.pwdStatus} />
        </div>
      </ProfileCard>
      
      {/* Contact Information */}
      <ProfileCard 
        title="Contact Information" 
        icon={<Phone className="h-5 w-5" style={{ color: THEME.primary }} />}
        colSpan={1}
        className="col-span-1 md:col-span-1 lg:col-span-1"
      >
        <div className="space-y-4">
          <ProfileField label="District" value={profile.district} />
          <ProfileField label="Town" value={profile.town} />
          <ProfileField label="Home Address" value={profile.homeAddress} />
          <ProfileField label="Country" value={profile.country} />
          {/* <ProfileField label="Admin Level 1" value={profile.adminLevel1} />
          <ProfileField label="Admin Level 2" value={profile.adminLevel2} />
          <ProfileField label="Admin Level 3" value={profile.adminLevel3} />
          <ProfileField label="Admin Level 4" value={profile.adminLevel4} />
          <ProfileField label="Admin Level 5" value={profile.adminLevel5} /> */}
          <ProfileField label="Phone Number" value={profile.phoneNumber} />
          {/* <ProfileField label="Additional Phone 1" value={profile.additionalPhoneNumber1} />
          <ProfileField label="Additional Phone 2" value={profile.additionalPhoneNumber2} /> */}
          <ProfileField label="Email" value={profile.email} />
        </div>
      </ProfileCard>
      
      {/* Emergency Contact */}
      <ProfileCard 
        title="Emergency Contact" 
        icon={<Heart className="h-5 w-5" style={{ color: THEME.primary }} />}
        colSpan={1}
        className="col-span-1"
      >
        <div className="space-y-4">
          <ProfileField label="Name" value={emergencyContact?.name || 
            (typeof emergencyContact === 'string' ? emergencyContact : null)} />
          {/* <ProfileField label="Relationship" value={emergencyContact?.relation} />
          <ProfileField label="Phone" value={emergencyContact?.phone} />
          <ProfileField label="Email" value={emergencyContact?.email} />
          <ProfileField label="Address" value={emergencyContact?.address} /> */}
        </div>
      </ProfileCard>
      
      {/* Education */}
      <ProfileCard 
        title="Education" 
        icon={<GraduationCap className="h-5 w-5" style={{ color: THEME.primary }} />}
        colSpan={1}
        className="col-span-1"
      >
        <div className="space-y-4">
          <ProfileField label="Highest Education Level" value={profile.highestEducationLevel} />
          <ProfileField 
            label="Active Student" 
            value={profile.activeStudentStatus !== null && profile.activeStudentStatus !== undefined ? 
              (profile.activeStudentStatus ? 'Yes' : 'No') : null} 
          />
        </div>
      </ProfileCard>
      
      {/* Skills */}
      <ProfileCard 
        title="Skills & Experience" 
        icon={<BookOpen className="h-5 w-5" style={{ color: THEME.primary }} />}
        colSpan={1}
        className="col-span-1 lg:col-span-2"
      >
        <div className="space-y-4">
          <ProfileField label="Core Skills" value={profile.coreSkills} />
          <ProfileField label="Skill Level" value={profile.skillLevel} />
          <ProfileField label="Skills Trainer's Name" value={profile.madamName} />
          <ProfileField label="Skills Trainer's Phone" value={profile.madamPhone} />
          <ProfileField label="Years of Experience" value={profile.yearsOfExperience} />
          <ProfileField label="Industry Expertise" value={profile.industryExpertise} />
          <ProfileField label="Work History" value={profile.workHistory} />
          <ProfileField label="Languages Spoken" value={languagesSpoken} />
          <ProfileField label="Communication Style" value={profile.communicationStyle} />
          <ProfileField label="Digital Skills" value={profile.digitalSkills} />
          <ProfileField label="Digital Skills 2" value={profile.digitalSkills2} />
          <ProfileField label="Financial Aspirations" value={profile.financialAspirations} />
        </div>
      </ProfileCard>
      
      {/* Program Information */}
      <ProfileCard 
        title="Program Information" 
        icon={<Briefcase className="h-5 w-5" style={{ color: THEME.primary }} />}
        colSpan={1}
        className="col-span-1 md:col-span-1 lg:col-span-1"
      >
        <div className="space-y-4">
          <ProfileField label="Employment Status" value={profile.employmentStatus} />
          <ProfileField label="Employment Type" value={profile.employmentType} />
          {/* <ProfileField label="Specific Job" value={profile.specificJob} /> */}
          <ProfileField label="Business Interest" value={profile.businessInterest} />
          
          <ProfileField 
            label="Training Status" 
            value={
              profile.trainingStatus ? (
                <Badge className={`
                  ${profile.trainingStatus === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' : 
                    profile.trainingStatus === 'In Progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                    profile.trainingStatus === 'Dropped' ? 'bg-red-100 text-red-800 border-red-200' : 
                    'bg-gray-100 text-gray-800 border-gray-200'}
                `}>
                  {profile.trainingStatus}
                </Badge>
              ) : "Not specified"
            } 
          />
          
          <ProfileField 
            label="Program Status" 
            value={
              profile.programStatus ? (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  {profile.programStatus}
                </Badge>
              ) : "Not specified"
            } 
          />
          
          <ProfileField label="Transition Status" value={profile.transitionStatus} />
          
          <ProfileField 
            label="Onboarded to Tracker" 
            value={profile.onboardedToTracker !== null && profile.onboardedToTracker !== undefined ? 
              (profile.onboardedToTracker ? 'Yes' : 'No') : null} 
          />
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button 
            variant="outline"
            className="w-full flex items-center justify-center gap-2 mt-2 text-xs sm:text-sm"
            style={{ 
              borderColor: THEME.primary,
              color: THEME.dark
            }}
            onClick={() => navigate(`/businesses/youth/${profile.id}`)}
          >
            <Users className="h-4 w-4" style={{ color: THEME.primary }} />
            <span className="hidden xs:inline">View Associated Businesses</span>
            <span className="xs:hidden">View Businesses</span>
          </Button>
        </div>
      </ProfileCard>
      
      {/* Guide & Guarantor Information */}
      <ProfileCard 
        title="Guide & Guarantor Information" 
        icon={<UserCheck className="h-5 w-5" style={{ color: THEME.primary }} />}
        colSpan={1}
        className="col-span-1 md:col-span-1 lg:col-span-1"
      >
        <div className="space-y-4">
          <ProfileField label="Local Hub Guide Name" value={profile.localMentorName} />
          <ProfileField label="Local Hub Guide Contact" value={profile.localMentorContact} />
          <ProfileField label="Guarantor Name" value={profile.guarantor} />
          <ProfileField label="Guarantor Phone" value={profile.guarantorPhone} />
        </div>
      </ProfileCard>
      
      {/* Partner Program Details */}
      <ProfileCard 
        title="Partner Program Details" 
        icon={<Building className="h-5 w-5" style={{ color: THEME.primary }} />}
        colSpan={1}
        className="col-span-1 md:col-span-1 lg:col-span-2"
      >
        <div className="space-y-4">
          <ProfileField label="DARE Model" value={profile.dareModel} />
          <ProfileField label="Implementing Partner" value={profile.implementingPartnerName} />
          <ProfileField label="Program Name" value={profile.programName} />
          <ProfileField 
            label="Refugee Status" 
            value={profile.refugeeStatus !== null && profile.refugeeStatus !== undefined ? 
              (profile.refugeeStatus ? 'Yes' : 'No') : null} 
          />
          <ProfileField 
            label="IDP Status" 
            value={profile.idpStatus !== null && profile.idpStatus !== undefined ? 
              (profile.idpStatus ? 'Yes' : 'No') : null} 
          />
          <ProfileField 
            label="Community Hosts Refugees" 
            value={profile.communityHostsRefugees !== null && profile.communityHostsRefugees !== undefined ? 
              (profile.communityHostsRefugees ? 'Yes' : 'No') : null} 
          />
          <ProfileField label="Partner Start Date" value={formatDate(profile.partnerStartDate as string)} />
          <ProfileField label="Program Details" value={profile.programDetails} />
          <ProfileField label="Program Contact Person" value={profile.programContactPerson} />
          <ProfileField label="Program Contact Phone" value={profile.programContactPhoneNumber} />
          <ProfileField label="Cohort" value={profile.cohort} />
          <ProfileField label="Host Community Status" value={profile.hostCommunityStatus} />
        </div>
      </ProfileCard>
      
      {/* Certifications (if you still want to include this) */}
      <ProfileCard 
        title="Certifications & Credentials" 
        icon={<Award className="h-5 w-5" style={{ color: THEME.primary }} />}
        colSpan={1}
        className="col-span-1 lg:col-span-3"
      >
        <CertificationManager youthId={profile.id} />
      </ProfileCard>
    </div>
  );
}