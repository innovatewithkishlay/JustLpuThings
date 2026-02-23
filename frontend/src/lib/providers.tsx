"use client"

import { ThemeProvider } from '@/components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthBootstrapProvider } from '@/contexts/AuthContext';
import { queryClient } from './queryClient';

export function Providers({ children }: { children: React.ReactNode }) {


    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <AuthBootstrapProvider>
                    {children}
                </AuthBootstrapProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
