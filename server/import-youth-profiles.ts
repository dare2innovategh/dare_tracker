// server/import-youth-profiles.ts
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { db } from "./db";
import { youthProfiles } from "@shared/schema";
import type { DareModel } from "@shared/schema";

// Normalize free-text into your enum
const DARE_MAP: Record<string, DareModel> = {
  Collaborative: "Collaborative",
  MakerSpace: "MakerSpace",
  "Maker Space": "MakerSpace",
  "Madam Anchor": "Madam Anchor",
  "Job Anchor": "Madam Anchor",
};

// Helper function to safely convert strings to numbers
function safeNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

// Helper function to safely convert strings to booleans
function safeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'yes' || lower === 'true' || lower === '1';
  }
  return Boolean(Number(value));
}

// Helper function to parse date from YOB - always January 1st with fallback
function parseYearOfBirth(yob: any, age: any): { dateOfBirth: Date, yearOfBirth: number | null } {
  // First try to use YOB if available
  if (yob) {
    const year = safeNumber(yob);
    if (year >= 1900 && year <= new Date().getFullYear()) {
      return {
        dateOfBirth: new Date(`${year}-01-01`),
        yearOfBirth: year
      };
    }
  }
  
  // If no YOB, try to calculate from age
  if (age) {
    const ageNum = safeNumber(age);
    if (ageNum > 0 && ageNum < 120) {
      const currentYear = new Date().getFullYear();
      const estimatedYear = currentYear - ageNum;
      return {
        dateOfBirth: new Date(`${estimatedYear}-01-01`),
        yearOfBirth: estimatedYear
      };
    }
  }
  
  // Fallback: use a default date for unknown ages (e.g., 1990-01-01)
  // This ensures we never have null date_of_birth
  return {
    dateOfBirth: new Date('1990-01-01'),
    yearOfBirth: null // Keep yearOfBirth null to indicate it's estimated/unknown
  };
}

// Helper function to create emergency contact JSON
function createEmergencyContact(name: string, phone: string, email: string, address: string, relationship: string) {
  const contact: any = {};
  if (name) contact.name = name;
  if (phone) contact.phone = phone;
  if (email) contact.email = email;
  if (address) contact.address = address;
  if (relationship) contact.relationship = relationship;
  return Object.keys(contact).length > 0 ? contact : {};
}

// Helper function to extract district from participant code
function getDistrictFromCode(participantCode: string): string {
  if (!participantCode) return "Bekwai"; // Default fallback
  
  // Extract the 3-digit code after 'D' (e.g., D0037000658 -> 003)
  const match = participantCode.match(/^D(\d{3})/);
  if (match) {
    const code = match[1];
    switch (code) {
      case '001': return 'Bekwai';
      case '002': return 'Lower Manya Krobo';
      case '003': return 'Gushegu';
      default: return 'Bekwai'; // Default fallback
    }
  }
  
  return "Bekwai"; // Default fallback if no match
}
function parseNameParts(fullName: string, firstName?: string, middleName?: string, lastName?: string) {
  // If we have individual parts, use them
  if (firstName && lastName) {
    return {
      firstName: firstName.trim(),
      middleName: middleName?.trim() || null,
      lastName: lastName.trim()
    };
  }
  
  // Otherwise, try to parse from full name
  if (fullName) {
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      return {
        firstName: nameParts[0],
        middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null,
        lastName: nameParts[nameParts.length - 1]
      };
    } else if (nameParts.length === 1) {
      return {
        firstName: nameParts[0],
        middleName: null,
        lastName: nameParts[0] // Use same as first name as fallback
      };
    }
  }
  
  // Fallback
  return {
    firstName: firstName || lastName || "Unknown",
    middleName: middleName || null,
    lastName: lastName || firstName || "Unknown"
  };
}

async function main() {
  // Test database connection first
  try {
    console.log("Testing database connection...");
    await db.execute("SELECT 1");
    console.log("✅ Database connection successful!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    
    if (error.code === 'EACCES') {
      console.log("\n🔧 Fix database connection issues first:");
      console.log("1. Check if database server is running");
      console.log("2. Verify credentials in .env file");
      console.log("3. Ensure firewall allows port 5432");
      console.log("4. If using Docker, check container status");
    }
    process.exit(1);
  }

  // 1) CSV in project root
  const filePath = path.resolve(process.cwd(), "transitioned.csv");

  // 2) Parse as comma-delimited CSV, strip BOM
  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }));

  const rows: any[] = [];
  for await (const record of parser) {
    rows.push(record);
  }
  console.log(`Loaded ${rows.length} rows. Inserting…`);

  let successCount = 0;
  let errorCount = 0;

  // 3) Map & insert
  for (const r of rows) {
    // Parse name parts with fallback logic
    const fullName = r["Full Name"] || 
                    [r["First Name"], r["Middle Name"], r.Surname].filter(Boolean).join(" ") || 
                    null;
    
    const nameParts = parseNameParts(
      fullName,
      r["First Name"],
      r["Middle Name"], 
      r.Surname
    );

    // Parse birth year and date with age fallback
    const birthData = parseYearOfBirth(r.YOB, r.Age);

    const payload = {
      // Identification - using correct CSV column names
      participantCode: r.Participant_Code || null,
      fullName: fullName,
      preferredName: r["Preferred Name"] || null,
      profilePicture: null,

      // Personal Info - using parsed name parts
      firstName: nameParts.firstName,
      middleName: nameParts.middleName,
      lastName: nameParts.lastName,
      dateOfBirth: birthData.dateOfBirth,
      yearOfBirth: birthData.yearOfBirth,
      age: safeNumber(r.Age) || null,
      ageGroup: r.Age_Group || null,
      gender: r.Gender || null,
      maritalStatus: r.Marital_Status || null,
      childrenCount: safeNumber(r.Children),
      dependents: r.Dependents || null,
      nationalId: r["National ID Number"] || null,
      pwdStatus: r.Disability_Status || null,

      // Location & Contact - using correct CSV column names with district fallback
      district: r.District || getDistrictFromCode(r.Participant_Code),
      town: r.Town || null,
      homeAddress: r["Home Address"] || null,
      country: r.Country || "Ghana",
      adminLevel1: r["Admin Level 1"] || null,
      adminLevel2: r["Admin Level 2"] || null,
      adminLevel3: r["Admin Level 3"] || null,
      adminLevel4: r["Admin Level 4"] || null,
      adminLevel5: r["Admin Level 5"] || null,
      phoneNumber: r["Primary Phone"] || null,
      additionalPhoneNumber1: r["Additional Phone 1"] || null,
      additionalPhoneNumber2: r["Additional Phone 2"] || null,
      email: r["Email Address"] || null,

      // Emergency Contact - create JSON object
      emergencyContact: createEmergencyContact(
        r["Emergency Contact Name"],
        r["Emergency Phone"],
        r["Emergency Email"],
        r["Emergency Address"],
        r.Relationship
      ),

      // Education & Skills
      highestEducationLevel: r["Highest Education Level"] || r.Education_Level || null,
      activeStudentStatus: safeBoolean(r["Currently a Student?"]) || 
                          safeBoolean(r["Recruited for Training"]),
      coreSkills: r.Core_Skills || null,
      skillLevel: r["Skill Level"] || null,
      industryExpertise: r.Industry_Expertise || null,
      languagesSpoken: r["Languages Spoken"] ? [r["Languages Spoken"]] : [],
      communicationStyle: r["Communication Style"] || null,
      digitalSkills: r["Digital Skills (Primary)"] || null,
      digitalSkills2: r["Digital Skills (Secondary)"] || null,

      // Portfolio & Work
      yearsOfExperience: safeNumber(r["Years of Experience"]) || null,
      workHistory: r["Work History"] || null,

      // Program Participation
      businessInterest: r.Business_Interest || null,
      employmentStatus: r.Employment_Status || null,
      employmentType: r["Employment Type"] || null,
      specificJob: r.Specific_Job || null,
      trainingStatus: r.Training_Status || null,
      programStatus: r.Program_Status || null,
      transitionStatus: r["Transition Status"] || null,
      onboardedToTracker: safeBoolean(r["Onboarded to Tracker?"]),

      // DARE Model
      dareModel: DARE_MAP[r.DARE_Model] || null,

      // Madam / Apprentice - mapped from Skills Trainer
      madamName: r["Skills Trainer Name"] || null,
      madamPhone: r["Skills Trainer Phone"] || null,

      // Mentor & Guarantor
      localMentorName: r["Local Hub Guide Name"] || null,
      localMentorContact: r["Local Hub Guide Contact"] || null,
      guarantor: r.Guarantor_Name || null,
      guarantorPhone: r.Guarantor_Phone || null,

      // Partner & Refugee Support - with defaults
      implementingPartnerName: r["Implementing Partner Name"] || 'University of Ghana Business School (UGBS)',
      refugeeStatus: r["Refugee Status?"] ? safeBoolean(r["Refugee Status?"]) : false,
      idpStatus: r["IDP Status?"] ? safeBoolean(r["IDP Status?"]) : false,
      communityHostsRefugees: r["Community Hosts Refugees?"] ? safeBoolean(r["Community Hosts Refugees?"]) : false,

      // Program Details - with defaults
      partnerStartDate: r["Partner Start Date"] ? new Date(r["Partner Start Date"]) : null,
      programName: r["Program Name"] || 'Digital Access for Rural Empowerment (DARE)',
      programDetails: r["Program Details"] || 'Support for youth-led businesses in Ghana',
      programContactPerson: r["Program Contact Person"] || 'Prof. Richard Boateng',
      programContactPhoneNumber: r["Program Contact Phone Number"] || '+233248852426',
      cohort: null, // Not in CSV

      // Flags & Meta
      newDataSubmission: safeBoolean(r["New Data Submission"]),
      isDeleted: false,
      hostCommunityStatus: null, // Not in CSV
      financialAspirations: r.Financial_Aspirations || null,
    };

    try {
      await db
        .insert(youthProfiles)
        .values(payload)
        .onConflictDoNothing()
        .execute();
      
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`Processed ${successCount} records...`);
      }
    } catch (e) {
      console.error(`Failed to insert row for ${payload.participantCode}:`, e);
      errorCount++;
    }
  }

  console.log(`Done! Successfully inserted: ${successCount}, Errors: ${errorCount}`);
}

main().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});