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
