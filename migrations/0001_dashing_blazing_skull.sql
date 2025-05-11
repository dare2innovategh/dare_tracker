CREATE TABLE "business_makerspace_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"makerspace_id" integer NOT NULL,
	"assigned_date" timestamp DEFAULT now(),
	"assigned_by" integer,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "business_resource_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" integer NOT NULL,
	"cost_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" date DEFAULT now(),
	"description" text,
	"receipt" text,
	"recorded_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "business_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"resource_name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'Available',
	"quantity" integer DEFAULT 1,
	"acquisition_date" date,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"supplier" text,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "business_tracking_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tracking_id" integer NOT NULL,
	"attachment_name" text NOT NULL,
	"attachment_type" text NOT NULL,
	"attachment_url" text NOT NULL,
	"uploaded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"created_by" integer,
	CONSTRAINT "custom_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "feasibility_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer DEFAULT null NOT NULL,
	"youth_id" integer DEFAULT null NOT NULL,
	"assessment_date" timestamp DEFAULT now() NOT NULL,
	"assessment_by" integer DEFAULT null NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"overall_feasibility_percentage" numeric(5, 2) DEFAULT null NOT NULL,
	"review_comments" text DEFAULT null NOT NULL,
	"recommendations" text DEFAULT null NOT NULL,
	"risk_factors" text DEFAULT null NOT NULL,
	"growth_opportunities" text DEFAULT null NOT NULL,
	"recommended_actions" text DEFAULT null NOT NULL,
	"reviewed_by" integer DEFAULT null NOT NULL,
	"review_date" timestamp DEFAULT null NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"planned_business_location" text DEFAULT null NOT NULL,
	"is_ground_rent_required" boolean DEFAULT null NOT NULL,
	"has_structure_or_stall" boolean DEFAULT null NOT NULL,
	"structure_needs" text DEFAULT null NOT NULL,
	"estimated_space_cost" numeric(12, 2) DEFAULT null NOT NULL,
	"space_cost_contribution" numeric(12, 2) DEFAULT null NOT NULL,
	"equipment_needed" json DEFAULT '[]'::json NOT NULL,
	"equipment_currently_owned" json DEFAULT '[]'::json NOT NULL,
	"equipment_missing" json DEFAULT '[]'::json NOT NULL,
	"equipment_total_cost" numeric(12, 2) DEFAULT null NOT NULL,
	"equipment_cost_contribution" numeric(12, 2) DEFAULT null NOT NULL,
	"startup_supplies_needed" json DEFAULT '[]'::json NOT NULL,
	"supplies_currently_owned" json DEFAULT '[]'::json NOT NULL,
	"supplies_missing" json DEFAULT '[]'::json NOT NULL,
	"supplies_total_cost" numeric(12, 2) DEFAULT null NOT NULL,
	"supplies_cost_contribution" numeric(12, 2) DEFAULT null NOT NULL,
	"marketing_tools_needed" json DEFAULT '[]'::json NOT NULL,
	"marketing_tools_currently_owned" json DEFAULT '[]'::json NOT NULL,
	"marketing_tools_missing" json DEFAULT '[]'::json NOT NULL,
	"marketing_total_cost" numeric(12, 2) DEFAULT null NOT NULL,
	"marketing_cost_contribution" numeric(12, 2) DEFAULT null NOT NULL,
	"needs_delivery" boolean DEFAULT null NOT NULL,
	"delivery_method" text DEFAULT null NOT NULL,
	"delivery_resources_available" text DEFAULT null NOT NULL,
	"delivery_setup_cost" numeric(12, 2) DEFAULT null NOT NULL,
	"delivery_cost_contribution" numeric(12, 2) DEFAULT null NOT NULL,
	"monthly_non_business_expenses" numeric(12, 2) DEFAULT null NOT NULL,
	"fixed_financial_obligations" text DEFAULT null NOT NULL,
	"expected_price" numeric(12, 2) DEFAULT null NOT NULL,
	"expected_sales_daily" numeric(12, 2) DEFAULT null NOT NULL,
	"expected_sales_weekly" numeric(12, 2) DEFAULT null NOT NULL,
	"expected_sales_monthly" numeric(12, 2) DEFAULT null NOT NULL,
	"expected_monthly_revenue" numeric(12, 2) DEFAULT null NOT NULL,
	"expected_monthly_expenditure" numeric(12, 2) DEFAULT null NOT NULL,
	"expected_monthly_savings" numeric(12, 2) DEFAULT null NOT NULL,
	"expected_pay_to_self" numeric(12, 2) DEFAULT null NOT NULL,
	"is_plan_feasible" boolean DEFAULT null NOT NULL,
	"plan_adjustments" text DEFAULT null NOT NULL,
	"seed_capital_needed" numeric(12, 2) DEFAULT null NOT NULL,
	"seed_capital_usage" text DEFAULT null NOT NULL
);
--> statement-breakpoint
CREATE TABLE "makerspace_resource_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" integer NOT NULL,
	"cost_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" date DEFAULT now(),
	"description" text,
	"receipt" text,
	"recorded_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "makerspace_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"makerspace_id" integer NOT NULL,
	"resource_name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'Available',
	"quantity" integer DEFAULT 1,
	"acquisition_date" date,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"supplier" text,
	"notes" text,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "makerspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text NOT NULL,
	"coordinates" text,
	"district" text NOT NULL,
	"contact_phone" text,
	"contact_email" text,
	"contact_person" text,
	"operating_hours" text,
	"open_date" date,
	"resource_count" integer DEFAULT 0,
	"member_count" integer DEFAULT 0,
	"facilities" text,
	"status" text DEFAULT 'Active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "permissions_resource_action_pk" PRIMARY KEY("resource","action")
);
--> statement-breakpoint
CREATE TABLE "portfolio_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"youth_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"client" text,
	"project_url" text,
	"repository_url" text,
	"featured_image" text,
	"start_date" date,
	"completion_date" date,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"skills" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer,
	"parameters" json DEFAULT '{}'::json,
	"filters" json DEFAULT '{}'::json,
	"run_by" integer,
	"result_count" integer,
	"status" text DEFAULT 'pending',
	"format" text,
	"output_url" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"error" text,
	"include_charts" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"role" text,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100),
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_editable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "social_media_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"youth_id" integer NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"username" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"youth_id" integer NOT NULL,
	"project_id" integer,
	"client_name" text NOT NULL,
	"client_title" text,
	"client_company" text,
	"client_image" text,
	"testimonial_text" text NOT NULL,
	"rating" integer,
	"date_received" date,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "youth_report_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer,
	"name" text NOT NULL,
	"filters" json DEFAULT '{}'::json,
	"parameters" json DEFAULT '{}'::json,
	"export_format" text DEFAULT 'pdf',
	"result_count" integer,
	"status" text DEFAULT 'pending',
	"output_url" text,
	"error_message" text,
	"executed_by" integer,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "youth_report_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"report_type" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"filters" json DEFAULT '{}'::json,
	"columns" json DEFAULT '[]'::json,
	"sort_by" text,
	"sort_direction" text DEFAULT 'asc',
	"group_by" text,
	"chart_options" json DEFAULT '{}'::json,
	"display_options" json DEFAULT '{}'::json,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP CONSTRAINT "youth_profiles_participant_code_unique";--> statement-breakpoint
ALTER TABLE "business_tracking" DROP CONSTRAINT "business_tracking_reviewer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "business_tracking" DROP CONSTRAINT "business_tracking_approved_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_generated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP CONSTRAINT "youth_profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "business_profiles" ALTER COLUMN "business_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business_profiles" ALTER COLUMN "district" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business_profiles" ALTER COLUMN "business_objectives" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "business_tracking" ALTER COLUMN "business_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business_tracking" ALTER COLUMN "tracking_date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "business_tracking" ALTER COLUMN "tracking_month" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "business_tracking" ALTER COLUMN "tracking_year" SET DEFAULT 2025;--> statement-breakpoint
ALTER TABLE "business_tracking" ALTER COLUMN "tracking_period" SET DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE "youth_profiles" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "youth_profiles" ALTER COLUMN "full_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "youth_profiles" ALTER COLUMN "district" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "youth_profiles" ALTER COLUMN "work_history" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ALTER COLUMN "work_history" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "short_term_goals" json;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "tax_identification_number" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "implementing_partner_name" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "enterprise_unique_identifier" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "enterprise_owner_youth_ids" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "enterprise_owner_name" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "enterprise_owner_dob" date;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "enterprise_owner_sex" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "enterprise_type" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "enterprise_size" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "sub_partner_names" json;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "total_youth_in_work_reported" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "youth_refugee_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "youth_idp_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "youth_host_community_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "youth_plwd_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "sector" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "primary_phone_number" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "additional_phone_number_1" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "additional_phone_number_2" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "business_email" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "country" text DEFAULT 'Ghana';--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "admin_level_1" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "admin_level_2" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "admin_level_3" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "admin_level_4" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "admin_level_5" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "partner_start_date" date;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "program_name" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "program_details" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "program_contact_person" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "program_contact_phone_number" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "delivery_setup" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "delivery_type" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "expected_weekly_revenue" integer;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "expected_monthly_revenue" integer;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "anticipated_monthly_expenditure" integer;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "expected_monthly_profit" integer;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "payment_structure" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "social_media_links" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "new_data_submission" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "profile_id" integer;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "recorded_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "mentor_id" integer;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "resources" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "equipment" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "decisions" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "lessons" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "next_steps" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "mentor_feedback" text;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "verified_by" integer;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "verification_date" timestamp;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "certifications" ADD COLUMN "credential_id" text;--> statement-breakpoint
ALTER TABLE "certifications" ADD COLUMN "credential_url" text;--> statement-breakpoint
ALTER TABLE "certifications" ADD COLUMN "skills" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "certifications" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "education" ADD COLUMN "qualification_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "education" ADD COLUMN "qualification_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "education" ADD COLUMN "level_completed" text;--> statement-breakpoint
ALTER TABLE "education" ADD COLUMN "is_highest_qualification" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "education" ADD COLUMN "certificate_url" text;--> statement-breakpoint
ALTER TABLE "education" ADD COLUMN "qualification_status" text DEFAULT 'Completed';--> statement-breakpoint
ALTER TABLE "education" ADD COLUMN "additional_details" text;--> statement-breakpoint
ALTER TABLE "education" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "is_template" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "filters" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "columns" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "sort_by" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "sort_direction" text DEFAULT 'asc';--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "group_by" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "chart_options" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "last_run_by" integer;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "last_run_at" timestamp;--> statement-breakpoint
ALTER TABLE "training_programs" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "training_programs" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "training_programs" ADD COLUMN "total_modules" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "training_programs" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "preferred_name" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "middle_name" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "home_address" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "country" text DEFAULT 'Ghana';--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "admin_level_1" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "admin_level_2" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "admin_level_3" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "admin_level_4" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "admin_level_5" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "additional_phone_number_1" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "additional_phone_number_2" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "emergency_contact" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "highest_education_level" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "active_student_status" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "transition_status" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "onboarded_to_tracker" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "local_mentor_name" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "local_mentor_contact" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "implementing_partner_name" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "refugee_status" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "idp_status" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "community_hosts_refugees" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "partner_start_date" date;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "program_name" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "program_details" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "program_contact_person" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "program_contact_phone_number" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "cohort" text;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "new_data_submission" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "youth_profiles" ADD COLUMN "host_community_status" text;--> statement-breakpoint
ALTER TABLE "youth_training" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "business_makerspace_assignments" ADD CONSTRAINT "business_makerspace_assignments_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_makerspace_assignments" ADD CONSTRAINT "business_makerspace_assignments_makerspace_id_makerspaces_id_fk" FOREIGN KEY ("makerspace_id") REFERENCES "public"."makerspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_makerspace_assignments" ADD CONSTRAINT "business_makerspace_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_resource_costs" ADD CONSTRAINT "business_resource_costs_resource_id_business_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."business_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_resource_costs" ADD CONSTRAINT "business_resource_costs_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_resources" ADD CONSTRAINT "business_resources_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_resources" ADD CONSTRAINT "business_resources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_tracking_attachments" ADD CONSTRAINT "business_tracking_attachments_tracking_id_business_tracking_id_fk" FOREIGN KEY ("tracking_id") REFERENCES "public"."business_tracking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_tracking_attachments" ADD CONSTRAINT "business_tracking_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feasibility_assessments" ADD CONSTRAINT "feasibility_assessments_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feasibility_assessments" ADD CONSTRAINT "feasibility_assessments_youth_id_youth_profiles_id_fk" FOREIGN KEY ("youth_id") REFERENCES "public"."youth_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feasibility_assessments" ADD CONSTRAINT "feasibility_assessments_assessment_by_users_id_fk" FOREIGN KEY ("assessment_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feasibility_assessments" ADD CONSTRAINT "feasibility_assessments_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makerspace_resource_costs" ADD CONSTRAINT "makerspace_resource_costs_resource_id_makerspace_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."makerspace_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makerspace_resource_costs" ADD CONSTRAINT "makerspace_resource_costs_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makerspace_resources" ADD CONSTRAINT "makerspace_resources_makerspace_id_makerspaces_id_fk" FOREIGN KEY ("makerspace_id") REFERENCES "public"."makerspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makerspace_resources" ADD CONSTRAINT "makerspace_resources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makerspace_resources" ADD CONSTRAINT "makerspace_resources_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_youth_id_youth_profiles_id_fk" FOREIGN KEY ("youth_id") REFERENCES "public"."youth_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_project_id_portfolio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."portfolio_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_run_by_users_id_fk" FOREIGN KEY ("run_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_links" ADD CONSTRAINT "social_media_links_youth_id_youth_profiles_id_fk" FOREIGN KEY ("youth_id") REFERENCES "public"."youth_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_youth_id_youth_profiles_id_fk" FOREIGN KEY ("youth_id") REFERENCES "public"."youth_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_project_id_portfolio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."portfolio_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youth_report_executions" ADD CONSTRAINT "youth_report_executions_template_id_youth_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."youth_report_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youth_report_executions" ADD CONSTRAINT "youth_report_executions_executed_by_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youth_report_templates" ADD CONSTRAINT "youth_report_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD CONSTRAINT "business_tracking_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD CONSTRAINT "business_tracking_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_tracking" ADD CONSTRAINT "business_tracking_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_last_run_by_users_id_fk" FOREIGN KEY ("last_run_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profiles" DROP COLUMN "work_samples";--> statement-breakpoint
ALTER TABLE "business_tracking" DROP COLUMN "projected_sales";--> statement-breakpoint
ALTER TABLE "business_tracking" DROP COLUMN "actual_sales";--> statement-breakpoint
ALTER TABLE "business_tracking" DROP COLUMN "reviewer_id";--> statement-breakpoint
ALTER TABLE "business_tracking" DROP COLUMN "review_date";--> statement-breakpoint
ALTER TABLE "business_tracking" DROP COLUMN "review_notes";--> statement-breakpoint
ALTER TABLE "business_tracking" DROP COLUMN "approval_status";--> statement-breakpoint
ALTER TABLE "business_tracking" DROP COLUMN "approved_by_id";--> statement-breakpoint
ALTER TABLE "business_tracking" DROP COLUMN "approval_date";--> statement-breakpoint
ALTER TABLE "certifications" DROP COLUMN "certification_url";--> statement-breakpoint
ALTER TABLE "education" DROP COLUMN "highest_qualification";--> statement-breakpoint
ALTER TABLE "education" DROP COLUMN "highest_level_completed";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "report_name";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "parameters";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "generated_by";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "download_url";--> statement-breakpoint
ALTER TABLE "training_programs" DROP COLUMN "program_name";--> statement-breakpoint
ALTER TABLE "training_programs" DROP COLUMN "program_type";--> statement-breakpoint
ALTER TABLE "training_programs" DROP COLUMN "duration";--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP COLUMN "social_media_links";--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP COLUMN "work_samples";--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP COLUMN "case_studies";--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP COLUMN "is_madam";--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP COLUMN "is_apprentice";--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP COLUMN "apprentice_names";--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP COLUMN "apprentice_phone";--> statement-breakpoint
ALTER TABLE "youth_profiles" DROP COLUMN "financial_aspirations";