import { db } from './db';
import { youthProfiles, skills, youthSkills } from '@shared/schema';
import { convertObjectKeysToSnakeCase } from './utils';
import { eq } from 'drizzle-orm';

/**
 * Test script to associate skills with youth profiles
 */
async function testSkillsAssociation() {
  try {
    console.log('Starting test of skills association...');
    
    // Get existing skills from database
    const existingSkills = await db.select().from(skills);
    console.log(`Found ${existingSkills.length} existing skills in the database`);
    
    const skillMap = new Map<string, number>();
    existingSkills.forEach((skill) => {
      // Create a map of lowercase skill names to skill IDs for fuzzy matching
      skillMap.set(skill.name.toLowerCase(), skill.id);
      console.log(`Skill: ${skill.name} (ID: ${skill.id})`);
    });
    
    // Get the first youth profile from the database
    const profiles = await db.select().from(youthProfiles).limit(1);
    
    if (profiles.length === 0) {
      console.log('No youth profiles found!');
      return;
    }
    
    const profile = profiles[0];
    console.log(`Using profile: ${profile.fullName} (ID: ${profile.id})`);
    
    // Create a test skill relation
    const testSkillId = existingSkills[0].id;
    
    console.log(`Associating skill ${testSkillId} with profile ${profile.id}`);
    
    // Create youth skill relation and convert to snake_case
    const youthSkill = convertObjectKeysToSnakeCase({
      youthId: profile.id,
      skillId: testSkillId,
      proficiency: 'Beginner',
      createdAt: new Date()
    });
    
    console.log('Youth skill object:', youthSkill);
    
    // Use array syntax as required by the API
    const result = await db.insert(youthSkills).values([youthSkill]).returning();
    console.log('Insert result:', result);
    
    // Verify the association was created
    const check = await db.select().from(youthSkills).where(eq(youthSkills.youthId, profile.id));
    console.log('Associated skills:', check);
    
    console.log('Skills association test completed!');
  } catch (error) {
    console.error('Error testing skills association:', error);
  }
}

// Run the test function
testSkillsAssociation()
  .then(() => {
    console.log('Test complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });