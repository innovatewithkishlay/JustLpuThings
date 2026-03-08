"use client"

import { usePathname } from 'next/navigation'
import React from 'react'
import { MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WHATSAPP_COMMUNITY_LINK } from '@/lib/constants'

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isViewer = pathname?.startsWith('/viewer/')

    if (isViewer) {
        return (
            <main className="h-screen overflow-hidden bg-background">
                {children}
            </main>
        )
    }

    return (
        <main className="min-h-screen pt-[112px] bg-background">
            {children}

            {/* Global Floating WhatsApp Button */}
            <AnimatePresence>
                <motion.a
                    href={WHATSAPP_COMMUNITY_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#25D366]/40 group border-4 border-white dark:border-[#06080C] transition-colors"
                >
                    <MessageCircle className="w-7 h-7 fill-current" />

                    {/* Tooltip Label */}
                    <span className="absolute right-full mr-4 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-border/10">
                        Join Community
                    </span>

                    {/* Ring Pulse Effect */}
                    <span className="absolute inset-0 rounded-full bg-[#25D366]/30 animate-ping -z-10" />
                </motion.a>
            </AnimatePresence>
        </main>
    )
}
