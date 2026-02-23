import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
    queryCache: new QueryCache({
        onError: (error: any) => {
            const message = error?.message || 'Failed to fetch data'
            toast.error(message)
        }
    }),
    mutationCache: new MutationCache({
        onError: (error: any) => {
            const message = error?.message || 'Operation failed'
            toast.error(message)
        }
    })
});
