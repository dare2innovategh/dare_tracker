/**
 * Simple script to test youth profile import functionality
 */

// Use built-in fetch API
// No need to import in modern Node.js

async function testYouthProfileImport() {
  console.log('Testing youth profile import API...');
  
  try {
    // First login to get authentication
    console.log('Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'mastercard'
      }),
      credentials: 'include'
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const user = await loginResponse.json();
    console.log(`Logged in successfully as ${user.username} (${user.role})`);
    
    // Get cookies from login response
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Now call the import API
    console.log('Calling youth profile import API...');
    const importResponse = await fetch('http://localhost:5000/api/youth-profiles-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        clearExisting: false // Set to true if you want to clear existing profiles
      })
    });
    
    if (!importResponse.ok) {
      const errorText = await importResponse.text();
      throw new Error(`Import failed: ${importResponse.status} ${importResponse.statusText}\n${errorText}`);
    }
    
    const result = await importResponse.json();
    console.log('Import result:', result);
    console.log('Import test completed successfully!');
  } catch (error) {
    console.error('Error testing youth profile import:', error);
  }
}

// Run the test
testYouthProfileImport();