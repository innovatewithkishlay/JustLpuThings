"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen } from 'lucide-react'

export function ProtectedLayout({
    children,
    requireAdmin = false
}: {
    children: React.ReactNode,
    requireAdmin?: boolean
}) {
    const { user, isAuthenticated, isAdmin, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                // Build isolated redirect preserving intended URL for post-login optionally
                router.push(`/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`)
            } else if (requireAdmin && !isAdmin) {
                // Unauthorized non-admin attempt
                router.push('/dashboard')
            }
        }
    }, [loading, isAuthenticated, isAdmin, requireAdmin, router, pathname])

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md">
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="relative">
                            {/* Premium Spinner Structure */}
                            <div className="absolute inset-0 rounded-full border border-primary/20 blur-sm scale-150 animate-pulse" />
                            <div className="w-16 h-16 rounded-2xl bg-surface border border-border soft-shadow flex items-center justify-center relative overflow-hidden group">
                                {/* Shimmer sweep */}
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                                <BookOpen className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2 text-center">
                            <h3 className="font-heading font-bold text-lg text-foreground tracking-tight">Authenticating Identity</h3>
                            <p className="text-sm text-muted-foreground font-mono">Verifying encrypted vault tokens...</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        )
    }

    // Prevent UI flash if conditions failed during effect resolution
    if (!isAuthenticated || (requireAdmin && !isAdmin)) {
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full"
        >
            {children}
        </motion.div>
    )
}
