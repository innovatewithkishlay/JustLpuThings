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

        // Clean URL immediately
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', newUrl);
        return true;
    }
    return false;
}

export const AuthBootstrapProvider = ({ children }: { children: React.ReactNode }) => {
    const [authModalOpen, setAuthModalOpen] = React.useState(false);
    const [authModalMode, setAuthModalMode] = React.useState<'login' | 'register'>('login');

    // Pick up tokens synchronously on first render, BEFORE any query fires
    const [didPickupTokens] = React.useState(() => pickupTokensFromUrl());

    const { data: user, isLoading, isError, refetch } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => apiClient<User>('/auth/me'),
        staleTime: 2 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
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
            // Don't force logout if we just picked up tokens (race condition guard)
            if (didPickupTokens && !user) return;

            queryClient.removeQueries({ queryKey: ["auth", "me"] });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setAuthModalMode('login');
            setAuthModalOpen(true);
            router.push('/');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [queryClient, router, didPickupTokens, user]);

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
            // 1. Inform backend (fire-and-forget)
            await apiClient('/auth/logout', { method: 'POST' }).catch(() => { });

            // 2. Clear hybrid state (Headers + Cookies)
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // 3. Kill the auth query entirely - prevents refetchOnMount from resurrecting it
            await queryClient.cancelQueries({ queryKey: ["auth", "me"] });
            queryClient.removeQueries({ queryKey: ["auth", "me"] });

            // 4. Navigate home
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

