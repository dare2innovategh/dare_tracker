import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: {
    headers?: Record<string, string>,
    forceAuth?: boolean
  } = {}
): Promise<Response> {
  const { forceAuth = false, headers: customHeaders = {} } = options;
  
  // Setup default headers
  const headers: Record<string, string> = { ...customHeaders };
  
  // Only set Content-Type if not already set and data is not FormData
  if (data && !(data instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Generate a timestamp to prevent caching
  const timestampedUrl = url.includes('?') 
    ? `${url}&_t=${Date.now()}` 
    : `${url}?_t=${Date.now()}`;

  // Prepare body based on data type
  let body: any = undefined;
  if (data) {
    if (data instanceof FormData) {
      body = data; // Use FormData directly
    } else {
      body = JSON.stringify(data); // JSON stringify other data
    }
  }

  const res = await fetch(timestampedUrl, {
    method,
    headers: headers,
    body: body,
    credentials: "include", // Important for sending session cookies
  });

  // Add better logging for 401 errors to help with debugging
  if (res.status === 401) {
    console.error(`Authentication error (401) for ${method} ${url}. User not logged in or session expired.`);
    
    // If forceAuth is true, throw auth errors immediately instead of letting them propagate
    if (forceAuth) {
      throw new Error("Authentication required - please log in again");
    }
  }

  // Only check non-auth errors if we're not already handling auth errors
  if (!(forceAuth && res.status === 401)) {
    await throwIfResNotOk(res);
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
