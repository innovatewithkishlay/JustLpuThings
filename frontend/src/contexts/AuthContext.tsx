"use client"

import React, { createContext, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/apiClient'

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

// Synchronous token pickup - runs BEFORE React renders, preventing race conditions
function pickupTokensFromUrl(): boolean {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const at = params.get('at');
    const rt = params.get('rt');

    if (at && rt) {
        localStorage.setItem('accessToken', at);
        localStorage.setItem('refreshToken', rt);
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', newUrl);
        return true;
    }
    return false;
}

export const AuthBootstrapProvider = ({ children }: { children: React.ReactNode }) => {
    const [authModalOpen, setAuthModalOpen] = React.useState(false);
    const [authModalMode, setAuthModalMode] = React.useState<'login' | 'register'>('login');
    const [loggedOut, setLoggedOut] = React.useState(false);

    // Pick up tokens synchronously on first render
    const [didPickupTokens] = React.useState(() => pickupTokensFromUrl());

    const { data: user, isLoading, isError, refetch } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => apiClient<User>('/auth/me'),
        staleTime: 2 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: !loggedOut,
        refetchOnMount: loggedOut ? false : 'always',
        enabled: !loggedOut, // Completely disables query after logout
    });

    const router = useRouter();
    const queryClient = useQueryClient();

    // Close modal automatically after Google OAuth token pickup succeeds
    React.useEffect(() => {
        if (didPickupTokens && user) {
            setAuthModalOpen(false);
        }
    }, [didPickupTokens, user]);

    React.useEffect(() => {
        const handleUnauthorized = () => {
            if (didPickupTokens && !user) return;

            queryClient.setQueryData(["auth", "me"], null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setAuthModalMode('login');
            setAuthModalOpen(true);
            router.push('/');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [queryClient, router, didPickupTokens, user]);

    const currentUser = (isError || loggedOut) ? null : (user || null);

    const checkAuth = async () => {
        setLoggedOut(false); // Re-enable query if it was disabled
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
            // 1. Disable query FIRST to prevent any refetch
            setLoggedOut(true);

            // 2. Inform backend (fire-and-forget)
            apiClient('/auth/logout', { method: 'POST' }).catch(() => { });

            // 3. Clear hybrid state
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // 4. Clear cached user data immediately
            queryClient.setQueryData(["auth", "me"], null);

            // 5. Navigate home
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
            loading: isLoading && !loggedOut,
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
