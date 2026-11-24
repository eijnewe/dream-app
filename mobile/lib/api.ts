const API_URL = 'https://dream-app-backend-knll.onrender.com';

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super('API-anropet misslyckades.');
  }
}

export type ApiOptions = Omit<RequestInit, 'body' | 'headers'> & { body?: object };

export async function apiRequest<T>(
  path: string,
  { body, token, ...options }: ApiOptions & { token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: body && JSON.stringify(body),
  });
  if (!response.ok) throw new ApiError(response.status);
  if (response.status === 204) return undefined as T;
  return response.json();
}
