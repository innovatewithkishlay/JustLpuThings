import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

const handleGlobalError = (error: any, query?: any) => {
    // Suppress toasts for the initial auth check or normal 401s
    if (query?.queryKey?.[0] === 'auth' && query?.queryKey?.[1] === 'me') {
        return;
    }

    if (error?.status === 401 || (error?.status === 403 && (error.message?.toLowerCase().includes('suspended') || error.message?.toLowerCase().includes('blocked')))) {
        // Dispatch an event so AuthContext can force a logout/modal
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return;
    }

    // For network errors when offline
    if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network offline. Please check your connection.');
        return;
    }

    const message = error?.message || 'Failed to fetch data';
    toast.error(message);
};

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
    queryCache: new QueryCache({
        onError: (error: any, query) => handleGlobalError(error, query)
    }),
    mutationCache: new MutationCache({
        onError: (error: any, _variables, _context, mutation) => handleGlobalError(error, mutation)
    })
});
