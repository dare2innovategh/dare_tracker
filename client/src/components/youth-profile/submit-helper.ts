// Helper function to submit form data with credentials included
export async function submitFormData(url: string, method: string, formData: FormData) {
  const response = await fetch(url, {
    method,
    credentials: 'include', // Include cookies for authentication
    body: formData,
  });
  
  return response;
}