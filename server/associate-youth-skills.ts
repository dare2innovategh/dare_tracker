import { db } from './db';
import { youthProfiles, skills, youthSkills } from '@shared/schema';
import { convertObjectKeysToSnakeCase } from './utils';
import { eq, like, ilike } from 'drizzle-orm';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';
import csvParser from 'csv-parser';

/**
 * Calculate a match score between two strings
 * This function rates how well two strings match based on:
 * - Direct inclusion (one string contains the other)
 * - Relative length of the match compared to the strings
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @returns Score between 0 and 1 (1 being a perfect match)
 */
function calculateMatchScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Perfect match
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2)) {
    // Score higher if the contained string is longer relative to the container
    return 0.7 + (s2.length / s1.length) * 0.3;
  }
  
  if (s2.includes(s1)) {
    return 0.7 + (s1.length / s2.length) * 0.3;
  }
  
  // Check for word-level matches
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchedWords = 0;
  for (const word1 of words1) {
    if (word1.length < 3) continue; // Skip short words
    for (const word2 of words2) {
      if (word2.length < 3) continue; // Skip short words
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchedWords++;
        break;
      }
    }
  }
  
  const wordScore = matchedWords / Math.max(words1.length, words2.length);
  
  // Return the best possible score
  return Math.max(wordScore * 0.6, 0);
}

// Define skill mappings for fuzzy matching with expanded keywords
const SKILL_MAPPINGS: Record<string, string[]> = {
  // Building & Construction Categories
  'building & construction': ['masonry', 'bricklaying', 'carpentry', 'electrical', 'plumbing', 'construction', 'building', 'wood', 'cement'],
  'masonry and bricklaying': ['masonry', 'bricklaying', 'concrete', 'brick', 'block', 'cement', 'mason'],
  'carpentry': ['carpentry', 'wood', 'furniture', 'woodworking', 'joinery', 'cabinet'],
  'electrical services': ['electrical', 'wiring', 'electrician', 'electronics', 'appliance'],
  'plumbing': ['plumbing', 'plumber', 'pipe', 'water', 'sanitation'],
  'general construction': ['construction', 'builder', 'contractor', 'building', 'site'],
  
  // Food & Beverage Categories
  'food & beverage': ['food', 'bakery', 'beverage', 'catering', 'restaurant', 'baking', 'pastries', 'cooking', 'juicing', 'chef', 'kitchen', 'cafe', 'pastry'],
  'food processing': ['food processing', 'preservation', 'packaging', 'canning'],
  'bakery': ['bakery', 'baking', 'pastries', 'bread', 'cake', 'pastry', 'bake', 'pies', 'dessert', 'spring rolls'],
  'beverage production': ['beverage', 'juicing', 'drinks', 'juice', 'smoothie', 'cocktail'],
  'catering services': ['catering', 'cooking', 'chef', 'food service', 'meal', 'kitchen', 'event food'],
  'restaurant/food service': ['restaurant', 'food service', 'waiter', 'waitress', 'cafe', 'dining', 'menu'],
  
  // Fashion & Apparel Categories
  'fashion & apparel': ['dressmaking', 'fashion', 'clothing', 'textile', 'accessories', 'footwear', 'neating', 'overlock', 'sewing', 'tailor', 'seamstress', 'garment'],
  'clothing production': ['dressmaking', 'clothing', 'fashion', 'sewing', 'garment', 'tailor', 'seamstress', 'cloth'],
  'fashion design': ['fashion design', 'dressmaking', 'designer', 'style', 'pattern', 'tailor'],
  'textile manufacturing': ['textile', 'fabric', 'cloth', 'weaving', 'knitting'],
  'accessories': ['accessories', 'beadmaking', 'beads', 'jewelry', 'handbag', 'belt', 'hat'],
  'footwear': ['footwear', 'shoe', 'sandal', 'cobbler', 'leather'],
  
  // Beauty & Wellness Categories
  'beauty & wellness': ['beauty', 'hair', 'cosmetics', 'spa', 'nail', 'skin', 'hairdressing', 'salon', 'wellness', 'styling', 'barber'],
  'hair styling': ['hair', 'hairdressing', 'salon', 'barber', 'stylist', 'braiding', 'weaving', 'hairstyle'],
  'cosmetics': ['cosmetics', 'makeup', 'beautician', 'beauty products', 'facial'],
  'spa services': ['spa', 'massage', 'therapy', 'wellness', 'relaxation'],
  'nail care': ['nail', 'manicure', 'pedicure', 'nail polish', 'nail art'],
  'skincare': ['skin', 'facial', 'skincare', 'treatment', 'cream'],
  
  // Media & Creative Arts Categories
  'media & creative arts': ['media', 'photography', 'graphic', 'video', 'digital content', 'music', 'decoration', 'creative', 'design', 'art', 'event'],
  'photography': ['photography', 'photo', 'camera', 'portrait', 'photographer'],
  'graphic design': ['graphic', 'design', 'logo', 'illustration', 'artwork', 'visual'],
  'video production': ['video', 'film', 'production', 'editing', 'shooting', 'camera', 'cinematography'],
  'digital content creation': ['digital content', 'social media', 'blogging', 'content creator', 'influencer'],
  'music production': ['music', 'audio', 'sound', 'recording', 'producer', 'song'],
  'decoration': ['decoration', 'decor', 'event', 'interior', 'design', 'styling', 'party planning', 'event organization'],
  
  // Business & Service Categories
  'customer service': ['customer service', 'communication', 'client', 'support', 'helpdesk', 'call center'],
  'communication': ['communication', 'speaking', 'presentation', 'public speaking', 'writing'],
  'digital marketing': ['digital marketing', 'social media', 'online', 'marketing', 'website', 'seo', 'advertising'],
  'business management': ['business', 'management', 'trading', 'entrepreneur', 'retail', 'sales', 'shop', 'commerce', 'merchant', 'sell', 'buying', 'selling', 'market'],
  'financial literacy': ['financial', 'finance', 'accounting', 'bookkeeping', 'budget', 'money', 'banking'],
  'team leadership': ['leadership', 'team', 'management', 'supervisor', 'manager', 'coordinator']
};

/**
 * Associate youth profiles with relevant skills based on their core skills
 */
async function associateYouthSkills() {
  try {
    console.log('Starting youth skills association...');
    
    // Get existing skills from database for matching
    const existingSkills = await db.select().from(skills);
    console.log(`Found ${existingSkills.length} existing skills in the database`);
    
    // Create a map of lowercase skill names to skill IDs for fuzzy matching
    const skillMap = new Map<string, number>();
    existingSkills.forEach((skill) => {
      skillMap.set(skill.name.toLowerCase(), skill.id);
    });
    
    // Process the CSV file with youth data
    const csvFilePath = '/home/runner/workspace/attached_assets/DARE Youth.csv';
    console.log(`Attempting to read CSV file from: ${csvFilePath}`);
    const results: any[] = [];
    
    // Parse the CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let processedCount = 0;
        let skillsAssociatedCount = 0;
        
        // Print first row keys to debug column names
        if (results.length > 0) {
          console.log('CSV columns found:', Object.keys(results[0]));
        }
        
        for (const row of results) {
          processedCount++;
          // Note the space in 'participant_code ' from CSV
          const participantCode = row['participant_code ']?.trim();
          const coreSkills = row.Core_Skills?.trim();
          
          console.log(`Processing row: participantCode=${participantCode}, coreSkills=${coreSkills}`);
          
          if (!participantCode || !coreSkills || coreSkills === 'Not Specified') {
            continue;
          }
          
          // Find the youth profile by participant code
          const profiles = await db.select()
            .from(youthProfiles)
            .where(eq(youthProfiles.participantCode, participantCode));
          
          if (!profiles || profiles.length === 0) {
            console.log(`Profile not found for participant code: ${participantCode}`);
            continue;
          }
          
          const profile = profiles[0];
          console.log(`Found profile with ID: ${profile.id}, name: ${profile.fullName}`);
          
          // Split skills by comma
          const skillsList = coreSkills.split(',').map(s => s.trim());
          const associatedSkillIds = new Set<number>();
          
          // Process each skill
          for (const skillName of skillsList) {
            if (!skillName) continue;
            
            let matchedSkillId: number | null = null;
            
            // Try exact match first
            for (const [dbSkillName, skillId] of skillMap.entries()) {
              if (skillName.toLowerCase() === dbSkillName.toLowerCase()) {
                matchedSkillId = skillId;
                break;
              }
            }
            
            // If no exact match, try sophisticated fuzzy matching
            if (!matchedSkillId) {
              const skillNameLower = skillName.toLowerCase();
              let bestMatchScore = 0;
              let bestMatchId: number | null = null;
              
              // First, try category-based keyword matching
              for (const [categoryName, keywords] of Object.entries(SKILL_MAPPINGS)) {
                for (const keyword of keywords) {
                  const keywordLower = keyword.toLowerCase();
                  
                  // Check if the skill name contains the keyword or vice versa
                  if (skillNameLower.includes(keywordLower) || keywordLower.includes(skillNameLower)) {
                    const categoryId = skillMap.get(categoryName);
                    if (categoryId) {
                      // Calculate match score based on keyword length and position
                      const score = calculateMatchScore(skillNameLower, keywordLower);
                      
                      if (score > bestMatchScore) {
                        bestMatchScore = score;
                        bestMatchId = categoryId;
                      }
                    }
                  }
                }
              }
              
              // If we found a good category-based match, use it
              if (bestMatchScore > 0.5) {
                matchedSkillId = bestMatchId;
                console.log(`Found fuzzy category match: "${skillName}" -> category with ID ${matchedSkillId} (score: ${bestMatchScore})`);
              }
            }
            
            // If still no match, try direct skill name matching with database skill names
            if (!matchedSkillId) {
              let bestMatchScore = 0;
              let bestMatchId: number | null = null;
              
              // Check against all skill names in the database
              skillMap.forEach((skillId, dbSkillName) => {
                const dbSkillNameLower = dbSkillName.toLowerCase();
                const skillNameLower = skillName.toLowerCase();
                
                // Check for partial matching
                if (skillNameLower.includes(dbSkillNameLower) || dbSkillNameLower.includes(skillNameLower)) {
                  const score = calculateMatchScore(skillNameLower, dbSkillNameLower);
                  
                  if (score > bestMatchScore) {
                    bestMatchScore = score;
                    bestMatchId = skillId;
                  }
                }
              });
              
              // If we found a good direct match, use it
              if (bestMatchScore > 0.3) {
                matchedSkillId = bestMatchId;
                console.log(`Found direct skill name match for "${skillName}" with score ${bestMatchScore}`);
              }
            }
            
            if (matchedSkillId && !associatedSkillIds.has(matchedSkillId)) {
              associatedSkillIds.add(matchedSkillId);
              
              // Check if the association already exists using the correct column names
              const existingAssociations = await db.execute(
                `SELECT * FROM youth_skills 
                 WHERE youth_id = ${profile.id} 
                 AND skill_id = ${matchedSkillId}`
              );
              const existingAssociation = existingAssociations.rows.length > 0 ? existingAssociations.rows[0] : null;
              
              if (!existingAssociation) {
                // Create youth skill relation - making sure to use the correct field names
                try {
                  // Log what we're trying to insert
                  console.log(`Inserting youth_skill: youth_id=${profile.id}, skill_id=${matchedSkillId}`);
                  
                  // Use raw SQL insert to avoid typing issues
                  await db.execute(`
                    INSERT INTO youth_skills 
                    (youth_id, skill_id, proficiency, created_at) 
                    VALUES 
                    (${profile.id}, ${matchedSkillId}, 'Beginner', NOW())
                  `);
                  
                  skillsAssociatedCount++;
                  console.log(`Associated skill ${matchedSkillId} with profile ${profile.id} (${profile.fullName}) - Skill: ${skillName}`);
                } catch (error: any) {
                  console.error(`Error associating skill: ${error?.message || 'Unknown error'}`);
                  // Print full error for debugging
                  console.error(error);
                }
              } else {
                console.log(`Skill ${matchedSkillId} already associated with profile ${profile.id}`);
              }
            } else if (!matchedSkillId) {
              console.log(`No matching skill found for: ${skillName}`);
            }
          }
        }
        
        console.log(`\nProcessed ${processedCount} youth profiles`);
        console.log(`Associated ${skillsAssociatedCount} skills with youth profiles`);
        console.log('Youth skills association completed!');
        
        process.exit(0);
      });
  } catch (error: any) {
    console.error('Error associating youth skills:', error?.message || error);
    process.exit(1);
  }
}

// Run the function
associateYouthSkills();