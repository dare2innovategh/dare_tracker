/**
 * This wrapper ensures all fetch requests include credentials for authentication.
 * It wraps the global fetch to always include the credentials option.
 */

// Store the original fetch function
const originalFetch = window.fetch;

// Replace the global fetch with our enhanced version
window.fetch = function enhancedFetch(input: RequestInfo | URL, init?: RequestInit) {
  // Always include credentials in the request
  const enhancedInit: RequestInit = {
    ...init,
    credentials: 'include',
  };
  
  // Call the original fetch with our enhanced options
  return originalFetch(input, enhancedInit);
};

// Export a dummy function to allow importing this file
export function setupFetchCredentials() {
  console.log('Fetch credentials setup complete');
}