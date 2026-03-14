export const getBaseUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
        if (process.env.NODE_ENV === 'development') {
            throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined in environment variables. Do not hardcode URLs in fetch.");
        }
        return "";
    }
    return url;
};

export const API_BASE_URL = getBaseUrl();

export interface ApiError {
    message: string;
    status: number;
}

// Flag to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for the existing attempt
    if (isRefreshing && refreshPromise) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) return false;

            const data = await res.json();
            // Update localStorage with fresh tokens
            if (data?.data?.accessToken) {
                localStorage.setItem('accessToken', data.data.accessToken);
            }
            if (data?.data?.refreshToken) {
                localStorage.setItem('refreshToken', data.data.refreshToken);
            }
            return true;
        } catch {
            return false;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

function buildHeaders(options: RequestInit): Headers {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    // --- Universal Auth: Header-based fallback (Brave/Privacy Fix) ---
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token && !headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
        }
    }

    return headers;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = buildHeaders(options);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers
    });

    let data;
    try {
        data = await response.json();
    } catch {
        // fallback if no JSON
    }

    // --- Smart 401 Retry: Attempt silent refresh before giving up ---
    if (response.status === 401 && typeof window !== 'undefined') {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
            // Retry original request with fresh token
            const retryHeaders = buildHeaders(options);
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                credentials: "include",
                headers: retryHeaders
            });

            let retryData;
            try {
                retryData = await retryResponse.json();
            } catch {
                // fallback
            }

            if (!retryResponse.ok) {
                const errorDetail: ApiError = {
                    message: retryData?.error?.message || retryData?.message || "An unexpected error occurred",
                    status: retryResponse.status
                };
                throw errorDetail;
            }

            return retryData?.data !== undefined ? retryData.data : retryData;
        }
    }

    if (!response.ok) {
        const errorDetail: ApiError = {
            message: data?.error?.message || data?.message || "An unexpected error occurred",
            status: response.status
        };
        throw errorDetail;
    }

    return data?.data !== undefined ? data.data : data;
}

