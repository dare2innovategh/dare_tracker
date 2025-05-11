import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * A script to clear all existing mentor data and youth profiles,
 * then import the specified 4 mentors with their user accounts
 * Youth profiles will be imported separately without user accounts
 */
async function resetMentorYouthDirect() {
  try {
    console.log('Starting reset of mentors and youth...');
    
    // First clear the business_tracking data (foreign key constraints)
    await db.execute(sql`
      DELETE FROM business_tracking
    `);
    
    // Clear business data
    await db.execute(sql`
      DELETE FROM businesses
    `);
    
    // Clear existing mentors
    await db.execute(sql`
      DELETE FROM mentors
    `);
    
    // Clear youth profiles
    await db.execute(sql`
      DELETE FROM youth_profiles
    `);
    
    // Clear existing mentor user accounts
    await db.execute(sql`
      DELETE FROM users
      WHERE role = 'mentor'
    `);
    
    console.log('Existing mentors and youth profiles cleared.');
    
    // Create the 4 mentor user accounts
    // These are user accounts for mentors (not leadership)
    
    // Mentor 1: Prof. Afia Frimpomaa Asare Marfo
    const afia = await db.execute(sql`
      INSERT INTO users (username, password, full_name, email, role, is_active)
      VALUES ('afia_marfo', '$2a$10$K8mB3xCchfhBi5mwjNfSI.KsMmMQTfGuHNRfQY7o9ZvxJ/N0DCeKi', 'Prof. Afia Frimpomaa Asare Marfo', 'afia.marfo@example.com', 'mentor', true)
      RETURNING id
    `);
    
    // Mentor 2: Dr. George Oppong Appiagyei
    const george = await db.execute(sql`
      INSERT INTO users (username, password, full_name, email, role, is_active)
      VALUES ('george_appiagyei', '$2a$10$K8mB3xCchfhBi5mwjNfSI.KsMmMQTfGuHNRfQY7o9ZvxJ/N0DCeKi', 'Dr. George Oppong Appiagyei', 'george.appiagyei@example.com', 'mentor', true)
      RETURNING id
    `);
    
    // Mentor 3: Prof. Nana Ama Browne Klutse
    const nana = await db.execute(sql`
      INSERT INTO users (username, password, full_name, email, role, is_active)
      VALUES ('nana_klutse', '$2a$10$K8mB3xCchfhBi5mwjNfSI.KsMmMQTfGuHNRfQY7o9ZvxJ/N0DCeKi', 'Prof. Nana Ama Browne Klutse', 'nana.klutse@example.com', 'mentor', true)
      RETURNING id
    `);
    
    // Mentor 4: Dr. Stephen Yamoah
    const stephen = await db.execute(sql`
      INSERT INTO users (username, password, full_name, email, role, is_active)
      VALUES ('stephen_yamoah', '$2a$10$K8mB3xCchfhBi5mwjNfSI.KsMmMQTfGuHNRfQY7o9ZvxJ/N0DCeKi', 'Dr. Stephen Yamoah', 'stephen.yamoah@example.com', 'mentor', true)
      RETURNING id
    `);
    
    console.log('Mentor user accounts created successfully');
    
    // Create mentor profiles linked to user accounts
    
    // Mentor 1: Prof. Afia Frimpomaa Asare Marfo
    await db.execute(sql`
      INSERT INTO mentors (name, email, phone, user_id, assigned_district, specialization, bio, is_active, assigned_districts)
      VALUES ('Prof. Afia Frimpomaa Asare Marfo', 'afia.marfo@example.com', '0244783321', ${afia.rows[0].id}, 'Bekwai', 'Business Development', 'Professor of Business with expertise in rural business development', true, '["Bekwai", "Gushegu"]')
    `);
    
    // Mentor 2: Dr. George Oppong Appiagyei
    await db.execute(sql`
      INSERT INTO mentors (name, email, phone, user_id, assigned_district, specialization, bio, is_active, assigned_districts)
      VALUES ('Dr. George Oppong Appiagyei', 'george.appiagyei@example.com', '0244123456', ${george.rows[0].id}, 'Gushegu', 'Marketing and Sales', 'Doctor with expertise in marketing strategies for rural businesses', true, '["Gushegu"]')
    `);
    
    // Mentor 3: Prof. Nana Ama Browne Klutse
    await db.execute(sql`
      INSERT INTO mentors (name, email, phone, user_id, assigned_district, specialization, bio, is_active, assigned_districts)
      VALUES ('Prof. Nana Ama Browne Klutse', 'nana.klutse@example.com', '0244789123', ${nana.rows[0].id}, 'Lower Manya Krobo', 'Financial Management', 'Professor with expertise in financial planning for small businesses', true, '["Lower Manya Krobo", "Yilo Krobo"]')
    `);
    
    // Mentor 4: Dr. Stephen Yamoah
    await db.execute(sql`
      INSERT INTO mentors (name, email, phone, user_id, assigned_district, specialization, bio, is_active, assigned_districts)
      VALUES ('Dr. Stephen Yamoah', 'stephen.yamoah@example.com', '0244456789', ${stephen.rows[0].id}, 'Yilo Krobo', 'Operations and Innovation', 'Doctor with expertise in operational efficiency and innovation', true, '["Yilo Krobo"]')
    `);
    
    console.log('Mentor profiles created successfully!');
    
    // Mark the migration as completed in the migration_flags
    await db.execute(sql`
      INSERT INTO migration_flags (flag_name, completed, completed_at)
      VALUES ('mentors_imported', TRUE, NOW())
      ON CONFLICT (flag_name) 
      DO UPDATE SET completed = TRUE, completed_at = NOW()
    `);
    
    await db.execute(sql`
      INSERT INTO migration_flags (flag_name, completed, completed_at)
      VALUES ('youth_profiles_imported', FALSE, NOW())
      ON CONFLICT (flag_name) 
      DO UPDATE SET completed = FALSE, completed_at = NOW()
    `);
    
    console.log('Reset completed successfully! Mentors created and ready for youth profile import.');
  } catch (error) {
    console.error('Error during reset:', error);
    throw error;
  }
}

// Run the function if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetMentorYouthDirect()
    .then(() => {
      console.log('Reset completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during reset:', error);
      process.exit(1);
    });
}