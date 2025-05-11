import { db } from './db';
import { users, youthProfiles } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
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
 * Seed the database with real participant data
 */
async function seedYouthList() {
  try {
    console.log('Starting to seed youth list...');

    // The youth data from the list
    const participants: Participant[] = [
      {
        participantCode: 'D0015000277',
        fullName: 'Abigail Owusu',
        phone: '595699953',
        phoneNumber: '+233595699953',
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
        programStatus: 'Outreach'
      },
      {
        participantCode: 'D0019000595',
        fullName: 'Adwoa Dansowaa',
        phone: '542695035',
        phoneNumber: '+233542695035',
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
        programStatus: 'Outreach'
      },
      {
        participantCode: 'D0011000042',
        fullName: 'Akosua Adomah',
        phone: '548531164',
        phoneNumber: '+233548531164',
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
        programStatus: 'Outreach'
      },
      {
        participantCode: 'D0014000014',
        fullName: 'Alidu Zulfa',
        phone: '599728154',
        phoneNumber: '+233599728154',
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
        programStatus: 'Outreach'
      },
      {
        participantCode: 'D0015000228',
        fullName: 'Alimatu Seidu',
        phone: '596367686',
        phoneNumber: '+233596367686',
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
        programStatus: 'Outreach'
      },
      {
        participantCode: 'D0018000025',
        fullName: 'Batumbe Kassim Anatu',
        phone: '532946921',
        phoneNumber: '+233532946921',
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
        programStatus: 'Outreach'
      },
      {
        participantCode: 'D0018000317',
        fullName: 'Charity Adjei',
        phone: '539585634',
        phoneNumber: '+233539585634',
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
        dareModel: 'Maker Space',
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
        programStatus: 'Outreach'
      },
      {
        participantCode: 'D0014000071',
        fullName: 'Charity Kwakye',
        phone: '256559721',
        phoneNumber: '+233256559721',
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
        programStatus: 'Outreach'
      },
      {
        participantCode: 'D0019000375',
        fullName: 'Charity Owusuaa',
        phone: '592972632',
        phoneNumber: '+233592972632',
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
        dareModel: 'Job Anchor (Madam)',
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
        programStatus: 'Outreach'
      },
      {
        participantCode: 'D0018000291',
        fullName: 'Claire Serwaa',
        phone: '543267926',
        phoneNumber: '+233543267926',
        gender: 'Female',
        maritalStatus: 'Married',
        childrenCount: 2,
        yearOfBirth: 1992,
        age: 33,
        ageGroup: '30-34',
        district: 'Bekwai',
        town: 'Essumeja',
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
        programStatus: 'Outreach'
      },
    ];

    let successCount = 0;

    for (const participant of participants) {
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
      
      // Check if profile already exists (check both user_id and participant_code)
      const existingProfileByCode = await db.select().from(youthProfiles).where(sql`participant_code = ${participant.participantCode}`);
      
      if (existingProfileByUser.length > 0 || existingProfileByCode.length > 0) {
        console.log(`Profile for ${participant.fullName} already exists, skipping`);
        continue;
      }
      
      // Create youth profile
      await db.insert(youthProfiles).values({
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
        dareModel: participant.dareModel as any,
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
        trainingStatus: participant.trainingStatus as any,
        programStatus: participant.programStatus
      });
      
      console.log(`Created youth profile for ${participant.fullName}`);
      successCount++;
    }

    console.log(`Successfully seeded ${successCount} youth profiles from the list!`);
  } catch (error) {
    console.error('Error seeding youth list:', error);
    throw error;
  }
}

// Run the seeding function
seedYouthList().then(() => {
  console.log('Seeding completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});