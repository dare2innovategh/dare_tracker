import { db } from './db.js';
import { trainingPrograms } from '@shared/schema.js';

async function createTrainingProgramsTable() {
  try {
    console.log('Creating training_programs table...');
    
    // Check if table exists
    const tableExists = await db.execute(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'training_programs'
      )`
    );
    
    if (tableExists.rows[0].exists) {
      console.log('training_programs table already exists');
      return;
    }
    
    // Create training_programs table
    await db.execute(`
      CREATE TABLE training_programs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        modules JSONB,
        default_program BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);
    
    console.log('Successfully created training_programs table');
    
    // Seed with ERDE program
    const erdeModules = [
      "Introduction to Digital Devices",
      "The Internet and Mobile Applications",
      "Introduction to Social Media",
      "Using Social Media for Business",
      "Digital Content Creation and Distribution",
      "Digital Financial Management",
      "Using Mobile Money in Business",
      "Digital Safety and Security",
      "Entrepreneurship and Gender Empowerment"
    ];
    
    await db.insert(trainingPrograms).values({
      name: "Empower Rural Digital Entrepreneur (ERDE)",
      description: "A comprehensive digital skills training program for rural entrepreneurs",
      modules: erdeModules,
      defaultProgram: true
    });
    
    console.log('Successfully seeded ERDE program data');
    
  } catch (error) {
    console.error('Error creating training_programs table:', error);
    throw error;
  }
}

// Execute the function directly
createTrainingProgramsTable()
  .then(() => {
    console.log('Training programs table creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Training programs table creation failed:', error);
    process.exit(1);
  });

export default createTrainingProgramsTable;