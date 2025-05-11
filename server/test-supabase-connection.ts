import { supabase, checkSupabaseTables } from './supabase';

async function testSupabaseQuery() {
  console.log('Testing Supabase connection and queries...');
  
  if (!supabase) {
    console.error('Supabase client is not initialized. Check your environment variables.');
    return;
  }

  // Check which tables exist in Supabase
  console.log('Checking available tables in Supabase...');
  const tablesStatus = await checkSupabaseTables();
  console.log('Tables status:', tablesStatus);
  
  try {
    // Get tables in a different way
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('get_all_tables');

    if (schemaError) {
      console.error('Error getting schema info with RPC:', schemaError);
      
      // Alternative approach
      console.log('Trying alternative approach to get tables...');
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      if (tablesError) {
        console.error('Error getting tables from information_schema:', tablesError);
      } else {
        console.log('Tables from information_schema:', tables);
      }
    } else {
      console.log('Schema info from RPC:', schemaInfo);
    }

    // Test districts query
    console.log('\nQuerying districts table...');
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select('*');
    
    if (districtsError) {
      console.error('Error querying districts:', districtsError);
    } else {
      console.log('Districts data:', districts);
    }

    // Test skills query
    console.log('\nQuerying skills table...');
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .limit(5);
    
    if (skillsError) {
      console.error('Error querying skills:', skillsError);
    } else {
      console.log('Skills data (limited to 5):', skills);
    }

    // Test service categories query
    console.log('\nQuerying service categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('*');
    
    if (categoriesError) {
      console.error('Error querying service categories:', categoriesError);
    } else {
      console.log('Service categories data:', categories);
    }

    // Test training programs query
    console.log('\nQuerying training programs table...');
    const { data: programs, error: programsError } = await supabase
      .from('training_programs')
      .select('*');
    
    if (programsError) {
      console.error('Error querying training programs:', programsError);
    } else {
      console.log('Training programs data:', programs);
    }

    console.log('\nQuery tests completed.');
  } catch (error) {
    console.error('Unexpected error during Supabase testing:', error);
  }
}

// Run the test
testSupabaseQuery()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));