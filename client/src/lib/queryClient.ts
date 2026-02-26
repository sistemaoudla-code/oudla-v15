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
): Promise<Response> {
  const sessionId = localStorage.getItem('admin_session');
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

function buildUrl(queryKey: readonly unknown[]): string {
  const [baseUrl, ...rest] = queryKey;
  let url = String(baseUrl);
  
  // Se houver parâmetros adicionais
  if (rest.length > 0) {
    const lastParam = rest[rest.length - 1];
    
    // Se o último parâmetro é um objeto, converter para query string
    if (lastParam && typeof lastParam === 'object' && !Array.isArray(lastParam)) {
      const params = new URLSearchParams();
      Object.entries(lastParam as Record<string, string>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    } else {
      // Se não for objeto, juntar com / (para IDs, etc)
      url = queryKey.filter(k => k !== null && k !== undefined).join("/") as string;
    }
  }
  
  return url;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const sessionId = localStorage.getItem('admin_session');
    const headers: Record<string, string> = {};
    
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }
    
    const url = buildUrl(queryKey);
    
    const res = await fetch(url, {
      credentials: "include",
      headers,
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
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutos - dados ficam "fresh" por 5min
      gcTime: 10 * 60 * 1000, // 10 minutos - cache dura 10min
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
});
