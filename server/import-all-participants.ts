import { db } from './db';
import { users, youthProfiles } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import * as fs from 'fs';
import * as readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const scryptAsync = promisify(scrypt);

/**
 * Hash a password
 * @param password - The password to hash
 * @returns The hashed password
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Define participant structure based on the data format
interface Participant {
  participantCode: string; // D00XXXXXXX format
  fullName: string;
  phone: string;
  phoneNumber: string;
  gender: string;
  maritalStatus: string;
  childrenCount: number;
  yearOfBirth: number | null;
  age: number | null;
  ageGroup: string;
  district: string;
  town: string;
  coreSkills: string;
  businessInterest: string;
  employmentStatus: string;
  specificJob: string;
  pwdStatus: string;
  dareModel: string;
  isMadam: boolean;
  isApprentice: boolean;
  madamName: string;
  madamPhone: string;
  apprenticeNames: string[];
  apprenticePhone: string;
  guarantor: string;
  guarantorPhone: string;
  digitalSkills: string;
  digitalSkills2: string;
  financialAspirations: string;
  dependents: string;
  nationalId: string;
  trainingStatus: string;
  programStatus: string;
}

/**
 * Parse a participant data row from the tab-delimited file
 * @param line - Line from the tab-delimited file
 * @returns Parsed participant object or null if line is invalid
 */
function parseParticipantLine(line: string): Participant | null {
  const fields = line.split('\t');
  
  // Skip header line or invalid lines (must have at least 8 fields)
  if (fields.length < 8 || fields[0] === 'Contacted' || !fields[2]) {
    return null;
  }
  
  // Skip lines where the contacted status is 'No'
  if (fields[0] === 'No') {
    return null;
  }
  
  // Create a participant object with default values
  const participant: Participant = {
    participantCode: fields[2]?.trim() || '',
    fullName: fields[3]?.trim() || '',
    phone: fields[4]?.trim() || '',
    phoneNumber: fields[5]?.trim() || '',
    gender: fields[6]?.trim() || '',
    maritalStatus: fields[7]?.trim() || '',
    childrenCount: parseInt(fields[8]) || 0,
    yearOfBirth: fields[9] ? parseInt(fields[9]) : null,
    age: fields[10] ? parseInt(fields[10]) : null,
    ageGroup: fields[11]?.trim() || '',
    district: fields[12]?.trim() || '',
    town: fields[13]?.trim() || '',
    coreSkills: fields[14]?.trim() || '',
    businessInterest: fields[17]?.trim() || 'Not Specified',
    employmentStatus: fields[18]?.trim() || 'Not Specified',
    specificJob: fields[19]?.trim() || '',
    pwdStatus: fields[20]?.trim() || 'Not Disabled',
    dareModel: fields[21]?.trim() || '',
    isMadam: fields[27] === '1',
    isApprentice: fields[28] === '1',
    madamName: fields[29]?.trim() || '',
    madamPhone: fields[30]?.trim() || '',
    apprenticeNames: [],
    apprenticePhone: fields[32]?.trim() || '',
    guarantor: fields[33]?.trim() || '',
    guarantorPhone: fields[34]?.trim() || '',
    digitalSkills: fields[36]?.trim() || '',
    digitalSkills2: fields[37]?.trim() || '',
    financialAspirations: fields[38]?.trim() || '',
    dependents: fields[39]?.trim() || '',
    nationalId: fields[40]?.trim() || '',
    trainingStatus: fields[41]?.trim() || '',
    programStatus: fields[42]?.trim() || ''
  };

  // Only process participants with a valid participant code
  if (!participant.participantCode || !participant.participantCode.startsWith('D00')) {
    return null;
  }

  // Convert apprentice names to array if not empty
  if (fields[31]?.trim()) {
    participant.apprenticeNames = fields[31]
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }

  return participant;
}

/**
 * Import all participants from the tab-delimited file
 * @param filePath - Path to the tab-delimited file
 */
async function importAllParticipants(filePath: string) {
  try {
    console.log(`Starting to import participants from ${filePath}...`);
    
    // Create a read stream and readline interface
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    const participants: Participant[] = [];
    
    // Read file line by line
    for await (const line of rl) {
      const participant = parseParticipantLine(line);
      if (participant) {
        participants.push(participant);
      }
    }
    
    console.log(`Found ${participants.length} valid participants to import`);
    
    let successCount = 0;

    for (const participant of participants) {
      // Skip if participant code or full name is missing
      if (!participant.participantCode || !participant.fullName) {
        console.log(`Skipping participant with missing data: ${participant.participantCode || 'Unknown code'}`);
        continue;
      }
      
      // Create a username based on name and district
      const username = `${participant.fullName.toLowerCase().replace(/\s+/g, '_')}_${participant.district.toLowerCase()}`;
      const password = 'password123'; // Default password
      
      // Check if user already exists
      const existingUser = await db.select().from(users).where(sql`username = ${username}`);
      
      let userId: number;
      if (existingUser.length > 0) {
        console.log(`User ${username} already exists, using existing account`);
        userId = existingUser[0].id;
      } else {
        // Create new user
        const hashedPassword = await hashPassword(password);
        const [newUser] = await db.insert(users).values({
          username,
          password: hashedPassword,
          fullName: participant.fullName,
          role: 'mentee',
          district: participant.district as any
        }).returning();
        
        userId = newUser.id;
        console.log(`Created new user account for ${participant.fullName}`);
      }
      
      // Check if profile already exists (check by participant_code)
      const existingProfileByCode = await db.select().from(youthProfiles).where(sql`participant_code = ${participant.participantCode}`);
      
      if (existingProfileByCode.length > 0) {
        console.log(`Profile with code ${participant.participantCode} already exists, updating...`);
        
        // Update existing profile
        await db.update(youthProfiles)
          .set({
            userId,
            fullName: participant.fullName,
            district: participant.district as any,
            town: participant.town,
            phoneNumber: participant.phoneNumber,
            gender: participant.gender,
            maritalStatus: participant.maritalStatus,
            childrenCount: participant.childrenCount,
            yearOfBirth: participant.yearOfBirth,
            age: participant.age,
            ageGroup: participant.ageGroup,
            coreSkills: participant.coreSkills,
            businessInterest: participant.businessInterest,
            employmentStatus: participant.employmentStatus,
            specificJob: participant.specificJob,
            pwdStatus: participant.pwdStatus,
            isMadam: participant.isMadam,
            isApprentice: participant.isApprentice,
            madamName: participant.madamName,
            madamPhone: participant.madamPhone,
            apprenticeNames: participant.apprenticeNames,
            apprenticePhone: participant.apprenticePhone,
            guarantor: participant.guarantor,
            guarantorPhone: participant.guarantorPhone,
            digitalSkills: participant.digitalSkills,
            digitalSkills2: participant.digitalSkills2,
            financialAspirations: participant.financialAspirations,
            dependents: participant.dependents,
            nationalId: participant.nationalId,
            trainingStatus: 'Completed' as any, // Set all to Completed as requested
            programStatus: 'Outreach', // Set all to Outreach as requested
            updatedAt: new Date()
          })
          .where(sql`participant_code = ${participant.participantCode}`);
          
        console.log(`Updated profile for ${participant.fullName}`);
      } else {
        // Create new profile
        await db.insert(youthProfiles).values({
          userId,
          participantCode: participant.participantCode,
          fullName: participant.fullName,
          district: participant.district as any,
          town: participant.town,
          phoneNumber: participant.phoneNumber,
          gender: participant.gender,
          maritalStatus: participant.maritalStatus,
          childrenCount: participant.childrenCount,
          yearOfBirth: participant.yearOfBirth,
          age: participant.age,
          ageGroup: participant.ageGroup,
          coreSkills: participant.coreSkills,
          businessInterest: participant.businessInterest,
          employmentStatus: participant.employmentStatus,
          specificJob: participant.specificJob,
          pwdStatus: participant.pwdStatus,
          isMadam: participant.isMadam,
          isApprentice: participant.isApprentice,
          madamName: participant.madamName,
          madamPhone: participant.madamPhone,
          apprenticeNames: participant.apprenticeNames,
          apprenticePhone: participant.apprenticePhone,
          guarantor: participant.guarantor,
          guarantorPhone: participant.guarantorPhone,
          digitalSkills: participant.digitalSkills,
          digitalSkills2: participant.digitalSkills2,
          financialAspirations: participant.financialAspirations,
          dependents: participant.dependents,
          nationalId: participant.nationalId,
          trainingStatus: 'Completed' as any, // Set all to Completed as requested
          programStatus: 'Outreach' // Set all to Outreach as requested
        });
        
        console.log(`Created youth profile for ${participant.fullName}`);
      }
      
      successCount++;
    }

    console.log(`Successfully imported ${successCount} youth profiles!`);
  } catch (error) {
    console.error('Error importing participants:', error);
    throw error;
  }
}

// Path to the participant data file
const participantFilePath = 'attached_assets/Pasted-Contacted-No-participant-code-Name-Phone-Phone-Number-Gender-Marital-Status-Children-YOB-Age-Age-G-1744926978168.txt';

// Run the import function
importAllParticipants(participantFilePath).then(() => {
  console.log('Import completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});