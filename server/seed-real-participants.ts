import { db } from './db';
import { users, youthProfiles } from '@shared/schema';
import { sql } from 'drizzle-orm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

// Hash password utility
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

interface Participant {
  id: string; // D00XXXXXXX format
  name: string;
  phone: string;
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

// Parse participant data from provided TSV
const bekwaiParticipants: Participant[] = [
  {
    id: 'D0015000277',
    name: 'Abigail Owusu',
    phone: '+233595699953',
    gender: 'Female',
    maritalStatus: 'Single',
    childrenCount: 0,
    yearOfBirth: 2003,
    age: 22,
    ageGroup: '20-24',
    district: 'Bekwai',
    town: 'Low Cost',
    coreSkills: 'Decoration',
    businessInterest: 'Not Specified',
    employmentStatus: 'Unemployed',
    specificJob: '',
    pwdStatus: 'Not Disabled',
    dareModel: 'Collaborative',
    isMadam: false,
    isApprentice: false,
    madamName: '',
    madamPhone: '',
    apprenticeNames: [],
    apprenticePhone: '',
    guarantor: '',
    guarantorPhone: '',
    digitalSkills: '',
    digitalSkills2: '',
    financialAspirations: '',
    dependents: '',
    nationalId: '',
    trainingStatus: 'Completed',
    programStatus: 'Outreach',
  },
  {
    id: 'D0019000595',
    name: 'Adwoa Dansowaa',
    phone: '+233542695035',
    gender: 'Female',
    maritalStatus: 'Single',
    childrenCount: 2,
    yearOfBirth: 1995,
    age: 30,
    ageGroup: '30-34',
    district: 'Bekwai',
    town: 'Denyase',
    coreSkills: 'Social Media',
    businessInterest: 'Not Specified',
    employmentStatus: 'Unemployed',
    specificJob: '',
    pwdStatus: 'Not Disabled',
    dareModel: 'Collaborative',
    isMadam: false,
    isApprentice: false,
    madamName: '',
    madamPhone: '',
    apprenticeNames: [],
    apprenticePhone: '',
    guarantor: '',
    guarantorPhone: '',
    digitalSkills: '',
    digitalSkills2: '',
    financialAspirations: '',
    dependents: '',
    nationalId: '',
    trainingStatus: 'Completed',
    programStatus: 'Outreach',
  },
  {
    id: 'D0011000042',
    name: 'Akosua Adomah',
    phone: '+233548531164',
    gender: 'Female',
    maritalStatus: 'Single',
    childrenCount: 3,
    yearOfBirth: 1992,
    age: 33,
    ageGroup: '30-34',
    district: 'Bekwai',
    town: 'Ankaase',
    coreSkills: 'Baking',
    businessInterest: 'Not Specified',
    employmentStatus: 'Unemployed',
    specificJob: '',
    pwdStatus: 'Not Disabled',
    dareModel: 'Collaborative',
    isMadam: false,
    isApprentice: false,
    madamName: '',
    madamPhone: '',
    apprenticeNames: [],
    apprenticePhone: '',
    guarantor: '',
    guarantorPhone: '',
    digitalSkills: '',
    digitalSkills2: '',
    financialAspirations: '',
    dependents: '',
    nationalId: '',
    trainingStatus: 'Completed',
    programStatus: 'Outreach',
  },
  {
    id: 'D0014000014',
    name: 'Alidu Zulfa',
    phone: '+233599728154',
    gender: 'Female',
    maritalStatus: 'Married',
    childrenCount: 0,
    yearOfBirth: 2002,
    age: 23,
    ageGroup: '20-24',
    district: 'Bekwai',
    town: 'Amoafo',
    coreSkills: 'Baking, Juicing',
    businessInterest: 'Not Specified',
    employmentStatus: 'Unemployed',
    specificJob: '',
    pwdStatus: 'Not Disabled',
    dareModel: 'Collaborative',
    isMadam: false,
    isApprentice: false,
    madamName: '',
    madamPhone: '',
    apprenticeNames: [],
    apprenticePhone: '',
    guarantor: '',
    guarantorPhone: '',
    digitalSkills: '',
    digitalSkills2: '',
    financialAspirations: '',
    dependents: '',
    nationalId: '',
    trainingStatus: 'Completed',
    programStatus: 'Outreach',
  },
  {
    id: 'D0015000228',
    name: 'Alimatu Seidu',
    phone: '+233596367686',
    gender: 'Female',
    maritalStatus: 'Single',
    childrenCount: 0,
    yearOfBirth: 2001,
    age: 24,
    ageGroup: '20-24',
    district: 'Bekwai',
    town: 'Dominase',
    coreSkills: 'Dressmaking',
    businessInterest: 'Not Specified',
    employmentStatus: 'Unemployed',
    specificJob: '',
    pwdStatus: 'Not Disabled',
    dareModel: 'Collaborative',
    isMadam: false,
    isApprentice: false,
    madamName: '',
    madamPhone: '',
    apprenticeNames: [],
    apprenticePhone: '',
    guarantor: '',
    guarantorPhone: '',
    digitalSkills: '',
    digitalSkills2: '',
    financialAspirations: '',
    dependents: '',
    nationalId: '',
    trainingStatus: 'Completed',
    programStatus: 'Outreach',
  },
  {
    id: 'D0018000025',
    name: 'Batumbe Kassim Anatu',
    phone: '+233532946921',
    gender: 'Female',
    maritalStatus: 'Married',
    childrenCount: 0,
    yearOfBirth: 1997,
    age: 28,
    ageGroup: '25-29',
    district: 'Bekwai',
    town: 'Amoafo',
    coreSkills: 'Baking, Juicing',
    businessInterest: 'Not Specified',
    employmentStatus: 'Unemployed',
    specificJob: '',
    pwdStatus: 'Not Disabled',
    dareModel: 'Collaborative',
    isMadam: false,
    isApprentice: false,
    madamName: '',
    madamPhone: '',
    apprenticeNames: [],
    apprenticePhone: '',
    guarantor: '',
    guarantorPhone: '',
    digitalSkills: '',
    digitalSkills2: '',
    financialAspirations: '',
    dependents: '',
    nationalId: '',
    trainingStatus: 'Completed',
    programStatus: 'Outreach',
  },
  {
    id: 'D0018000317',
    name: 'Charity Adjei',
    phone: '+233539585634',
    gender: 'Female',
    maritalStatus: 'Single',
    childrenCount: 3,
    yearOfBirth: 1994,
    age: 31,
    ageGroup: '30-34',
    district: 'Bekwai',
    town: 'Brosanse',
    coreSkills: 'Dressmaking',
    businessInterest: 'Not Specified',
    employmentStatus: 'Unemployed',
    specificJob: '',
    pwdStatus: 'Not Disabled',
    dareModel: 'MakerSpace',
    isMadam: false,
    isApprentice: false,
    madamName: '',
    madamPhone: '',
    apprenticeNames: [],
    apprenticePhone: '',
    guarantor: '',
    guarantorPhone: '',
    digitalSkills: '',
    digitalSkills2: '',
    financialAspirations: '',
    dependents: '',
    nationalId: '',
    trainingStatus: 'Completed',
    programStatus: 'Outreach',
  },
  {
    id: 'D0014000071',
    name: 'Charity Kwakye',
    phone: '+233256559721',
    gender: 'Female',
    maritalStatus: 'Single',
    childrenCount: 0,
    yearOfBirth: 1998,
    age: 27,
    ageGroup: '25-29',
    district: 'Bekwai',
    town: 'Behenease',
    coreSkills: 'Hairdressing',
    businessInterest: 'Not Specified',
    employmentStatus: 'Unemployed',
    specificJob: '',
    pwdStatus: 'Not Disabled',
    dareModel: 'Collaborative',
    isMadam: false,
    isApprentice: false,
    madamName: '',
    madamPhone: '',
    apprenticeNames: [],
    apprenticePhone: '',
    guarantor: '',
    guarantorPhone: '',
    digitalSkills: '',
    digitalSkills2: '',
    financialAspirations: '',
    dependents: '',
    nationalId: '',
    trainingStatus: 'Completed',
    programStatus: 'Outreach',
  },
  {
    id: 'D0019000375',
    name: 'Charity Owusuaa',
    phone: '+233592972632',
    gender: 'Female',
    maritalStatus: 'Single',
    childrenCount: 1,
    yearOfBirth: 2005,
    age: 20,
    ageGroup: '20-24',
    district: 'Bekwai',
    town: 'Nampansa BD',
    coreSkills: 'Dressmaking',
    businessInterest: 'Not Specified',
    employmentStatus: 'Unemployed',
    specificJob: '',
    pwdStatus: 'Not Disabled',
    dareModel: 'Madam Anchor',
    isMadam: false,
    isApprentice: true,
    madamName: 'Grace Arkoh',
    madamPhone: '+233548739394',
    apprenticeNames: [],
    apprenticePhone: '',
    guarantor: '',
    guarantorPhone: '',
    digitalSkills: '',
    digitalSkills2: '',
    financialAspirations: '',
    dependents: '',
    nationalId: '',
    trainingStatus: 'Completed',
    programStatus: 'Outreach',
  },
  // Add more participants as needed from the data file
];

// Function to read participants from file
async function readParticipantsFromFile(): Promise<Participant[]> {
  const filePath = path.join(process.cwd(), '../attached_assets', 'Pasted-Contacted-No-participant-code-Name-Phone-Phone-Number-Gender-Marital-Status-Children-YOB-Age-Age-G-1744926978168.txt');
  const participants: Participant[] = [];
  
  if (!fs.existsSync(filePath)) {
    console.log(`Participant data file not found at ${filePath}, using hardcoded data.`);
    return bekwaiParticipants;
  }
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv.default({ separator: '\t' }))
      .on('data', (row: any) => {
        // Skip header row or rows without "Yes" in Contacted
        if (row.Contacted !== 'Yes' || !row.participant_code) {
          return;
        }
        
        // Parse apprentice names if present
        const apprenticeNames = row['Apprentice_Name(s)'] ? 
          row['Apprentice_Name(s)'].split(',').map((name: string) => name.trim()).filter((name: string) => name) : 
          [];
        
        const participant: Participant = {
          id: row.participant_code.trim(),
          name: row.Name ? row.Name.trim() : '',
          phone: row.Phone_Number ? row.Phone_Number.trim() : '',
          gender: row.Gender ? row.Gender.trim() : '',
          maritalStatus: row.Marital_Status ? row.Marital_Status.trim() : '',
          childrenCount: row.Children && !isNaN(parseInt(row.Children)) ? parseInt(row.Children) : 0,
          yearOfBirth: row.YOB && !isNaN(parseInt(row.YOB)) ? parseInt(row.YOB) : null,
          age: row.Age && !isNaN(parseInt(row.Age)) ? parseInt(row.Age) : null,
          ageGroup: row.Age_Group ? row.Age_Group.trim() : '',
          district: row.District && row.District.trim() ? row.District.trim() : 'Bekwai',
          town: row.Town ? row.Town.trim() : '',
          coreSkills: row.Core_Skills ? row.Core_Skills.trim() : '',
          businessInterest: row.Business_Interest ? row.Business_Interest.trim() : 'Not Specified',
          employmentStatus: row.Employment_Status ? row.Employment_Status.trim() : 'Unemployed',
          specificJob: row.Specific_Job ? row.Specific_Job.trim() : '',
          pwdStatus: row.PWD_Status ? row.PWD_Status.trim() : 'Not Disabled',
          dareModel: row.DARE_Model ? row.DARE_Model.trim() : '',
          isMadam: row.Is_Madam === 'yes' || row.Is_Madam === '1' || false,
          isApprentice: row.Is_Apprentice === 'yes' || row.Is_Apprentice === '1' || false,
          madamName: row.Madam_Name ? row.Madam_Name.trim() : '',
          madamPhone: row.Madam_Phone ? row.Madam_Phone.trim() : '',
          apprenticeNames: apprenticeNames,
          apprenticePhone: row.Apprentice_Phone ? row.Apprentice_Phone.trim() : '',
          guarantor: row.Guarantor ? row.Guarantor.trim() : '',
          guarantorPhone: row.Guarantor_Phone ? row.Guarantor_Phone.trim() : '',
          digitalSkills: row.Digital_Skills ? row.Digital_Skills.trim() : '',
          digitalSkills2: row.Digital_Skills_2 ? row.Digital_Skills_2.trim() : '',
          financialAspirations: row.Financial_Aspirations ? row.Financial_Aspirations.trim() : '',
          dependents: row.Dependents ? row.Dependents.trim() : '',
          nationalId: row['National ID Number'] ? row['National ID Number'].trim() : '',
          trainingStatus: row.Training_Status ? row.Training_Status.trim() : 'Completed',
          programStatus: row.Program_Status ? row.Program_Status.trim() : 'Outreach',
        };
        
        participants.push(participant);
      })
      .on('end', () => {
        console.log(`Successfully parsed ${participants.length} participants from file`);
        resolve(participants.length > 0 ? participants : bekwaiParticipants);
      })
      .on('error', (error) => {
        console.error('Error reading participant data:', error);
        resolve(bekwaiParticipants); // Fallback to hardcoded data on error
      });
  });
}

// Function to seed real participant data
async function seedRealParticipantData() {
  try {
    console.log('Starting to seed real participant data...');
    
    // Get participants from file
    let participants = await readParticipantsFromFile();
    console.log(`Loaded ${participants.length} participants to import`);
    
    // Check if we already have real participant data
    const existingYouthCount = await db.select({ count: sql`count(*)::int` }).from(youthProfiles);
    
    if (existingYouthCount[0].count > 0) {
      console.log(`Found ${existingYouthCount[0].count} existing youth profiles.`);
      // MODIFIED: Continue with importing only new profiles instead of skipping
    }
    
    let createdCount = 0;
    let skippedCount = 0;
    
    // Create user accounts and youth profiles for each participant
    for (const participant of participants) {
      try {
        // Generate username from name and district
        const username = `${participant.name.toLowerCase().replace(/\\s+/g, '_')}_${participant.district.toLowerCase()}`;
        
        // Check if user exists
        const existingUser = await db.select().from(users).where(sql`username = ${username}`).limit(1);
        
        let userId;
        
        if (existingUser.length > 0) {
          console.log(`User ${username} already exists, using existing account`);
          userId = existingUser[0].id;
        } else {
          // Create user account
          const defaultPassword = await hashPassword('password123');
          
          const [newUser] = await db.insert(users).values({
            username,
            password: defaultPassword,
            fullName: participant.name,
            role: 'mentee',
            district: participant.district,
            profilePicture: '',
          }).returning();
          
          userId = newUser.id;
        }
        
        // Check if profile exists
        const existingProfile = await db.select()
          .from(youthProfiles)
          .where(sql`participant_code = ${participant.id}`)
          .limit(1);
          
        if (existingProfile.length > 0) {
          console.log(`Profile for ${participant.name} already exists, skipping`);
          skippedCount++;
          continue;
        }
        
        // Create youth profile
        await db.insert(youthProfiles).values({
          userId,
          participantCode: participant.id,
          fullName: participant.name,
          profilePicture: '',
          district: participant.district,
          town: participant.town,
          phoneNumber: participant.phone,
          gender: participant.gender,
          maritalStatus: participant.maritalStatus,
          childrenCount: participant.childrenCount,
          yearOfBirth: participant.yearOfBirth || null,
          age: participant.age || null,
          ageGroup: participant.ageGroup,
          coreSkills: participant.coreSkills,
          businessInterest: participant.businessInterest,
          employmentStatus: participant.employmentStatus,
          specificJob: participant.specificJob,
          pwdStatus: participant.pwdStatus,
          dareModel: participant.dareModel,
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
          trainingStatus: participant.trainingStatus,
          programStatus: participant.programStatus,
        });
        
        console.log(`Created youth profile for ${participant.name}`);
        createdCount++;
      } catch (error) {
        console.error(`Error adding participant ${participant.name}:`, error);
      }
    }
    
    console.log(`Successfully seeded ${createdCount} new participants! (${skippedCount} already existed)`);
    console.log(`Total participant count: ${createdCount + skippedCount}`);
    
  } catch (error) {
    console.error('Error seeding real participant data:', error);
    throw error;
  }
}

// Run the seeding function
seedRealParticipantData().catch(console.error);