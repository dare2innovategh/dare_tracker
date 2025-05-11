import { db } from './db';
import { skills, serviceCategories, serviceSubcategories } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Seed the skills table based on service categories and subcategories
 * Skills are drawn from existing categories and subcategories to maintain consistency
 */
export async function seedSkills() {
  console.log('Starting to seed skills from service categories and subcategories...');

  try {
    // Check if there are already skills seeded
    const existingSkillsCount = await db.select({ count: sql<number>`count(*)` }).from(skills);
    const skillCount = existingSkillsCount[0]?.count || 0;
    
    if (skillCount > 0) {
      console.log(`Found ${skillCount} existing skills. Skipping skill seeding.`);
      return;
    }

    // Get all service categories and subcategories
    const categories = await db.select().from(serviceCategories);
    const subcategories = await db.select().from(serviceSubcategories);

    console.log(`Found ${categories.length} categories and ${subcategories.length} subcategories to derive skills from.`);

    // Create skills from categories
    for (const category of categories) {
      // Create a general skill for each category
      await db.insert(skills).values({
        name: category.name,
        description: `General ${category.name} skills`,
        categoryId: category.id,
        isActive: true
      });
      
      console.log(`Created skill for category: ${category.name}`);
      
      // Find subcategories for this category
      const relatedSubcategories = subcategories.filter(s => s.categoryId === category.id);
      
      // Create skills for each subcategory
      for (const subcategory of relatedSubcategories) {
        await db.insert(skills).values({
          name: subcategory.name,
          description: `${subcategory.name} - specialized skill in ${category.name}`,
          categoryId: category.id,
          subcategoryId: subcategory.id,
          isActive: true
        });
        
        console.log(`Created skill for subcategory: ${subcategory.name}`);
      }
    }

    // Create some general skills that apply across categories
    const generalSkills = [
      { name: 'Customer Service', description: 'Skills in providing excellent customer service' },
      { name: 'Communication', description: 'Verbal and written communication skills' },
      { name: 'Digital Marketing', description: 'Skills in online marketing and social media' },
      { name: 'Business Management', description: 'General business management and operations skills' },
      { name: 'Financial Literacy', description: 'Understanding of financial principles and budgeting' },
      { name: 'Team Leadership', description: 'Skills in leading and managing teams' }
    ];

    for (const skill of generalSkills) {
      await db.insert(skills).values({
        name: skill.name,
        description: skill.description,
        isActive: true
      });
      
      console.log(`Created general skill: ${skill.name}`);
    }

    const finalSkillsCount = await db.select({ count: sql<number>`count(*)` }).from(skills);
    console.log(`Successfully seeded ${finalSkillsCount[0]?.count || 0} skills!`);
  } catch (error) {
    console.error('Error seeding skills:', error);
    throw error;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSkills().then(() => {
    console.log('Skills seeding completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('Skills seeding failed:', error);
    process.exit(1);
  });
}