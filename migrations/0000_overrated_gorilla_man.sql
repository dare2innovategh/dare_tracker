CREATE TABLE "business_activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"performed_by" integer,
	"activity_date" date DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "business_advice" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"advice_content" text NOT NULL,
	"category" text NOT NULL,
	"follow_up_notes" text,
	"implementation_status" text DEFAULT 'pending',
	"priority" text DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "business_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"business_logo" text,
	"district" text NOT NULL,
	"business_location" text,
	"business_contact" text,
	"business_description" text,
	"business_model" text,
	"dare_model" text,
	"service_category_id" integer,
	"service_subcategory_id" integer,
	"business_start_date" date,
	"registration_status" text,
	"registration_number" text,
	"registration_date" date,
	"business_objectives" json DEFAULT '[]'::json,
	"target_market" text,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "business_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"tracking_date" date NOT NULL,
	"tracking_month" date NOT NULL,
	"tracking_year" integer NOT NULL,
	"tracking_period" text,
	"projected_sales" integer,
	"actual_sales" integer,
	"projected_revenue" integer,
	"actual_revenue" integer,
	"internal_revenue" integer,
	"external_revenue" integer,
	"actual_expenditure" integer,
	"actual_profit" integer,
	"projected_employees" integer,
	"actual_employees" integer,
	"new_employees" integer,
	"permanent_employees" integer,
	"temporary_employees" integer,
	"male_employees" integer,
	"female_employees" integer,
	"contract_workers" integer,
	"client_count" integer,
	"prominent_market" text,
	"new_resources" json DEFAULT '[]'::json,
	"all_equipment" json DEFAULT '[]'::json,
	"key_decisions" json DEFAULT '[]'::json,
	"lessons_gained" json DEFAULT '[]'::json,
	"business_insights" text,
	"challenges" json DEFAULT '[]'::json,
	"next_steps_planned" json DEFAULT '[]'::json,
	"performance_rating" integer,
	"reviewer_id" integer,
	"review_date" date,
	"review_notes" text,
	"approval_status" text,
	"approved_by_id" integer,
	"approval_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "business_youth_relationships" (
	"business_id" integer NOT NULL,
	"youth_id" integer NOT NULL,
	"role" text DEFAULT 'Member' NOT NULL,
	"join_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "business_youth_relationships_business_id_youth_id_pk" PRIMARY KEY("business_id","youth_id")
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"youth_id" integer NOT NULL,
	"certification_name" text NOT NULL,
	"issuing_organization" text,
	"issue_date" date,
	"expiry_date" date,
	"certification_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education" (
	"id" serial PRIMARY KEY NOT NULL,
	"youth_id" integer NOT NULL,
	"highest_qualification" text,
	"specialization" text,
	"highest_level_completed" text,
	"institution" text,
	"graduation_year" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"equipment_name" text NOT NULL,
	"equipment_type" text,
	"manufacturer" text,
	"model" text,
	"purchase_date" date,
	"purchase_price" integer,
	"current_value" integer,
	"condition" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mentor_business_relationships" (
	"mentor_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"assigned_date" date DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"mentorship_focus" text,
	"meeting_frequency" text DEFAULT 'Monthly',
	"last_meeting_date" date,
	"next_meeting_date" date,
	"mentorship_goals" json DEFAULT '[]'::json,
	"mentorship_progress" text,
	"progress_rating" integer,
	CONSTRAINT "mentor_business_relationships_mentor_id_business_id_pk" PRIMARY KEY("mentor_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "mentors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"assigned_district" text,
	"assigned_districts" json DEFAULT '[]'::json NOT NULL,
	"specialization" text,
	"bio" text,
	"profile_picture" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mentorship_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"meeting_date" date NOT NULL,
	"meeting_type" text NOT NULL,
	"location" text,
	"duration" integer,
	"agenda" text,
	"summary" text,
	"outcomes" json DEFAULT '[]'::json,
	"next_steps" json DEFAULT '[]'::json,
	"attendees" json DEFAULT '[]'::json,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mentorship_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"message" text NOT NULL,
	"sender" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"category" text,
	"is_read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_name" text NOT NULL,
	"report_type" text NOT NULL,
	"report_period" text,
	"start_date" date,
	"end_date" date,
	"parameters" json DEFAULT '{}'::json,
	"generated_by" integer,
	"download_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "service_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "service_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" integer,
	"subcategory_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "training_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_name" text NOT NULL,
	"description" text,
	"program_type" text,
	"duration" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'mentee' NOT NULL,
	"district" text,
	"profile_picture" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "youth_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"participant_code" text,
	"full_name" text NOT NULL,
	"profile_picture" text,
	"district" text NOT NULL,
	"town" text,
	"phone_number" text,
	"email" text,
	"gender" text,
	"marital_status" text,
	"children_count" integer DEFAULT 0,
	"year_of_birth" integer,
	"age" integer,
	"age_group" text,
	"social_media_links" json DEFAULT '{}'::json,
	"core_skills" text,
	"skill_level" text,
	"industry_expertise" text,
	"languages_spoken" json DEFAULT '[]'::json,
	"communication_style" text,
	"years_of_experience" integer,
	"work_history" json DEFAULT '[]'::json,
	"business_interest" text,
	"employment_status" text,
	"specific_job" text,
	"pwd_status" text,
	"dare_model" text,
	"is_madam" boolean DEFAULT false,
	"is_apprentice" boolean DEFAULT false,
	"madam_name" text,
	"madam_phone" text,
	"apprentice_names" json DEFAULT '[]'::json,
	"apprentice_phone" text,
	"guarantor" text,
	"guarantor_phone" text,
	"digital_skills" text,
	"digital_skills_2" text,
	"financial_aspirations" text,
	"dependents" text,
	"national_id" text,
	"training_status" text,
	"program_status" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "youth_profiles_participant_code_unique" UNIQUE("participant_code")
);
--> statement-breakpoint
CREATE TABLE "youth_skills" (
	"youth_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"proficiency" text DEFAULT 'Intermediate',
	"is_primary" boolean DEFAULT false,
	"years_of_experience" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "youth_skills_youth_id_skill_id_pk" PRIMARY KEY("youth_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "youth_training" (
	"id" serial PRIMARY KEY NOT NULL,
	"youth_id" integer NOT NULL,
	"program_id" integer NOT NULL,
	"start_date" date,
	"completion_date" date,
	"status" text DEFAULT 'In Progress',
	"certification_received" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "business_activity_log" ADD CONSTRAINT "business_activity_log_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_activity_log" ADD CONSTRAINT "business_activity_log_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_advice" ADD CONSTRAINT "business_advice_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_advice" ADD CONSTRAINT "business_advice_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_advice" ADD CONSTRAINT "business_advice_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_advice" ADD CONSTRAINT "business_advice_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD CONSTRAINT "business_tracking_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD CONSTRAINT "business_tracking_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD CONSTRAINT "business_tracking_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_youth_relationships" ADD CONSTRAINT "business_youth_relationships_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_youth_relationships" ADD CONSTRAINT "business_youth_relationships_youth_id_youth_profiles_id_fk" FOREIGN KEY ("youth_id") REFERENCES "public"."youth_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_youth_id_youth_profiles_id_fk" FOREIGN KEY ("youth_id") REFERENCES "public"."youth_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education" ADD CONSTRAINT "education_youth_id_youth_profiles_id_fk" FOREIGN KEY ("youth_id") REFERENCES "public"."youth_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory" ADD CONSTRAINT "equipment_inventory_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_business_relationships" ADD CONSTRAINT "mentor_business_relationships_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_business_relationships" ADD CONSTRAINT "mentor_business_relationships_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_meetings" ADD CONSTRAINT "mentorship_meetings_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_meetings" ADD CONSTRAINT "mentorship_meetings_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_meetings" ADD CONSTRAINT "mentorship_meetings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_messages" ADD CONSTRAINT "mentorship_messages_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_messages" ADD CONSTRAINT "mentorship_messages_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subcategories" ADD CONSTRAINT "service_subcategories_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_subcategory_id_service_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."service_subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD CONSTRAINT "youth_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youth_skills" ADD CONSTRAINT "youth_skills_youth_id_youth_profiles_id_fk" FOREIGN KEY ("youth_id") REFERENCES "public"."youth_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youth_skills" ADD CONSTRAINT "youth_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youth_training" ADD CONSTRAINT "youth_training_youth_id_youth_profiles_id_fk" FOREIGN KEY ("youth_id") REFERENCES "public"."youth_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youth_training" ADD CONSTRAINT "youth_training_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;