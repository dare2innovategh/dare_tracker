/**
 * Makerspace API Test Script
 * 
 * This script tests the makerspace API endpoints to ensure they're working correctly.
 * It's designed to be run from the command line with Node.js.
 */

// Using built-in fetch API

// Base URL for API requests
const BASE_URL = 'http://localhost:5000/api';

// Test data for a new makerspace
const testMakerspace = {
  name: "Test Makerspace " + Math.floor(Math.random() * 1000),
  district: "Bekwai",
  address: "123 Test Street, Bekwai, Ghana",
  description: "A test makerspace created via the API test script",
  coordinates: "5.6037° N, 0.1870° W",
  contactPhone: "+233 50 123 4567",
  contactEmail: "test@example.com",
  operatingHours: "Mon-Fri: 9AM-5PM",
  openDate: new Date().toISOString() // Using today's date
};

// Variables to store created makerspace data
let createdMakerspaceId;
let makerspacesCount = 0;

/**
 * Helper function for making API requests
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error(`API Request Error for ${url}:`, error);
    return {
      status: 500,
      error: error.message
    };
  }
}

/**
 * Test: Get all makerspaces
 */
async function testGetMakerspaces() {
  console.log('\n🔍 Testing GET /api/makerspaces');
  
  const result = await apiRequest('/makerspaces');
  
  if (result.status === 200) {
    makerspacesCount = result.data.length;
    console.log(`✅ Success! Found ${makerspacesCount} makerspaces.`);
    return true;
  } else {
    console.log('❌ Failed to get makerspaces:', result);
    return false;
  }
}

/**
 * Test: Create a new makerspace
 */
async function testCreateMakerspace() {
  console.log('\n🔍 Testing POST /api/makerspaces');
  console.log('Creating makerspace with data:', testMakerspace);
  
  const result = await apiRequest('/makerspaces', 'POST', testMakerspace);
  
  if (result.status === 201) {
    createdMakerspaceId = result.data.id;
    console.log(`✅ Success! Created makerspace with ID: ${createdMakerspaceId}`);
    console.log('Created makerspace data:', result.data);
    return true;
  } else {
    console.log('❌ Failed to create makerspace:', result);
    return false;
  }
}

/**
 * Test: Get a specific makerspace by ID
 */
async function testGetMakerspaceById() {
  if (!createdMakerspaceId) {
    console.log('⚠️ Skipping get by ID test as no makerspace was created');
    return false;
  }
  
  console.log(`\n🔍 Testing GET /api/makerspaces/${createdMakerspaceId}`);
  
  const result = await apiRequest(`/makerspaces/${createdMakerspaceId}`);
  
  if (result.status === 200) {
    console.log('✅ Success! Retrieved makerspace:');
    console.log(JSON.stringify(result.data, null, 2));
    
    // Verify the data matches what we created
    const matches = result.data.name === testMakerspace.name;
    if (matches) {
      console.log('✅ Data validation passed');
    } else {
      console.log('❌ Data validation failed - retrieved data doesn\'t match created data');
    }
    
    return true;
  } else {
    console.log(`❌ Failed to get makerspace with ID ${createdMakerspaceId}:`, result);
    return false;
  }
}

/**
 * Test: Update a makerspace
 */
async function testUpdateMakerspace() {
  if (!createdMakerspaceId) {
    console.log('⚠️ Skipping update test as no makerspace was created');
    return false;
  }
  
  console.log(`\n🔍 Testing PATCH /api/makerspaces/${createdMakerspaceId}`);
  
  const updateData = {
    description: "Updated description via API test",
    operatingHours: "Mon-Sat: 8AM-6PM"
  };
  
  console.log('Updating with data:', updateData);
  
  const result = await apiRequest(`/makerspaces/${createdMakerspaceId}`, 'PATCH', updateData);
  
  if (result.status === 200) {
    console.log('✅ Success! Updated makerspace:');
    console.log(JSON.stringify(result.data, null, 2));
    
    // Verify the update was applied - handle snake_case response
    const descriptionUpdated = result.data.description === updateData.description;
    const hoursUpdated = 
      result.data.operatingHours === updateData.operatingHours || 
      result.data.operating_hours === updateData.operatingHours;
    
    if (descriptionUpdated && hoursUpdated) {
      console.log('✅ Update validation passed');
    } else {
      console.log('❌ Update validation failed - some fields were not updated correctly');
      console.log(`Description match: ${descriptionUpdated}`);
      console.log(`Hours match: ${hoursUpdated}`);
      console.log(`Expected hours: "${updateData.operatingHours}", got: "${result.data.operatingHours || result.data.operating_hours}"`);
    }
    
    return true;
  } else {
    console.log(`❌ Failed to update makerspace with ID ${createdMakerspaceId}:`, result);
    return false;
  }
}

/**
 * Test: Get makerspaces by district
 */
async function testGetMakerspacesByDistrict() {
  const district = "Bekwai";
  console.log(`\n🔍 Testing GET /api/makerspaces/district/${district}`);
  
  const result = await apiRequest(`/makerspaces/district/${district}`);
  
  if (result.status === 200) {
    console.log(`✅ Success! Found ${result.data.length} makerspaces in ${district}.`);
    return true;
  } else {
    console.log(`❌ Failed to get makerspaces for district ${district}:`, result);
    return false;
  }
}

/**
 * Test: Delete a makerspace
 * Note: This requires authentication, so it will likely fail in this script
 */
async function testDeleteMakerspace() {
  if (!createdMakerspaceId) {
    console.log('⚠️ Skipping delete test as no makerspace was created');
    return false;
  }
  
  console.log(`\n🔍 Testing DELETE /api/makerspaces/${createdMakerspaceId}`);
  console.log('⚠️ Note: This test may fail due to authentication requirements');
  
  const result = await apiRequest(`/makerspaces/${createdMakerspaceId}`, 'DELETE');
  
  if (result.status === 200) {
    console.log('✅ Success! Deleted makerspace.');
    return true;
  } else {
    console.log(`❌ Failed to delete makerspace with ID ${createdMakerspaceId}:`, result);
    console.log('This may be expected if authentication is required.');
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('🧪 Starting Makerspace API Tests');
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Get all makerspaces
  total++;
  if (await testGetMakerspaces()) passed++;
  
  // Test 2: Create a makerspace
  total++;
  if (await testCreateMakerspace()) passed++;
  
  // Test 3: Get makerspace by ID
  total++;
  if (await testGetMakerspaceById()) passed++;
  
  // Test 4: Update makerspace
  total++;
  if (await testUpdateMakerspace()) passed++;
  
  // Test 5: Get makerspaces by district
  total++;
  if (await testGetMakerspacesByDistrict()) passed++;
  
  // Test 6: Delete makerspace (likely to fail due to auth)
  total++;
  if (await testDeleteMakerspace()) passed++;
  
  // Print final results
  console.log('\n📊 Test Results:');
  console.log(`Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. See details above.');
    
    if (createdMakerspaceId) {
      console.log(`\n⚠️ A test makerspace with ID ${createdMakerspaceId} was created and may need to be deleted manually.`);
    }
  }
}

// Execute all tests
runTests().catch(error => {
  console.error('Test execution error:', error);
});