"use client"

import React, { createContext, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true,
    checkAuth: async () => { },
})

export const AuthBootstrapProvider = ({ children }: { children: React.ReactNode }) => {
    const queryClient = useQueryClient();

    const { data: user, isLoading, isError, refetch } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => apiClient<User>('/auth/me'),
        staleTime: 5 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const currentUser = isError ? null : (user || null);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full border border-primary/20 blur-sm scale-150 animate-pulse" />
                        <div className="w-16 h-16 rounded-2xl bg-surface border border-border soft-shadow flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                            <BookOpen className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const checkAuth = async () => {
        await refetch();
    }

    return (
        <AuthContext.Provider value={{
            user: currentUser,
            isAuthenticated: !!currentUser,
            isAdmin: currentUser?.role === 'ADMIN',
            loading: isLoading,
            checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
