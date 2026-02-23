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

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

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

    if (!response.ok) {
        const errorDetail: ApiError = {
            message: data?.error?.message || data?.message || "An unexpected error occurred",
            status: response.status
        };
        throw errorDetail;
    }

    return data?.data !== undefined ? data.data : data;
}
