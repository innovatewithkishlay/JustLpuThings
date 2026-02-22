"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, BookOpen, Eye, Info } from 'lucide-react'
import Link from 'next/link'

type MaterialData = {
    material: {
        id: string;
        title: string;
        description: string;
        subject_code: string;
        material_type: string;
        author_id: string; // Uploader
        created_at: string;
    };
    signedUrl: string;
}

export default function ViewerPage() {
    const params = useParams()
    const [data, setData] = useState<MaterialData | null>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDoc() {
            try {
                const result = await apiFetch<MaterialData>(`/materials/${params.id}/access`)
                setData(result)
            } catch (err: any) {
                setError(err.message || 'Failed to load document')
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchDoc()
    }, [params.id])

    // Context Menu Disable
    useEffect(() => {
        const handleContext = (e: MouseEvent) => e.preventDefault()
        document.addEventListener('contextmenu', handleContext)
        return () => document.removeEventListener('contextmenu', handleContext)
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-background p-4 flex flex-col pt-24">
            <Skeleton className="h-10 w-32 mb-6" />
            <div className="flex gap-6 h-[80vh]">
                <Skeleton className="flex-1 rounded-xl" />
                <Skeleton className="w-[300px] rounded-xl hidden md:block" />
            </div>
        </div>
    )

    if (error || !data) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="p-8 max-w-md text-center">
                <BookOpen className="w-12 h-12 mx-auto text-destructive mb-4" />
                <h2 className="text-xl font-heading mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Link href="/dashboard">
                    <Button variant="outline">Return to Dashboard</Button>
                </Link>
            </Card>
        </div>
    )

    const { material, signedUrl } = data

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">

            {/* Viewer Header */}
            <header className="h-16 flex-none border-b border-border/50 bg-card flex items-center justify-between px-4 z-10 soft-shadow">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="font-heading font-semibold text-lg line-clamp-1">{material.title}</div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-mono rounded-md">
                        <Eye className="w-4 h-4" /> Secure Sandbox Active
                    </div>
                </div>
            </header>

            {/* Main Layout Workspace */}
            <main className="flex-1 flex overflow-hidden">

                {/* PDF Embedded Wrapper */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 bg-[#2b2b2b] relative"
                >
                    {/* Transparent absolute overlay blocking clicks from downloading via iframe native options potentially */}
                    <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.1)]"></div>

                    <iframe
                        src={`${signedUrl}#view=FitH&toolbar=0`}
                        className="w-full h-full border-none"
                        title={material.title}
                    />
                </motion.div>

                {/* Info Overlay Panel */}
                <aside className="w-80 border-l border-border/50 bg-card p-6 hidden lg:flex flex-col gap-6 overflow-y-auto z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Info className="w-5 h-5 text-primary" />
                            <h3 className="font-heading font-semibold text-lg">Details</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Subject Code</Label>
                                <div className="font-mono mt-1 text-sm bg-muted px-2 py-1 rounded inline-block">{material.subject_code}</div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Type</Label>
                                <div className="mt-1 capitalize text-sm">{material.material_type.replace('_', ' ')}</div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Description</Label>
                                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{material.description || 'No description provided.'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-border/50">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This document is heavily protected by JustLpuThings metrics limits. Any automated scraping attempts will result in an immediate permanent pipeline ban.
                        </p>
                    </div>
                </aside>

            </main>
        </div>
    )
}
