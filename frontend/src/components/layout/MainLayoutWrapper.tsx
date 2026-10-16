"use client"

import { usePathname } from 'next/navigation'
import React from 'react'
import { MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WHATSAPP_COMMUNITY_LINK } from '@/lib/constants'

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [showWhatsApp, setShowWhatsApp] = React.useState(true)
    const isViewer = pathname?.startsWith('/viewer/')
    // Admins are working, not studying: keep the channel bubble off their screens
    const isAdmin = pathname?.startsWith('/admin')

    if (isViewer) {
        return (
            <main className="h-screen overflow-hidden bg-background">
                {children}
            </main>
        )
    }

    return (
        // The home page runs edge-to-edge under the transparent navbar and handles its own top spacing
        <main className={`min-h-screen bg-background ${pathname === '/' ? '' : 'pt-24 md:pt-[112px]'}`}>
            {children}

            {/* Global Floating WhatsApp Button */}
            <AnimatePresence>
                {showWhatsApp && !isAdmin && (
                    <motion.a
                        href={WHATSAPP_COMMUNITY_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            // Hide after a small delay to allow the link to open
                            setTimeout(() => setShowWhatsApp(false), 1000)
                        }}
                        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-[100] w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] group transition-colors"
                    >
                        <MessageCircle className="w-7 h-7 fill-current" />

                        {/* Tooltip Label */}
                        <span className="absolute right-full mr-4 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-border/10">
                            Follow WhatsApp Channel 🌍🤳
                        </span>

                    </motion.a>
                )}
            </AnimatePresence>
        </main>
    )
}
