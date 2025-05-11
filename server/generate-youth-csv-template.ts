import * as fs from 'fs';
import { parse } from 'path';

/**
 * Generate a sample CSV template file for youth profile imports
 * This will create a CSV file with the correct headers and example data
 */
function generateYouthCSVTemplate() {
  try {
    console.log('Generating sample CSV template for youth profile imports...');
    
    // Define headers based on the youth profile schema
    const headers = [
      'Participant Code', // D00XXXXXXX format
      'Full Name',
      'Phone Number',
      'Email',
      'Gender',
      'Marital Status',
      'Children Count',
      'Year of Birth',
      'Age',
      'Age Group',
      'District', // Required: Bekwai, Gushegu, Lower Manya Krobo, Yilo Krobo
      'Town',
      'Core Skills',
      'Skill Level',
      'Industry Expertise',
      'Years of Experience',
      'Business Interest',
      'Employment Status',
      'Specific Job',
      'PWD Status', // Disability status
      'DARE Model', // Collaborative, MakerSpace, Madam Anchor
      'Is Madam', // Boolean, true/false
      'Is Apprentice', // Boolean, true/false
      'Madam Name',
      'Madam Phone',
      'Apprentice Names', // Comma-separated list
      'Apprentice Phone',
      'Guarantor',
      'Guarantor Phone',
      'Digital Skills',
      'Digital Skills 2',
      'Financial Aspirations',
      'Dependents',
      'National ID',
      'Training Status', // In Progress, Completed
      'Program Status'
    ];
    
    // Create example data rows
    const exampleRows = [
      [
        'D001234567',
        'John Doe',
        '+233501234567',
        'john.doe@example.com',
        'Male',
        'Single',
        '0',
        '1995',
        '30',
        '25-35',
        'Bekwai',
        'Central Bekwai',
        'Baking, Food Processing',
        'Intermediate',
        'Food & Beverage',
        '3',
        'Food Business',
        'Self-employed',
        '',
        'Not Disabled',
        'Collaborative',
        'false',
        'false',
        '',
        '',
        '',
        '',
        'Samuel Mensah',
        '+233507654321',
        'Computer literacy',
        'Social media marketing',
        'Expand business to other districts',
        '0',
        'GHA-123456789',
        'Completed',
        'Active'
      ],
      [
        'D009876543',
        'Jane Smith',
        '+233557654321',
        'jane.smith@example.com',
        'Female',
        'Married',
        '2',
        '1988',
        '37',
        '35-45',
        'Lower Manya Krobo',
        'Odumase',
        'Tailoring, Fashion Design',
        'Expert',
        'Fashion & Textiles',
        '8',
        'Clothing Business',
        'Self-employed',
        '',
        'Not Disabled',
        'Madam Anchor',
        'true',
        'false',
        '',
        '',
        'Mary Johnson, Elizabeth Brown',
        '+233551234567',
        'Joseph Owusu',
        '+233209876543',
        'Microsoft Office',
        'Email communication',
        'Expand to international markets',
        '2',
        'GHA-987654321',
        'Completed',
        'Active'
      ]
    ];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    exampleRows.forEach(row => {
      csvContent += row.map(field => {
        // Wrap fields with commas in double quotes
        if (field.includes(',')) {
          return `"${field}"`;
        }
        return field;
      }).join(',') + '\n';
    });
    
    // Write to file
    const outputPath = './youth-profiles-template.csv';
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`Sample CSV template generated at: ${outputPath}`);
    
    // Print the sample format to console as well
    console.log('\nSample CSV Format:');
    console.log(csvContent);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating CSV template:', error);
    throw error;
  }
}

// Run the generator
generateYouthCSVTemplate();