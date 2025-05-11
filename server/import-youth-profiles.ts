// server/import-youth-profiles.ts
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { db } from "./db";                // ← adjust path if your Drizzle client lives elsewhere
import { youthProfiles } from "@shared/schema";
import type { DareModel } from "@shared/schema";

// Normalize free-text into your enum
const DARE_MAP: Record<string, DareModel> = {
  Collaborative: "Collaborative",
  MakerSpace:    "MakerSpace",
  "Maker Space": "MakerSpace",
  "Madam Anchor":"Madam Anchor",
  "Job Anchor":  "Madam Anchor",
};

async function main() {
  // 1) CSV in project root
  const filePath = path.resolve(process.cwd(), "transitioned.csv");

  // 2) Parse as comma-delimited CSV, strip BOM
  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({
      columns:           true,
      skip_empty_lines:  true,
      trim:              true,
      bom:               true,
      // no delimiter override = comma by default
    }));

  const rows: any[] = [];
  for await (const record of parser) {
    rows.push(record);
  }
  console.log(`Loaded ${rows.length} rows. Inserting…`);

  // 3) Map & insert
  for (const r of rows) {
    const payload = {
      // Identification
      participantCode:         r.Participant_Code,
      fullName:                [r.Name, r.Surname, r.Other_Names].filter(Boolean).join(" "),
      profilePicture:          null,

      // Personal
      firstName:               r.Name,
      middleName:              r.Other_Names || null,
      lastName:                r.Surname,
      preferredName:           null,
      dateOfBirth:             r.YOB ? new Date(`${r.YOB}-01-01`) : null,
      gender:                  r.Gender || null,
      maritalStatus:           r.Marital_Status || null,
      childrenCount:           Number(r.Children) || 0,
      dependents:              r.Dependents || null,
      nationalId:              r["National ID Number"] || null,
      pwdStatus:               r.PWD_Status || null,
      ageGroup:                r.Age_Group || null,

      // Contact
      phoneNumber:             String(r.Phone_Number),
      additionalPhoneNumber1:  null,
      additionalPhoneNumber2:  null,
      email:                   null,
      homeAddress:             null,

      // Location
      district:                r.District || null,
      town:                    r.Town || null,
      country:                 "Ghana",
      adminLevel1:             null,
      adminLevel2:             null,
      adminLevel3:             null,
      adminLevel4:             null,
      adminLevel5:             null,

      // Program Participation
      activeStudentStatus:     String(r["Recruited for Training"]).toLowerCase() === "yes",
      trainingStatus:          r.Training_Status    || null,
      programStatus:           r.Program_Status     || null,
      employmentStatus:        r.Employment_Status  || null,
      specificJob:             r.Specific_Job       || null,
      businessInterest:        r.Business_Interest  || null,

      // DARE
      dareModel:               DARE_MAP[r.DARE_Model] ?? null,

      // Madam / Apprentice
      isMadam:                 Boolean(Number(r.Is_Madam)),
      isApprentice:            Boolean(Number(r.Is_Apprentice)),
      madamName:               r.Madam_Name         || null,
      madamPhone:              r.Madam_Phone        || null,
      apprenticeNames:         r["Apprentice_Name(s)"] || null,
      apprenticePhone:         r.Apprentice_Phone   || null,

      // Mentor & Guarantor
      localMentorName:         r.Local_Mentor       || null,
      localMentorContact:      r.Local_Mentor_Contact || null,
      guarantor:               r.Guarantor_Name     || null,
      guarantorPhone:          r.Guarantor_Phone    || null,

      // Emergency Contact
      emergencyContact:        JSON.stringify({
                                 name: r.Emergency_Contact || null,
                               }),

      // Skills & Finance
      coreSkills:              r.Core_Skills        || null,
      industryExpertise:       r.Industry_Expertise || null,
      highestEducationLevel:   r.Education_Level    || null,
      financialAspirations:    r.Financial_Aspirations || null,

      // Defaults & extras
      digitalSkills:           null,
      digitalSkills2:          null,
      newDataSubmission:       true,
      transitionStatus:        null,
      onboardedToTracker:      false,
      programName:             null,
      programDetails:          null,
      programContactPerson:    null,
      programContactPhoneNumber: null,
      implementingPartnerName:   null,
      refugeeStatus:              false,
      idpStatus:                  false,
      communityHostsRefugees:      false,
      partnerStartDate:            null,
      isDeleted:                   false,
      hostCommunityStatus:         null,
    };

    try {
      await db
        .insert(youthProfiles)
        .values(payload)
        .onConflictDoNothing()
        .execute();         // ← modern Drizzle uses .execute()
    } catch (e) {
      console.error("Failed to insert row:", payload, e);
    }
  }

  console.log("Done!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
