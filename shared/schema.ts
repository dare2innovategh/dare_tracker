import { pgTable, text, serial, integer, boolean, timestamp, json, date, primaryKey, varchar, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Districts and locations
export const districtEnum = z.string().transform(
  (val) => {
    // Normalize by removing ", Ghana" suffix if present
    return val?.replace(", Ghana", "") || "";
  }
).refine(
  (val) => {
    // Validate against our known districts 
    return ["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"].includes(val);
  },
  { message: "District must be one of: Bekwai, Gushegu, Lower Manya Krobo, Yilo Krobo" }
);
export type District = z.infer<typeof districtEnum>;

// Digital Access for Rural Empowerment business models
export const businessModelEnum = z.enum(["Collaborative", "MakerSpace", "Madam Anchor"]);
export type BusinessModel = z.infer<typeof businessModelEnum>;

// Note: Removed unused skill level enum

export const userRoleEnum = z.enum(["admin", "reviewer", "mentor", "mentee", "user", "manager"]);
export type UserRole = z.infer<typeof userRoleEnum>;

// Permission types for role-based access control
export const permissionActionEnum = z.enum(["view", "create", "edit", "update", "delete", "manage"]);
export type PermissionAction = z.infer<typeof permissionActionEnum>;

export const permissionResourceEnum = z.enum([
  // User Management Module
  "users", 
  "roles",
  "permissions",
  
  // Youth Profile Module 
  "youth_profiles",
  "youth_education", 
  "youth_certifications",
  "youth_skills",
  "portfolio",
  "education",
  
  // Business Module
  "businesses", 
  "business_youth",
  "business_makerspace",
  "feasibility_assessment",
  "business_tracking",
  
  // Mentor Module
  "mentors", 
  "mentor_assignments", 
  "mentorship_messages",
  "business_advice",
  
  // Training Module
  "training",
  
  // Dashboard Module
  "dashboard",
  "activities",
  
  // Admin Module
  "reports", 
  "system_settings",
  "diagnostics",
  "uploads",
  
  // System Resources
  "skills",
  "makerspaces",
  "certificates",
  "system",
  "admin_panel"
]);
export type PermissionResource = z.infer<typeof permissionResourceEnum>;

export const trainingStatusEnum = z.enum(["In Progress", "Completed", "Dropped"]);
export type TrainingStatus = z.infer<typeof trainingStatusEnum>;

export const registrationStatusEnum = z.enum(["Registered", "Unregistered"]);
export type RegistrationStatus = z.infer<typeof registrationStatusEnum>;

export const mentorshipFocusEnum = z.enum([
  "Business Growth", 
  "Operations Improvement", 
  "Market Expansion", 
  "Financial Management", 
  "Team Development"
]);
export type MentorshipFocus = z.infer<typeof mentorshipFocusEnum>;

export const meetingFrequencyEnum = z.enum([
  "Weekly", 
  "Bi-weekly", 
  "Monthly", 
  "Quarterly", 
  "As Needed"
]);
export type MeetingFrequency = z.infer<typeof meetingFrequencyEnum>;

export const messageCategoryEnum = z.enum([
  "operations", 
  "marketing", 
  "finance", 
  "management", 
  "strategy", 
  "other"
]);
export type MessageCategory = z.infer<typeof messageCategoryEnum>;

// Service Categories
export const serviceCategoryEnum = z.enum([
  "Building & Construction",
  "Food & Beverage",
  "Fashion & Apparel",
  "Beauty & Wellness",
  "Media & Creative Arts"
]);
export type ServiceCategoryEnum = z.infer<typeof serviceCategoryEnum>;

// Skill level enum for consistent skill evaluation
export const skillProficiencyEnum = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert"
]);
export type SkillProficiency = z.infer<typeof skillProficiencyEnum>;

// Service Categories table
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Service Subcategories table
export const serviceSubcategories = pgTable("service_subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Roles Schema (System roles)
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  isEditable: boolean("is_editable").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Custom Roles Schema (User-created roles)
export const customRoles = pgTable("custom_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by")
});

// Permissions Schema
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  resource: text("resource", { 
    enum: permissionResourceEnum.options
  }).notNull(),
  action: text("action", { 
    enum: permissionActionEnum.options
  }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
}, (table) => {
  return {
    unq: primaryKey({ columns: [table.resource, table.action] })
  };
});

// Role Permissions Schema (Junction table)
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  // Direct fields (matched to actual database structure)
  role: text("role"),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["admin", "reviewer", "mentor", "mentee", "user", "manager"] }).notNull().default("mentee"),
  district: text("district", { enum: ["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"] }),
  profilePicture: text("profile_picture"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Youth Profile Schema
export const youthProfiles = pgTable("youth_profiles", {
  id:                   serial("id").primaryKey(),
  userId:               integer("user_id"),

  // Identification
  participantCode:      text("participant_code"),
  fullName:             text("full_name"),
  preferredName:        text("preferred_name"),
  profilePicture:       text("profile_picture"),

  // Personal Info
  firstName:            text("first_name"),
  middleName:           text("middle_name"),
  lastName:             text("last_name"),
  dateOfBirth:          date("date_of_birth"),
  yearOfBirth:          integer("year_of_birth"),
  age:                  integer("age"),
  ageGroup:             text("age_group"),
  gender:               text("gender"),
  maritalStatus:        text("marital_status"),
  childrenCount:        integer("children_count").default(0),
  dependents:           text("dependents"),
  nationalId:           text("national_id"),
  pwdStatus:            text("pwd_status"),

  // Location & Contact
  district:             text("district", { enum: ["Bekwai","Gushegu","Lower Manya Krobo","Yilo Krobo"] }),
  town:                 text("town"),
  homeAddress:          text("home_address"),
  country:              text("country").default("Ghana"),
  adminLevel1:          text("admin_level_1"),
  adminLevel2:          text("admin_level_2"),
  adminLevel3:          text("admin_level_3"),
  adminLevel4:          text("admin_level_4"),
  adminLevel5:          text("admin_level_5"),
  phoneNumber:          text("phone_number"),
  additionalPhoneNumber1: text("additional_phone_number_1"),
  additionalPhoneNumber2: text("additional_phone_number_2"),
  email:                text("email"),

  // Emergency Contact
  emergencyContact:     json("emergency_contact").default({}),

  // Education & Skills
  highestEducationLevel: text("highest_education_level"),
  activeStudentStatus:   boolean("active_student_status").default(false),
  coreSkills:           text("core_skills"),
  skillLevel:           text("skill_level"),
  industryExpertise:    text("industry_expertise"),
  languagesSpoken:      json("languages_spoken").default([]),
  communicationStyle:   text("communication_style"),
  digitalSkills:        text("digital_skills"),
  digitalSkills2:       text("digital_skills_2"),

  // Portfolio & Work
  yearsOfExperience:    integer("years_of_experience"),
  workHistory:          text("work_history"),

  // Program Participation
  businessInterest:     text("business_interest"),
  employmentStatus:     text("employment_status"),
  specificJob:          text("specific_job"),
  trainingStatus:       text("training_status"),
  programStatus:        text("program_status"),
  transitionStatus:     text("transition_status"),
  onboardedToTracker:   boolean("onboarded_to_tracker").default(false),

  // DARE Model
  dareModel:            text("dare_model", { enum: ["Collaborative","MakerSpace","Madam Anchor"] }),

  // Madam / Apprentice
  madamName:            text("madam_name"),
  madamPhone:           text("madam_phone"),

  // Mentor & Guarantor
  localMentorName:      text("local_mentor_name"),
  localMentorContact:   text("local_mentor_contact"),
  guarantor:            text("guarantor"),
  guarantorPhone:       text("guarantor_phone"),

  // Partner & Refugee Support
  implementingPartnerName: text("implementing_partner_name"),
  refugeeStatus:          boolean("refugee_status").default(false),
  idpStatus:              boolean("idp_status").default(false),
  communityHostsRefugees:  boolean("community_hosts_refugees").default(false),

  // Program Details
  partnerStartDate:       date("partner_start_date"),
  programName:            text("program_name"),
  programDetails:         text("program_details"),
  programContactPerson:   text("program_contact_person"),
  programContactPhoneNumber: text("program_contact_phone_number"),
  cohort: text("cohort"),

  // Flags & Meta
  newDataSubmission:      boolean("new_data_submission").default(false),
  isDeleted:              boolean("is_deleted").default(false),
  hostCommunityStatus:    text("host_community_status"),

  createdAt:             timestamp("created_at").defaultNow(),
  updatedAt:             timestamp("updated_at"),
});


// Business Profiles Schema
export const businessProfiles = pgTable("business_profiles", {
  id:                        serial("id").primaryKey(),
  businessName:              text("business_name"),
  businessLogo:              text("business_logo"),
  district:                  text("district", { enum: ["Bekwai","Gushegu","Lower Manya Krobo","Yilo Krobo"] }),
  businessLocation:          text("business_location"),
  businessContact:           text("business_contact"),
  businessDescription:       text("business_description"),
  businessModel:             text("business_model"),
  dareModel:                 text("dare_model",    { enum: ["Collaborative","MakerSpace","Madam Anchor"] }),
  serviceCategoryId:         integer("service_category_id"),
  serviceSubcategoryId:      integer("service_subcategory_id"),
  businessStartDate:         date("business_start_date"),
  registrationStatus:        text("registration_status", { enum: ["Registered","Unregistered"] }),
  registrationNumber:        text("registration_number"),
  registrationDate:          date("registration_date"),
  businessObjectives:        json("business_objectives"),
  shortTermGoals:            json("short_term_goals"),
  targetMarket:              text("target_market"),
  taxIdentificationNumber:   text("tax_identification_number"),

  // MasterCard fields
  implementingPartnerName:   text("implementing_partner_name"),
  enterpriseUniqueIdentifier:text("enterprise_unique_identifier"),
  enterpriseOwnerYouthIds:   text("enterprise_owner_youth_ids"),
  enterpriseOwnerName:       text("enterprise_owner_name"),
  enterpriseOwnerDob:        date("enterprise_owner_dob"),
  enterpriseOwnerSex:        text("enterprise_owner_sex"),
  enterpriseType:            text("enterprise_type", { enum: ["Sole Proprietorship","Partnership","Limited Liability Company","Cooperative","Social Enterprise","Other"] }),
  enterpriseSize:            text("enterprise_size", { enum: ["Micro","Small","Medium","Large"] }),
  subPartnerNames:           json("sub_partner_names"),
  totalYouthInWorkReported:  integer("total_youth_in_work_reported").default(0),
  youthRefugeeCount:         integer("youth_refugee_count").default(0),
  youthIdpCount:             integer("youth_idp_count").default(0),
  youthHostCommunityCount:   integer("youth_host_community_count").default(0),
  youthPlwdCount:            integer("youth_plwd_count").default(0),
  sector:                    text("sector", { enum: ["Agriculture","Manufacturing","Construction","Retail","Food & Beverage","Fashion & Apparel","Beauty & Wellness","ICT","Creative Arts","Education","Healthcare","Professional Services","Other"] }),
  primaryPhoneNumber:        text("primary_phone_number"),
  additionalPhoneNumber1:    text("additional_phone_number_1"),
  additionalPhoneNumber2:    text("additional_phone_number_2"),
  businessEmail:             text("business_email"),
  country:                   text("country").default("Ghana"),
  adminLevel1:               text("admin_level_1"),
  adminLevel2:               text("admin_level_2"),
  adminLevel3:               text("admin_level_3"),
  adminLevel4:               text("admin_level_4"),
  adminLevel5:               text("admin_level_5"),
  partnerStartDate:          date("partner_start_date"),
  programName:               text("program_name"),
  programDetails:            text("program_details"),
  programContactPerson:      text("program_contact_person"),
  programContactPhoneNumber: text("program_contact_phone_number"),

  // Appendix additions
  deliverySetup:             boolean("delivery_setup").default(false),
  deliveryType:              text("delivery_type"),
  expectedWeeklyRevenue:         integer("expected_weekly_revenue"),
  expectedMonthlyRevenue:        integer("expected_monthly_revenue"),
  anticipatedMonthlyExpenditure: integer("anticipated_monthly_expenditure"),
  expectedMonthlyProfit:         integer("expected_monthly_profit"),
  paymentStructure:          text("payment_structure", { enum: ["Self-Pay","Reinvestment","Savings"] }),
  socialMediaLinks:          text("social_media_links"),

  newDataSubmission:         boolean("new_data_submission").default(false),
  createdAt:                 timestamp("created_at").defaultNow(),
  updatedAt:                 timestamp("updated_at"),
});


// Define the enums used in the routes
export const enterpriseTypeEnum = z.enum([
  "Sole Proprietorship", 
  "Partnership", 
  "Limited Liability Company", 
  "Cooperative", 
  "Social Enterprise", 
  "Other"
]);
export type EnterpriseType = z.infer<typeof enterpriseTypeEnum>;

export const enterpriseSizeEnum = z.enum([
  "Micro", 
  "Small", 
  "Medium", 
  "Large"
]);
export type EnterpriseSize = z.infer<typeof enterpriseSizeEnum>;

export const businessSectorEnum = z.enum([
  "Agriculture",
  "Manufacturing",
  "Construction",
  "Retail",
  "Food & Beverage",
  "Fashion & Apparel",
  "Beauty & Wellness",
  "ICT",
  "Creative Arts",
  "Education",
  "Healthcare",
  "Professional Services",
  "Other",
  "Unemployed",
  "Climate Adaptation & Resilience",
  "Digital Economy",
  "Enterprise/Business Development",
  "Youth Engagement",
  "Refugees & Displaced Populations",
  "Tourism & Hospitality",
  "Innovation",
  "Finance / Financial Services",
  "Information Not Available"
]);

export type BusinessSector = z.infer<typeof businessSectorEnum>;

// Business-Youth Relationship (many-to-many)
export const businessYouthRelationships = pgTable("business_youth_relationships", {
  businessId: integer("business_id").notNull().references(() => businessProfiles.id),
  youthId: integer("youth_id").notNull().references(() => youthProfiles.id),
  role: text("role").notNull().default("Member"), // e.g., "Owner", "Member", "Partner"
  joinDate: date("join_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.businessId, table.youthId] })
  };
});



// Mentors Schema
export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  // Keep original column for backward compatibility but make it nullable
  assignedDistrict: text("assigned_district", { enum: ["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"] }),
  // Add a new column to store multiple districts as JSON array
  assignedDistricts: json("assigned_districts").default([]).notNull(),
  specialization: text("specialization"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Mentor-Business Relationship (many-to-many)
export const mentorBusinessRelationships = pgTable("mentor_business_relationships", {
  mentorId: integer("mentor_id").notNull().references(() => mentors.id),
  businessId: integer("business_id").notNull().references(() => businessProfiles.id),
  assignedDate: date("assigned_date").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  // Additional fields for enhanced mentorship tracking
  mentorshipFocus: text("mentorship_focus", { 
    enum: ["Business Growth", "Operations Improvement", "Market Expansion", "Financial Management", "Team Development"] 
  }),
  meetingFrequency: text("meeting_frequency", { 
    enum: ["Weekly", "Bi-weekly", "Monthly", "Quarterly", "As Needed"]
  }).default("Monthly"),
  lastMeetingDate: date("last_meeting_date"),
  nextMeetingDate: date("next_meeting_date"),
  mentorshipGoals: json("mentorship_goals").default([]),
  mentorshipProgress: text("mentorship_progress"),
  progressRating: integer("progress_rating"), // 1-5 scale
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.mentorId, table.businessId] })
  };
});

// Mentorship Messages Schema - business-focused advice
export const mentorshipMessages = pgTable("mentorship_messages", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => mentors.id),
  businessId: integer("business_id").notNull().references(() => businessProfiles.id),
  message: text("message").notNull(),
  sender: text("sender", { enum: ["mentor", "business"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  // Fields for categorizing business advice
  category: text("category", { enum: ["operations", "marketing", "finance", "management", "strategy", "other"] }),
  isRead: boolean("is_read").default(false)
});

// Business Advice Schema - Structured advice from mentors to businesses
export const businessAdvice = pgTable("business_advice", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => mentors.id),
  businessId: integer("business_id").notNull().references(() => businessProfiles.id),
  adviceContent: text("advice_content").notNull(),
  category: text("category", { 
    enum: ["operations", "marketing", "finance", "management", "strategy", "other"] 
  }).notNull(),
  followUpNotes: text("follow_up_notes"),
  implementationStatus: text("implementation_status", { 
    enum: ["pending", "in_progress", "implemented", "postponed"] 
  }).default("pending"),
  priority: text("priority", { 
    enum: ["high", "medium", "low"] 
  }).default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id)
});

// Skills table - these will be derived from service categories and subcategories
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").references(() => serviceCategories.id),
  subcategoryId: integer("subcategory_id").references(() => serviceSubcategories.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Youth-Skills relationship (many-to-many)
export const youthSkills = pgTable("youth_skills", {
  youthId: integer("youth_id").notNull().references(() => youthProfiles.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  proficiency: text("proficiency", { 
    enum: ["Beginner", "Intermediate", "Advanced", "Expert"] 
  }).default("Intermediate"),
  isPrimary: boolean("is_primary").default(false),
  yearsOfExperience: integer("years_of_experience").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.youthId, table.skillId] })
  };
});

// Education records for youth (updated schema)
// Define qualification status enum
export const qualificationStatusEnum = z.enum(["Completed", "In Progress", "Incomplete"]);
export type QualificationStatus = z.infer<typeof qualificationStatusEnum>;

export const education = pgTable("education", {
  id: serial("id").primaryKey(),
  youthId: integer("youth_id").notNull().references(() => youthProfiles.id),
  qualificationType: text("qualification_type").notNull(), // e.g., 'Highest Academic', 'Professional Certification'
  qualificationName: text("qualification_name").notNull(), // e.g., MSc, BA, Certificate, Diploma
  specialization: text("specialization"), // area of study
  levelCompleted: text("level_completed"), // e.g., MPhil, PhD, Bachelor's, Secondary
  institution: text("institution"), // School/Institution name
  graduationYear: integer("graduation_year"), // Year of graduation
  isHighestQualification: boolean("is_highest_qualification").default(false), // Flag to identify the highest qualification
  certificateUrl: text("certificate_url"), // Optional link to certificate image/document
  qualificationStatus: text("qualification_status", { 
    enum: ["Completed", "In Progress", "Incomplete"] 
  }).default("Completed"),
  additionalDetails: text("additional_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Define relations for education records
export const educationRelations = relations(education, ({ one }) => ({
  youth: one(youthProfiles, {
    fields: [education.youthId],
    references: [youthProfiles.id]
  })
}));

// Certifications for youth
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  youthId: integer("youth_id").notNull().references(() => youthProfiles.id),
  certificationName: text("certification_name").notNull(),
  issuingOrganization: text("issuing_organization"),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  credentialId: text("credential_id"),
  credentialUrl: text("credential_url"),
  skills: json("skills").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Portfolio Projects for youth
export const portfolioProjects = pgTable("portfolio_projects", {
  id: serial("id").primaryKey(),
  youthId: integer("youth_id").notNull().references(() => youthProfiles.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"), // E.g., "Web Development", "Graphic Design"
  client: text("client"), // Client name if applicable
  projectUrl: text("project_url"), // Link to live project
  repositoryUrl: text("repository_url"), // GitHub/GitLab link if applicable
  featuredImage: text("featured_image"), // Main image for the project
  startDate: date("start_date"),
  completionDate: date("completion_date"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  skills: json("skills").default([]), // Array of skills used in the project
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Project Gallery Images
export const projectImages = pgTable("project_images", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => portfolioProjects.id),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

// Testimonials for youth portfolio
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  youthId: integer("youth_id").notNull().references(() => youthProfiles.id),
  projectId: integer("project_id").references(() => portfolioProjects.id), // Optional link to specific project
  clientName: text("client_name").notNull(),
  clientTitle: text("client_title"), // Position/role of the client
  clientCompany: text("client_company"),
  clientImage: text("client_image"), // Profile picture of client
  testimonialText: text("testimonial_text").notNull(),
  rating: integer("rating"), // Rating out of 5
  dateReceived: date("date_received"),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Social Media Portfolio Links
export const socialMediaLinks = pgTable("social_media_links", {
  id: serial("id").primaryKey(),
  youthId: integer("youth_id").notNull().references(() => youthProfiles.id),
  platform: text("platform").notNull(), // E.g., "LinkedIn", "Instagram", "Behance"
  url: text("url").notNull(),
  username: text("username"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Define relations
export const portfolioProjectsRelations = relations(portfolioProjects, ({ one, many }) => ({
  youth: one(youthProfiles, {
    fields: [portfolioProjects.youthId],
    references: [youthProfiles.id]
  }),
  images: many(projectImages),
  testimonials: many(testimonials)
}));

export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(portfolioProjects, {
    fields: [projectImages.projectId],
    references: [portfolioProjects.id]
  })
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  youth: one(youthProfiles, {
    fields: [testimonials.youthId],
    references: [youthProfiles.id]
  }),
  project: one(portfolioProjects, {
    fields: [testimonials.projectId],
    references: [portfolioProjects.id]
  })
}));

export const socialMediaLinksRelations = relations(socialMediaLinks, ({ one }) => ({
  youth: one(youthProfiles, {
    fields: [socialMediaLinks.youthId],
    references: [youthProfiles.id]
  })
}));

// Training program definitions
export const trainingPrograms = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: text("category"),
  totalModules: integer("total_modules").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Define relations for training programs
export const trainingProgramsRelations = relations(trainingPrograms, ({ many }: { many: any }) => ({
  trainings: many(youthTraining)
}));

// Youth training records
export const youthTraining = pgTable("youth_training", {
  id: serial("id").primaryKey(),
  youthId: integer("youth_id").notNull().references(() => youthProfiles.id),
  programId: integer("program_id").notNull().references(() => trainingPrograms.id),
  startDate: date("start_date"),
  completionDate: date("completion_date"),
  status: text("status", { enum: ["In Progress", "Completed", "Dropped"] }).default("In Progress"),
  certificationReceived: boolean("certification_received").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Define relations between tables
export const youthTrainingRelations = relations(youthTraining, ({ one }: { one: any }) => ({
  youth: one(youthProfiles, {
    fields: [youthTraining.youthId],
    references: [youthProfiles.id]
  }),
  program: one(trainingPrograms, {
    fields: [youthTraining.programId],
    references: [trainingPrograms.id]
  })
}));

// Business Tracking Schema - New implementation
export const businessTrackingStatusEnum = z.enum([
  "on_track", 
  "behind_schedule", 
  "at_risk", 
  "completed",
  "not_started"
]);
export type BusinessTrackingStatus = z.infer<typeof businessTrackingStatusEnum>;

export const businessRegistrationEnum = z.enum(["registered", "unregistered"]);
export const paymentStructureEnum = z.enum(["self_pay", "reinvestment", "savings"]);

export const businessTrackingPeriodEnum = z.enum([
  "weekly",
  "monthly", 
  "quarterly",
  "semi_annual", 
  "annual"
]);
export type BusinessTrackingPeriod = z.infer<typeof businessTrackingPeriodEnum>;

export const businessTrackingTypeEnum = z.enum([
  "revenue",
  "expenses",
  "customers",
  "products",
  "services",
  "marketing",
  "operations",
  "training"
]);
export type BusinessTrackingType = z.infer<typeof businessTrackingTypeEnum>;

// Business Tracking Records table
export const businessTracking = pgTable("business_tracking", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businessProfiles.id),
  profileId: integer("profile_id"),
  recordedBy: integer("recorded_by").notNull().references(() => users.id),
  mentorId: integer("mentor_id").references(() => mentors.id),
  
  trackingDate: date("tracking_date").notNull().defaultNow(),
  trackingMonth: date("tracking_month").notNull().defaultNow(),
  trackingYear: integer("tracking_year").notNull().default(new Date().getFullYear()),
  trackingPeriod: text("tracking_period").notNull().$type<BusinessTrackingPeriod>().default("monthly"),
  
  projectedRevenue: integer("projected_revenue"),
  actualRevenue: integer("actual_revenue"),
  internalRevenue: integer("internal_revenue"),
  externalRevenue: integer("external_revenue"),
  actualExpenditure: integer("actual_expenditure"),
  actualProfit: integer("actual_profit"),
  
  projectedEmployees: integer("projected_employees"),
  actualEmployees: integer("actual_employees"),
  newEmployees: integer("new_employees"),
  permanentEmployees: integer("permanent_employees"),
  temporaryEmployees: integer("temporary_employees"),
  maleEmployees: integer("male_employees"),
  femaleEmployees: integer("female_employees"),
  contractWorkers: integer("contract_workers"),
  clientCount: integer("client_count"),
  
  prominentMarket: text("prominent_market"),
  newResources: json("new_resources").default([]),
  allEquipment: json("all_equipment").default([]),
  keyDecisions: json("key_decisions").default([]),
  lessonsGained: json("lessons_gained").default([]),
  resources: json("resources").default([]),
  equipment: json("equipment").default([]),
  decisions: json("decisions").default([]),
  lessons: json("lessons").default([]),
  nextSteps: json("next_steps").default([]),
  challenges: json("challenges").default([]),
  nextStepsPlanned: json("next_steps_planned").default([]),
  
  mentorFeedback: text("mentor_feedback"),
  businessInsights: text("business_insights"),
  performanceRating: integer("performance_rating"),
  
  isVerified: boolean("is_verified").default(false),
  verifiedBy: integer("verified_by").references(() => users.id),
  verificationDate: timestamp("verification_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by"),
  updatedBy: integer("updated_by")
});

// Business Tracking Attachments table
export const businessTrackingAttachments = pgTable("business_tracking_attachments", {
  id: serial("id").primaryKey(),
  trackingId: integer("tracking_id").notNull().references(() => businessTracking.id),
  attachmentName: text("attachment_name").notNull(),
  attachmentType: text("attachment_type").notNull(),
  attachmentUrl: text("attachment_url").notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Enum for report types
export const reportTypeEnum = z.enum([
  // Main module reports
  "youth_basic", 
  "youth_detailed",
  "business_basic", 
  "business_detailed",
  "makerspace_basic", 
  "makerspace_detailed",
  "mentor_basic", 
  "mentor_detailed",
  "training_basic", 
  "training_detailed",
  // Cross-entity reports
  "mentor_business_relationship", 
  "business_youth_relationship",
  "makerspace_business_assignment",
  // Analytical reports
  "youth_demographics",
  "business_performance",
  "mentor_effectiveness",
  "training_completion",
  "makerspace_utilization",
  // System reports
  "system_activity",
  "user_activity"
]);
export type ReportType = z.infer<typeof reportTypeEnum>;

// Enum for report formats
export const reportFormatEnum = z.enum(["pdf", "excel", "csv", "html"]);
export type ReportFormat = z.infer<typeof reportFormatEnum>;

// Main reports table for report definitions and configurations
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  reportType: text("report_type").notNull(), // Using reportTypeEnum values
  isTemplate: boolean("is_template").default(false), // Whether this is a template report
  filters: json("filters").default({}), // JSON object with filter criteria
  columns: json("columns").default([]), // Array of columns to include
  sortBy: text("sort_by"), // Column to sort by
  sortDirection: text("sort_direction").default("asc"), // asc or desc
  groupBy: text("group_by"), // Column to group results by
  chartOptions: json("chart_options").default({}), // Options for charts/graphs
  reportPeriod: text("report_period"), // Daily, Weekly, Monthly, Quarterly, Annual
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdBy: integer("created_by").references(() => users.id),
  lastRunBy: integer("last_run_by").references(() => users.id),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Report runs - individual executions of a report
export const reportRuns = pgTable("report_runs", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => reports.id),
  parameters: json("parameters").default({}), // Parameters used for this run
  filters: json("filters").default({}), // Filters used for this specific run
  runBy: integer("run_by").references(() => users.id),
  resultCount: integer("result_count"), // Number of results
  status: text("status").default("pending"), // pending, running, completed, failed
  format: text("format", { enum: ["pdf", "excel", "csv", "html"] }), // Output format
  outputUrl: text("output_url"), // URL to the generated report file
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  error: text("error"), // Error message if failed
  includeCharts: boolean("include_charts").default(true), // Whether to include charts
  createdAt: timestamp("created_at").defaultNow()
});

// New Report Schema specifically for youth reports

// Define youth report type enum for better type safety
export const youthReportTypeEnum = z.enum([
  "youth_basic", 
  "youth_detailed",
  "youth_demographics",
  "youth_education",
  "youth_skills",
  "youth_certification",
  "youth_business",
  "youth_training"
]);
export type YouthReportType = z.infer<typeof youthReportTypeEnum>;

// Youth Report Templates table
export const youthReportTemplates = pgTable("youth_report_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  reportType: text("report_type", { 
    enum: youthReportTypeEnum.options 
  }).notNull(),
  isDefault: boolean("is_default").default(false),
  filters: json("filters").default({}),
  columns: json("columns").default([]),
  sortBy: text("sort_by"),
  sortDirection: text("sort_direction").default("asc"),
  groupBy: text("group_by"),
  chartOptions: json("chart_options").default({}),
  displayOptions: json("display_options").default({}),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Youth Report Executions table
export const youthReportExecutions = pgTable("youth_report_executions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => youthReportTemplates.id),
  name: text("name").notNull(),
  filters: json("filters").default({}),
  parameters: json("parameters").default({}),
  exportFormat: text("export_format", { 
    enum: ["pdf", "excel", "csv", "json"] 
  }).default("pdf"),
  resultCount: integer("result_count"),
  status: text("status", { 
    enum: ["pending", "processing", "completed", "failed"] 
  }).default("pending"),
  outputUrl: text("output_url"),
  errorMessage: text("error_message"),
  executedBy: integer("executed_by").references(() => users.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Define relations
export const youthReportTemplatesRelations = relations(youthReportTemplates, ({ one, many }) => ({
  creator: one(users, {
    fields: [youthReportTemplates.createdBy],
    references: [users.id]
  }),
  executions: many(youthReportExecutions)
}));

export const youthReportExecutionsRelations = relations(youthReportExecutions, ({ one }) => ({
  template: one(youthReportTemplates, {
    fields: [youthReportExecutions.templateId],
    references: [youthReportTemplates.id]
  }),
  executor: one(users, {
    fields: [youthReportExecutions.executedBy],
    references: [users.id]
  })
}));

// Create insert schemas
export const insertYouthReportTemplateSchema = createInsertSchema(youthReportTemplates)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    reportType: youthReportTypeEnum,
    filters: z.record(z.any()).optional(),
    columns: z.array(z.string()).optional(),
    chartOptions: z.record(z.any()).optional(),
    displayOptions: z.record(z.any()).optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
  });

export const insertYouthReportExecutionSchema = createInsertSchema(youthReportExecutions)
  .omit({ id: true, startedAt: true, completedAt: true, resultCount: true, status: true, errorMessage: true, createdAt: true })
  .extend({
    templateId: z.number().optional(),
    exportFormat: z.enum(["pdf", "excel", "csv", "json"]).default("pdf"),
    filters: z.record(z.any()).optional(),
    parameters: z.record(z.any()).optional(),
  });

// Type definitions
export type YouthReportTemplate = typeof youthReportTemplates.$inferSelect;
export type InsertYouthReportTemplate = z.infer<typeof insertYouthReportTemplateSchema>;

export type YouthReportExecution = typeof youthReportExecutions.$inferSelect;
export type InsertYouthReportExecution = z.infer<typeof insertYouthReportExecutionSchema>;

// Business Activity Log
export const businessActivityLog = pgTable("business_activity_log", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessProfiles.id),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  performedBy: integer("performed_by").references(() => users.id),
  activityDate: date("activity_date").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Mentorship meetings and attendance
export const mentorshipMeetings = pgTable("mentorship_meetings", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => mentors.id),
  businessId: integer("business_id").notNull().references(() => businessProfiles.id),
  meetingDate: date("meeting_date").notNull(),
  meetingType: text("meeting_type").notNull(), // In-person, Virtual, etc.
  location: text("location"),
  duration: integer("duration"), // in minutes
  agenda: text("agenda"),
  summary: text("summary"),
  outcomes: json("outcomes").default([]),
  nextSteps: json("next_steps").default([]),
  attendees: json("attendees").default([]),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Equipment and resources for businesses
export const equipmentInventory = pgTable("equipment_inventory", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessProfiles.id),
  equipmentName: text("equipment_name").notNull(),
  equipmentType: text("equipment_type"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  purchaseDate: date("purchase_date"),
  purchasePrice: integer("purchase_price"),
  currentValue: integer("current_value"),
  condition: text("condition"),
  status: text("status").notNull().default("Active"), // Active, Maintenance, Retired
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const dareModelEnum = z.enum([
  "Collaborative",
  "MakerSpace",
  "Madam Anchor",
]);

export type DareModel = z.infer<typeof dareModelEnum>;

// Create Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
// Create a custom insert schema for youth profiles
export const insertYouthProfileSchema = createInsertSchema(youthProfiles)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    userId: z.number().optional().nullable(),

    // Required
    participantCode: z.string().min(1),
    fullName:        z.string().min(1),
    firstName:       z.string().min(1),
    lastName:        z.string().min(1),
    district:        districtEnum,

    // Optional / Nullable
    preferredName:        z.string().optional().nullable(),
    profilePicture:       z.string().optional().nullable(),
    middleName:           z.string().optional().nullable(),
    dateOfBirth:          z.union([z.string(), z.date()]).optional().nullable(),
    yearOfBirth:          z.number().optional().nullable(),
    age:                  z.number().optional().nullable(),
    ageGroup:             z.string().optional().nullable(),
    gender:               z.string().optional().nullable(),
    maritalStatus:        z.string().optional().nullable(),
    childrenCount:        z.number().optional().nullable(),
    dependents:           z.string().optional().nullable(),
    nationalId:           z.string().optional().nullable(),
    pwdStatus:            z.string().optional().nullable(),

    town:                 z.string().optional().nullable(),
    homeAddress:          z.string().optional().nullable(),
    country:              z.string().default("Ghana").optional(),
    adminLevel1:          z.string().optional().nullable(),
    adminLevel2:          z.string().optional().nullable(),
    adminLevel3:          z.string().optional().nullable(),
    adminLevel4:          z.string().optional().nullable(),
    adminLevel5:          z.string().optional().nullable(),
    phoneNumber:          z.string().optional().nullable(),
    additionalPhoneNumber1:z.string().optional().nullable(),
    additionalPhoneNumber2:z.string().optional().nullable(),
    email:                z.string().email().optional().nullable(),
    emergencyContact:     z.any().optional().nullable(),

    highestEducationLevel: z.string().optional().nullable(),
    activeStudentStatus:   z.boolean().optional().nullable(),
    coreSkills:            z.string().optional().nullable(),
    skillLevel:            z.string().optional().nullable(),
    industryExpertise:     z.string().optional().nullable(),
    languagesSpoken:       z.any().optional().nullable(),
    communicationStyle:    z.string().optional().nullable(),
    digitalSkills:         z.string().optional().nullable(),
    digitalSkills2:        z.string().optional().nullable(),

    yearsOfExperience:     z.number().optional().nullable(),
    workHistory:           z.any().optional().nullable(),

    businessInterest:      z.string().optional().nullable(),
    employmentStatus:      z.string().optional().nullable(),
    specificJob:           z.string().optional().nullable(),
    trainingStatus:        z.string().optional().nullable(),
    programStatus:         z.string().optional().nullable(),
    transitionStatus:      z.string().optional().nullable(),
    onboardedToTracker:    z.boolean().optional().nullable(),

    dareModel:             dareModelEnum.optional().nullable(),
    isMadam:               z.boolean().optional().nullable(),
    isApprentice:          z.boolean().optional().nullable(),
    madamName:             z.string().optional().nullable(),
    madamPhone:            z.string().optional().nullable(),
    apprenticeNames:       z.any().optional().nullable(),
    apprenticePhone:       z.string().optional().nullable(),

    localMentorName:       z.string().optional().nullable(),
    localMentorContact:    z.string().optional().nullable(),
    guarantor:             z.string().optional().nullable(),
    guarantorPhone:        z.string().optional().nullable(),

    implementingPartnerName:z.string().optional().nullable(),
    refugeeStatus:          z.boolean().optional().nullable(),
    idpStatus:              z.boolean().optional().nullable(),
    communityHostsRefugees:  z.boolean().optional().nullable(),

    partnerStartDate:       z.union([z.string(), z.date()]).optional().nullable(),
    programName:            z.string().optional().nullable(),
    programDetails:         z.string().optional().nullable(),
    programContactPerson:   z.string().optional().nullable(),
    cohort:   z.string().optional().nullable(),
    programContactPhoneNumber:
                            z.string().optional().nullable(),

    newDataSubmission:      z.boolean().optional().nullable(),
    isDeleted:              z.boolean().optional().nullable(),
    hostCommunityStatus:    z.string().optional().nullable(),
  });
export type InsertYouthProfileSchema = z.infer<typeof insertYouthProfileSchema>;

// Create insert schema that matches your implementation
export const insertBusinessProfileSchema = createInsertSchema(businessProfiles)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    businessName:              z.string().min(1),
    businessLogo:              z.string().optional().nullable(),
    district:                  districtEnum,
    businessLocation:          z.string().optional().nullable(),
    businessContact:           z.string().optional().nullable(),
    businessDescription:       z.string().optional().nullable(),
    businessModel:             z.string().optional().nullable(),
    dareModel:                 dareModelEnum.optional().nullable(),
    serviceCategoryId:         z.number().optional().nullable(),
    serviceSubcategoryId:      z.number().optional().nullable(),
    businessStartDate:         z.union([z.string(), z.date()]).optional().nullable(),
    registrationStatus:        z.enum(["Registered","Unregistered"]).optional().nullable(),
    registrationNumber:        z.string().optional().nullable(),
    registrationDate:          z.union([z.string(), z.date()]).optional().nullable(),
    businessObjectives:        z.any().optional().nullable(),
    shortTermGoals:            z.any().optional().nullable(),
    targetMarket:              z.string().optional().nullable(),
    taxIdentificationNumber:   z.string().optional().nullable(),
    implementingPartnerName:   z.string().optional().nullable(),
    enterpriseUniqueIdentifier:z.string().optional().nullable(),
    enterpriseOwnerYouthIds:   z.string().optional().nullable(),
    enterpriseOwnerName:       z.string().optional().nullable(),
    enterpriseOwnerDob:        z.union([z.string(), z.date()]).optional().nullable(),
    enterpriseOwnerSex:        z.string().optional().nullable(),
    enterpriseType:            enterpriseTypeEnum.optional(),
    enterpriseSize:            enterpriseSizeEnum.optional(),
    subPartnerNames:           z.any().optional().nullable(),
    totalYouthInWorkReported:  z.number().optional().nullable(),
    youthRefugeeCount:         z.number().optional().nullable(),
    youthIdpCount:             z.number().optional().nullable(),
    youthHostCommunityCount:   z.number().optional().nullable(),
    youthPlwdCount:            z.number().optional().nullable(),
    sector:                    businessSectorEnum.optional(),
    primaryPhoneNumber:        z.string().optional().nullable(),
    additionalPhoneNumber1:    z.string().optional().nullable(),
    additionalPhoneNumber2:    z.string().optional().nullable(),
    businessEmail:             z.string().email().optional().nullable(),
    country:                   z.string().optional(),
    adminLevel1:               z.string().optional().nullable(),
    adminLevel2:               z.string().optional().nullable(),
    adminLevel3:               z.string().optional().nullable(),
    adminLevel4:               z.string().optional().nullable(),
    adminLevel5:               z.string().optional().nullable(),
    partnerStartDate:          z.union([z.string(), z.date()]).optional().nullable(),
    programName:               z.string().optional().nullable(),
    programDetails:            z.string().optional().nullable(),
    programContactPerson:      z.string().optional().nullable(),
    programContactPhoneNumber: z.string().optional().nullable(),
    deliverySetup:             z.boolean().optional().nullable(),
    deliveryType:              z.string().optional().nullable(),
    expectedWeeklyRevenue:     z.number().optional().nullable(),
    expectedMonthlyRevenue:    z.number().optional().nullable(),
    anticipatedMonthlyExpenditure: z.number().optional().nullable(),
    expectedMonthlyProfit:     z.number().optional().nullable(),
    paymentStructure:          z.enum(["Self-Pay","Reinvestment","Savings"]).optional().nullable(),
    socialMediaLinks:          z.string().optional().nullable(),
    newDataSubmission:         z.boolean().optional().nullable(),
  });
export type InsertBusinessProfileSchema = z.infer<typeof insertBusinessProfileSchema>;

export const insertBusinessYouthRelationshipSchema = createInsertSchema(businessYouthRelationships);

export const insertMentorSchema = createInsertSchema(mentors).omit({ id: true, createdAt: true });
export const insertMentorBusinessRelationshipSchema = createInsertSchema(mentorBusinessRelationships);
export const insertMentorshipMessageSchema = createInsertSchema(mentorshipMessages).omit({ id: true, createdAt: true });
export const insertBusinessAdviceSchema = createInsertSchema(businessAdvice).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceSubcategorySchema = createInsertSchema(serviceSubcategories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true, createdAt: true, updatedAt: true });
export const insertYouthSkillSchema = createInsertSchema(youthSkills).omit({ createdAt: true, updatedAt: true });
export const insertEducationSchema = createInsertSchema(education).omit({ id: true, createdAt: true });
export const insertCertificationSchema = createInsertSchema(certifications).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});
export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({ id: true, createdAt: true });
export const insertYouthTrainingSchema = createInsertSchema(youthTraining).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

// Report-related schema definitions
export const insertReportSchema = createInsertSchema(reports)
  .omit({ id: true, createdAt: true, updatedAt: true, lastRunAt: true })
  .extend({
    reportType: reportTypeEnum,
    filters: z.record(z.any()).optional(),
    columns: z.array(z.string()).optional(),
    chartOptions: z.record(z.any()).optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
  });

export const insertReportRunSchema = createInsertSchema(reportRuns)
  .omit({ id: true, startedAt: true, completedAt: true, resultCount: true, status: true, error: true })
  .extend({
    reportId: z.number(),
    format: reportFormatEnum,
    parameters: z.record(z.any()).optional(),
    filters: z.record(z.any()).optional(),
  });

// Type Definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type YouthProfile = typeof youthProfiles.$inferSelect;
export type InsertYouthProfile = z.infer<typeof insertYouthProfileSchema>;

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;

export type BusinessYouthRelationship = typeof businessYouthRelationships.$inferSelect;
export type InsertBusinessYouthRelationship = z.infer<typeof insertBusinessYouthRelationshipSchema>;

export type MentorBusinessRelationship = typeof mentorBusinessRelationships.$inferSelect;
export type InsertMentorBusinessRelationship = z.infer<typeof insertMentorBusinessRelationshipSchema>;



export type Mentor = typeof mentors.$inferSelect;
export type InsertMentor = z.infer<typeof insertMentorSchema>;

export type MentorshipMessage = typeof mentorshipMessages.$inferSelect;
export type InsertMentorshipMessage = z.infer<typeof insertMentorshipMessageSchema>;

export type BusinessAdvice = typeof businessAdvice.$inferSelect;
export type InsertBusinessAdvice = z.infer<typeof insertBusinessAdviceSchema>;

export type ServiceCategoryType = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;

export type ServiceSubcategory = typeof serviceSubcategories.$inferSelect;
export type InsertServiceSubcategory = z.infer<typeof insertServiceSubcategorySchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

export type YouthSkill = typeof youthSkills.$inferSelect;
export type InsertYouthSkill = z.infer<typeof insertYouthSkillSchema>;

export type Education = typeof education.$inferSelect;
export type InsertEducation = z.infer<typeof insertEducationSchema>;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;

export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;

export type YouthTraining = typeof youthTraining.$inferSelect;
export type InsertYouthTraining = z.infer<typeof insertYouthTrainingSchema>;

// Create Insert Schemas for Business Tracking
export const insertBusinessTrackingSchema = z.object({
  businessId: z.number().int().positive(),
  profileId: z.number().int().positive().optional(),
  recordedBy: z.number().int().positive(),
  mentorId: z.number().int().positive().optional(),
  
  trackingDate: z.date(),
  trackingMonth: z.date(),
  trackingYear: z.number().int().positive(),
  trackingPeriod: businessTrackingPeriodEnum.default("monthly"),
  
  projectedRevenue: z.number().int().optional(),
  actualRevenue: z.number().int().optional(),
  internalRevenue: z.number().int().optional(),
  externalRevenue: z.number().int().optional(),
  actualExpenditure: z.number().int().optional(),
  actualProfit: z.number().int().optional(),
  
  projectedEmployees: z.number().int().optional(),
  actualEmployees: z.number().int().optional(),
  newEmployees: z.number().int().optional(),
  permanentEmployees: z.number().int().optional(),
  temporaryEmployees: z.number().int().optional(),
  maleEmployees: z.number().int().optional(),
  femaleEmployees: z.number().int().optional(),
  contractWorkers: z.number().int().optional(),
  clientCount: z.number().int().optional(),
  
  prominentMarket: z.string().optional(),
  newResources: z.array(z.string()).default([]),
  allEquipment: z.array(z.string()).default([]),
  keyDecisions: z.array(z.string()).default([]),
  lessonsGained: z.array(z.string()).default([]),
  resources: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  lessons: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  nextStepsPlanned: z.array(z.string()).default([]),
  
  mentorFeedback: z.string().optional(),
  businessInsights: z.string().optional(),
  performanceRating: z.number().int().optional(),
  
  isVerified: z.boolean().default(false),
  verifiedBy: z.number().int().positive().optional(),
  verificationDate: z.date().optional(),
  
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.number().int().positive().optional(),
  updatedBy: z.number().int().positive().optional()
});
  export const insertBusinessTrackingAttachmentSchema = z.object({
    trackingId: z.number().int().positive(),
    attachmentName: z.string().min(1),
    attachmentType: z.string().min(1),
    attachmentUrl: z.string().url(),
    uploadedBy: z.number().int().positive(),
    createdAt: z.date().optional()
  });
  

// Type Definitions for Business Tracking
export type BusinessTracking = typeof businessTracking.$inferSelect;
export type InsertBusinessTracking = z.infer<typeof insertBusinessTrackingSchema>;

export type BusinessTrackingAttachment = typeof businessTrackingAttachments.$inferSelect;
export type InsertBusinessTrackingAttachment = z.infer<typeof insertBusinessTrackingAttachmentSchema>;

// Makerspace Management
export const makerspaces = pgTable("makerspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  coordinates: text("coordinates"),
  district: text("district").notNull(),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  contactPerson: text("contact_person"),
  operatingHours: text("operating_hours"),
  openDate: date("open_date"),
  resourceCount: integer("resource_count").default(0),
  memberCount: integer("member_count").default(0),
  facilities: text("facilities"),
  status: text("status").default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business-Makerspace Assignments
export const businessMakerspaceAssignments = pgTable("business_makerspace_assignments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessProfiles.id, { onDelete: 'cascade' }),
  makerspaceId: integer("makerspace_id").notNull().references(() => makerspaces.id, { onDelete: 'cascade' }),
  assignedDate: timestamp("assigned_date").defaultNow(),
  assignedBy: integer("assigned_by").references(() => users.id),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Create schema for inserting a makerspace
export const insertMakerspaceSchema = createInsertSchema(makerspaces)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }),
    address: z.string().min(5, { message: "Address must be at least 5 characters" }),
    district: districtEnum,
    contactEmail: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
    openDate: z.date().optional().nullable(),
  });

// Create schema for business-makerspace assignments
export const insertBusinessMakerspaceAssignmentSchema = createInsertSchema(businessMakerspaceAssignments)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    businessId: z.number().positive({ message: "Business ID is required" }),
    makerspaceId: z.number().positive({ message: "Makerspace ID is required" }),
  });

export type BusinessMakerspaceAssignment = typeof businessMakerspaceAssignments.$inferSelect;
export type InsertBusinessMakerspaceAssignment = z.infer<typeof insertBusinessMakerspaceAssignmentSchema>;

// Define relations for business-makerspace assignments
export const businessMakerspaceAssignmentsRelations = relations(businessMakerspaceAssignments, ({ one }) => ({
  business: one(businessProfiles, {
    fields: [businessMakerspaceAssignments.businessId],
    references: [businessProfiles.id],
  }),
  makerspace: one(makerspaces, {
    fields: [businessMakerspaceAssignments.makerspaceId],
    references: [makerspaces.id],
  }),
  assignor: one(users, {
    fields: [businessMakerspaceAssignments.assignedBy],
    references: [users.id],
  }),
}));

// Define relations for makerspaces that contain businesses
export const makerspacesRelations = relations(makerspaces, ({ many }) => ({
  businessAssignments: many(businessMakerspaceAssignments),
}));

export type Makerspace = typeof makerspaces.$inferSelect;
export type InsertMakerspace = z.infer<typeof insertMakerspaceSchema>;

// Define relations for business tracking
export const businessTrackingRelations = relations(businessTracking, ({ one, many }) => ({
  business: one(businessProfiles, {
    fields: [businessTracking.businessId],
    references: [businessProfiles.id]
  }),
  recorder: one(users, {
    fields: [businessTracking.recordedBy],
    references: [users.id]
  }),
  mentor: one(mentors, {
    fields: [businessTracking.mentorId],
    references: [mentors.id]
  }),
  verifier: one(users, {
    fields: [businessTracking.verifiedBy],
    references: [users.id]
  }),
  attachments: many(businessTrackingAttachments)
}));

// Define relations for business tracking attachments
export const businessTrackingAttachmentsRelations = relations(businessTrackingAttachments, ({ one }) => ({
  tracking: one(businessTracking, {
    fields: [businessTrackingAttachments.trackingId],
    references: [businessTracking.id]
  }),
  uploader: one(users, {
    fields: [businessTrackingAttachments.uploadedBy],
    references: [users.id]
  })
}));

// Define relations for business profiles to include tracking records and makerspace assignments
export const businessProfilesRelations = relations(businessProfiles, ({ many }) => ({
  trackingRecords: many(businessTracking),
  makerspaceAssignments: many(businessMakerspaceAssignments),
  feasibilityAssessments: many(feasibilityAssessments)
}));

// Portfolio types
export const insertPortfolioProjectSchema = createInsertSchema(portfolioProjects).omit({ id: true, createdAt: true, updatedAt: true });
export type PortfolioProject = typeof portfolioProjects.$inferSelect;

// Report types
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type ReportRun = typeof reportRuns.$inferSelect;
export type InsertReportRun = z.infer<typeof insertReportRunSchema>;
export type InsertPortfolioProject = z.infer<typeof insertPortfolioProjectSchema>;

export const insertProjectImageSchema = createInsertSchema(projectImages).omit({ id: true, createdAt: true });
export type ProjectImage = typeof projectImages.$inferSelect;
export type InsertProjectImage = z.infer<typeof insertProjectImageSchema>;

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true });
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export const insertSocialMediaLinkSchema = createInsertSchema(socialMediaLinks).omit({ id: true, createdAt: true });
export type SocialMediaLink = typeof socialMediaLinks.$inferSelect;
export type InsertSocialMediaLink = z.infer<typeof insertSocialMediaLinkSchema>;

// Role Permissions schema and types
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true, createdAt: true, updatedAt: true });
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

// Type definitions for the new roles system
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true, updatedAt: true });
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

// Type definitions for the permissions system
export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true, createdAt: true, updatedAt: true });
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

// No content here - this section was removed as it's duplicated below

// Activity type for the system activity log (in-memory data structure)
export interface Activity {
  id: string;
  type: 'business' | 'youth' | 'mentor' | 'system';
  title?: string;
  content?: string;
  timestamp: string;
  user?: string;
}

// Makerspace Resources Schema
export const makerspaceResources = pgTable("makerspace_resources", {
  id: serial("id").primaryKey(),
  makerspaceId: integer("makerspace_id").notNull().references(() => makerspaces.id),
  name: text("resource_name").notNull(),
  category: text("category", { enum: ["Tool", "Equipment", "Material", "Space"] }).notNull(),
  description: text("description"),
  status: text("status", { enum: ["Available", "In Use", "Maintenance", "Out of Stock"] }).default("Available"),
  quantity: integer("quantity").default(1),
  acquisitionDate: date("acquisition_date"),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Define relationships for makerspace resources
export const makerspaceResourcesRelations = relations(makerspaceResources, ({ one, many }) => ({
  makerspace: one(makerspaces, {
    fields: [makerspaceResources.makerspaceId],
    references: [makerspaces.id]
  }),
  costs: many(makerspaceResourceCosts),
  creator: one(users, {
    fields: [makerspaceResources.createdBy],
    references: [users.id]
  }),
  updater: one(users, {
    fields: [makerspaceResources.updatedBy],
    references: [users.id]
  })
}));

// Makerspace Resource Costs
export const makerspaceResourceCosts = pgTable("makerspace_resource_costs", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => makerspaceResources.id, { onDelete: 'cascade' }),
  costType: text("cost_type", { enum: ["Purchase", "Maintenance", "Repair", "Upgrade", "Other"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").defaultNow(),
  description: text("description"),
  receipt: text("receipt"), // URL to uploaded receipt image
  recordedBy: integer("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Define relationships for resource costs
export const makerspaceResourceCostsRelations = relations(makerspaceResourceCosts, ({ one }) => ({
  resource: one(makerspaceResources, {
    fields: [makerspaceResourceCosts.resourceId],
    references: [makerspaceResources.id]
  }),
  recorder: one(users, {
    fields: [makerspaceResourceCosts.recordedBy],
    references: [users.id]
  })
}));

// Business Resources Schema
export const businessResources = pgTable("business_resources", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessProfiles.id),
  name: text("resource_name").notNull(),
  category: text("category", { enum: ["Tool", "Equipment", "Material", "Supply"] }).notNull(),
  description: text("description"),
  status: text("status", { enum: ["Available", "In Use", "Maintenance", "Out of Stock"] }).default("Available"),
  quantity: integer("quantity").default(1),
  acquisitionDate: date("acquisition_date"),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  notes: text("notes"),
  assignedBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Business Resource Costs
export const businessResourceCosts = pgTable("business_resource_costs", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => businessResources.id, { onDelete: 'cascade' }),
  costType: text("cost_type", { enum: ["Purchase", "Maintenance", "Repair", "Upgrade", "Other"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").defaultNow(),
  description: text("description"),
  receipt: text("receipt"), // URL to uploaded receipt image
  recordedBy: integer("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Define relationships for business resources
export const businessResourcesRelations = relations(businessResources, ({ one, many }) => ({
  business: one(businessProfiles, {
    fields: [businessResources.businessId],
    references: [businessProfiles.id]
  }),
  assignedByUser: one(users, {
    fields: [businessResources.assignedBy],
    references: [users.id]
  }),
  costs: many(businessResourceCosts)
}));

// Define relationships for business resource costs
export const businessResourceCostsRelations = relations(businessResourceCosts, ({ one }) => ({
  resource: one(businessResources, {
    fields: [businessResourceCosts.resourceId],
    references: [businessResources.id]
  }),
  recorder: one(users, {
    fields: [businessResourceCosts.recordedBy],
    references: [users.id]
  })
}));

// Update the makerspace relations to include resources
export const makerspacesRelationsUpdated = relations(makerspaces, ({ many }) => ({
  businessAssignments: many(businessMakerspaceAssignments),
  resources: many(makerspaceResources)
}));

export const insertMakerspaceResourceSchema = createInsertSchema(makerspaceResources)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    // Accept string dates in ISO format or Date objects, then convert to string for storage
    acquisitionDate: z.union([z.string(), z.date()])
      .optional()
      .nullable()
      .transform(val => 
        val instanceof Date ? val.toISOString().split('T')[0] : val
      ),
    unitCost: z.union([z.string(), z.number()])
      .optional()
      .nullable()
      .transform(val => 
        typeof val === 'string' ? parseFloat(val) : val
      ),
    totalCost: z.union([z.string(), z.number()])
      .optional()
      .nullable()
      .transform(val => 
        typeof val === 'string' ? parseFloat(val) : val
      ),
  });

export const insertMakerspaceResourceCostSchema = createInsertSchema(makerspaceResourceCosts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    amount: z.union([z.string(), z.number()])
      .transform(val => 
        typeof val === 'string' ? parseFloat(val) : val
      )
      .refine(val => val > 0, { message: "Amount must be greater than 0" }),
    date: z.union([z.string(), z.date()])
      .default(() => new Date())
      .transform(val => 
        val instanceof Date ? val.toISOString().split('T')[0] : val
      ),
  });

export type MakerspaceResource = typeof makerspaceResources.$inferSelect;
export type InsertMakerspaceResource = z.infer<typeof insertMakerspaceResourceSchema>;

export type MakerspaceResourceCost = typeof makerspaceResourceCosts.$inferSelect;
export type InsertMakerspaceResourceCost = z.infer<typeof insertMakerspaceResourceCostSchema>;

// Business resource schemas
export const insertBusinessResourceSchema = createInsertSchema(businessResources)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    // Accept string dates in ISO format or Date objects, then convert to string for storage
    acquisitionDate: z.union([z.string(), z.date()])
      .optional()
      .nullable()
      .transform(val => 
        val instanceof Date ? val.toISOString().split('T')[0] : val
      ),
    unitCost: z.union([z.string(), z.number()])
      .optional()
      .nullable()
      .transform(val => 
        typeof val === 'string' ? parseFloat(val) : val
      ),
    totalCost: z.union([z.string(), z.number()])
      .optional()
      .nullable()
      .transform(val => 
        typeof val === 'string' ? parseFloat(val) : val
      ),
  });

export const insertBusinessResourceCostSchema = createInsertSchema(businessResourceCosts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    amount: z.union([z.string(), z.number()])
      .transform(val => 
        typeof val === 'string' ? parseFloat(val) : val
      )
      .refine(val => val > 0, { message: "Amount must be greater than 0" }),
    date: z.union([z.string(), z.date()])
      .default(() => new Date())
      .transform(val => 
        val instanceof Date ? val.toISOString().split('T')[0] : val
      ),
  });

export type BusinessResource = typeof businessResources.$inferSelect;
export type InsertBusinessResource = z.infer<typeof insertBusinessResourceSchema>;

export type BusinessResourceCost = typeof businessResourceCosts.$inferSelect;
export type InsertBusinessResourceCost = z.infer<typeof insertBusinessResourceCostSchema>;

// Define relations for roles and permissions
export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions)
}));

export const customRolesRelations = relations(customRoles, ({ }) => ({
  // No longer used, relations now through system roles table
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  // Direct relation via resource and action, not ID
}));

// Report relations
export const reportsRelations = relations(reports, ({ one, many }) => ({
  creator: one(users, {
    fields: [reports.createdBy],
    references: [users.id]
  }),
  lastRunner: one(users, {
    fields: [reports.lastRunBy],
    references: [users.id]
  }),
  runs: many(reportRuns)
}));

export const reportRunsRelations = relations(reportRuns, ({ one }) => ({
  report: one(reports, {
    fields: [reportRuns.reportId],
    references: [reports.id]
  }),
  runner: one(users, {
    fields: [reportRuns.runBy],
    references: [users.id]
  })
  // Cannot establish many relation with rolePermissions without a direct field reference
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id]
  })
  // We've removed permissionId reference since it doesn't exist in the database
}));



// Define the status enum for feasibility assessments
export const feasibilityStatusEnum = ["Draft", "In Progress", "Completed", "Reviewed"] as const;
export type FeasibilityStatus = typeof feasibilityStatusEnum[number];

// Feasibility Assessment Schema
export const feasibilityAssessments = pgTable("feasibility_assessments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businessProfiles.id, { onDelete: "set null" }).notNull(),
  youthId: integer("youth_id").references(() => youthProfiles.id, { onDelete: "set null" }).notNull(),

  // Base
  assessmentDate: timestamp("assessment_date").defaultNow().notNull(),
  assessmentBy: integer("assessment_by").references(() => users.id, { onDelete: "set null" }).notNull(),
  status: text("status", { enum: feasibilityStatusEnum }).default("Draft").notNull(),
  overallFeasibilityPercentage: decimal("overall_feasibility_percentage", { precision: 5, scale: 2 }).notNull(),
  reviewComments: text("review_comments").notNull(),
  recommendations: text("recommendations").notNull(),
  riskFactors: text("risk_factors").notNull(),
  growthOpportunities: text("growth_opportunities").notNull(),
  recommendedActions: text("recommended_actions").notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id, { onDelete: "set null" }).notNull(),
  reviewDate: timestamp("review_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // 1. Location & Structure
  plannedBusinessLocation: text("planned_business_location").notNull(),
  isGroundRentRequired: boolean("is_ground_rent_required").notNull(),
  hasStructureOrStall: boolean("has_structure_or_stall").notNull(),
  structureNeeds: text("structure_needs").notNull(),
  estimatedSpaceCost: decimal("estimated_space_cost", { precision: 12, scale: 2 }).notNull(),
  spaceCostContribution: decimal("space_cost_contribution", { precision: 12, scale: 2 }).notNull(),

  // 2. Equipment
  equipmentNeeded: json("equipment_needed").$type<string[]>().default([]).notNull(),
  equipmentCurrentlyOwned: json("equipment_currently_owned").$type<string[]>().default([]).notNull(),
  equipmentMissing: json("equipment_missing").$type<string[]>().default([]).notNull(),
  equipmentTotalCost: decimal("equipment_total_cost", { precision: 12, scale: 2 }).notNull(),
  equipmentCostContribution: decimal("equipment_cost_contribution", { precision: 12, scale: 2 }).notNull(),

  // 3. Supplies
  startupSuppliesNeeded: json("startup_supplies_needed").$type<string[]>().default([]).notNull(),
  suppliesCurrentlyOwned: json("supplies_currently_owned").$type<string[]>().default([]).notNull(),
  suppliesMissing: json("supplies_missing").$type<string[]>().default([]).notNull(),
  suppliesTotalCost: decimal("supplies_total_cost", { precision: 12, scale: 2 }).notNull(),
  suppliesCostContribution: decimal("supplies_cost_contribution", { precision: 12, scale: 2 }).notNull(),

  // 4. Marketing
  marketingToolsNeeded: json("marketing_tools_needed").$type<string[]>().default([]).notNull(),
  marketingToolsCurrentlyOwned: json("marketing_tools_currently_owned").$type<string[]>().default([]).notNull(),
  marketingToolsMissing: json("marketing_tools_missing").$type<string[]>().default([]).notNull(),
  marketingTotalCost: decimal("marketing_total_cost", { precision: 12, scale: 2 }).notNull(),
  marketingCostContribution: decimal("marketing_cost_contribution", { precision: 12, scale: 2 }).notNull(),

  // 5. Delivery
  needsDelivery: boolean("needs_delivery").notNull(),
  deliveryMethod: text("delivery_method").notNull(),
  deliveryResourcesAvailable: text("delivery_resources_available").notNull(),
  deliverySetupCost: decimal("delivery_setup_cost", { precision: 12, scale: 2 }).notNull(),
  deliveryCostContribution: decimal("delivery_cost_contribution", { precision: 12, scale: 2 }).notNull(),

  // 6. Livelihood Expenses
  monthlyNonBusinessExpenses: decimal("monthly_non_business_expenses", { precision: 12, scale: 2 }).notNull(),
  fixedFinancialObligations: text("fixed_financial_obligations").notNull(),

  // 7. Revenue & Financial Projections
  expectedPrice: decimal("expected_price", { precision: 12, scale: 2 }).notNull(),
  expectedSalesDaily: decimal("expected_sales_daily", { precision: 12, scale: 2 }).notNull(),
  expectedSalesWeekly: decimal("expected_sales_weekly", { precision: 12, scale: 2 }).notNull(),
  expectedSalesMonthly: decimal("expected_sales_monthly", { precision: 12, scale: 2 }).notNull(),
  expectedMonthlyRevenue: decimal("expected_monthly_revenue", { precision: 12, scale: 2 }).notNull(),
  expectedMonthlyExpenditure: decimal("expected_monthly_expenditure", { precision: 12, scale: 2 }).notNull(),
  expectedMonthlySavings: decimal("expected_monthly_savings", { precision: 12, scale: 2 }).notNull(),
  expectedPayToSelf: decimal("expected_pay_to_self", { precision: 12, scale: 2 }).notNull(),
  isPlanFeasible: boolean("is_plan_feasible").notNull(),
  planAdjustments: text("plan_adjustments").notNull(),

  // 8. Seed Capital
  seedCapitalNeeded: decimal("seed_capital_needed", { precision: 12, scale: 2 }).notNull(),
  seedCapitalUsage: text("seed_capital_usage").notNull(),
});

// Define relations
export const feasibilityAssessmentsRelations = relations(
  feasibilityAssessments,
  ({ one }) => ({
    business: one(businessProfiles, {
      fields: [feasibilityAssessments.businessId],
      references: [businessProfiles.id],
    }),
    youth: one(youthProfiles, {
      fields: [feasibilityAssessments.youthId],
      references: [youthProfiles.id],
    }),
    assessor: one(users, {
      fields: [feasibilityAssessments.assessmentBy],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [feasibilityAssessments.reviewedBy],
      references: [users.id],
    }),
  })
);