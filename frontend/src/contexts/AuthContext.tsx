"use client"

import React, { createContext, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/apiClient'
import { BookOpen } from 'lucide-react'

interface User {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ADMIN';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
    checkAuth: () => Promise<void>;
    authModalOpen: boolean;
    authModalMode: 'login' | 'register';
    openAuthModal: (mode?: 'login' | 'register') => void;
    closeAuthModal: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true,
    checkAuth: async () => { },
    authModalOpen: false,
    authModalMode: 'login',
    openAuthModal: () => { },
    closeAuthModal: () => { },
    logout: async () => { },
})

export const AuthBootstrapProvider = ({ children }: { children: React.ReactNode }) => {
    const [authModalOpen, setAuthModalOpen] = React.useState(false);
    const [authModalMode, setAuthModalMode] = React.useState<'login' | 'register'>('login');

    const { data: user, isLoading, isError, refetch } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => apiClient<User>('/auth/me'),
        staleTime: 2 * 60 * 1000, // 2 min - keeps auth fresh without excessive calls
        retry: false,
        refetchOnWindowFocus: true, // Re-validate when user returns to tab
        refetchOnMount: 'always', // Always check auth on navigation
    });

    const router = useRouter();
    const queryClient = useQueryClient();

    React.useEffect(() => {
        // --- Universal Auth: Token Pickup from URL (Brave/Privacy Fix) ---
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const at = params.get('at');
            const rt = params.get('rt');

            if (at && rt) {
                // Store in localStorage for Header-based auth fallback
                localStorage.setItem('accessToken', at);
                localStorage.setItem('refreshToken', rt);

                // Clean URL immediately
                const newUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, '', newUrl);

                // Re-trigger auth check to populate user state
                refetch();
            }
        }

        const handleUnauthorized = () => {
            queryClient.setQueryData(["auth", "me"], null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setAuthModalMode('login');
            setAuthModalOpen(true);
            router.push('/');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [queryClient, router, refetch]);

    const currentUser = isError ? null : (user || null);

    const checkAuth = async () => {
        await refetch();
    }

    const openAuthModal = (mode: 'login' | 'register' = 'login') => {
        setAuthModalMode(mode);
        setAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setAuthModalOpen(false);
    };

    const logout = async () => {
        try {
            // 1. Inform backend
            await apiClient('/auth/logout', { method: 'POST' }).catch(() => { });

            // 2. Clear hybrid state (Headers + Cookies)
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // 3. Update React state immediately
            queryClient.setQueryData(["auth", "me"], null);

            // 4. Force a hard reset if needed, but relative push is cleaner
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user: currentUser,
            isAuthenticated: !!currentUser,
            isAdmin: currentUser?.role === 'ADMIN',
            loading: isLoading,
            checkAuth,
            authModalOpen,
            authModalMode,
            openAuthModal,
            closeAuthModal,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
