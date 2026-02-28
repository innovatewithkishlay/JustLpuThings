"use client"

import { usePathname } from 'next/navigation'
import React from 'react'

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
        </main>
    )
}
