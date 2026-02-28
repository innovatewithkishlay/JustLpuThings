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
})

export const AuthBootstrapProvider = ({ children }: { children: React.ReactNode }) => {
    const [authModalOpen, setAuthModalOpen] = React.useState(false);
    const [authModalMode, setAuthModalMode] = React.useState<'login' | 'register'>('login');

    const { data: user, isLoading, isError, refetch } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => apiClient<User>('/auth/me'),
        staleTime: 5 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const router = useRouter();
    const queryClient = useQueryClient();

    React.useEffect(() => {
        const handleUnauthorized = () => {
            queryClient.setQueryData(["auth", "me"], null);
            setAuthModalMode('login');
            setAuthModalOpen(true);
            router.push('/');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [queryClient, router]);

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
            closeAuthModal
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
