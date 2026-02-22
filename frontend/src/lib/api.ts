export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const credentials = options.credentials || 'include';

    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials,
        headers,
    });

    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'API Error');
    }

    return data.data;
}
