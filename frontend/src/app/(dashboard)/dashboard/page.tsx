"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Search, TrendingUp, Clock, Compass, FileText } from 'lucide-react'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { apiFetch } from '@/lib/api'

// Mock Data Type since backend returns raw
type Material = {
    id: string;
    title: string;
    subject_code: string;
    description: string;
    material_type: string;
    views?: number;
}

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [trending, setTrending] = useState<Material[]>([])
    const [recent, setRecent] = useState<Material[]>([])

    useEffect(() => {
        async function loadDashboard() {
            try {
                // Parallel requests fetching multiple sets natively
                const [trendingRes, recentRes] = await Promise.all([
                    apiFetch<Material[]>('/materials/public?limit=4&sort=views'),
                    apiFetch<Material[]>('/materials/public?limit=3&sort=recent')
                ])
                setTrending(trendingRes || [])
                setRecent(recentRes || [])
            } catch (err) {
                console.error("Dashboard Load Failed", err)
            } finally {
                setLoading(false)
            }
        }
        loadDashboard()
    }, [])

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    return (
        <div className="min-h-screen bg-background pb-20">

            {/* Top Navigation Spacer (If layout has nav) */}
            <div className="h-20" />

            <main className="container mx-auto px-6">

                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="space-y-12"
                    >

                        {/* Search Section */}
                        <div className="flex flex-col flex-1 items-center justify-center pt-8 pb-4">
                            <h1 className="text-3xl md:text-5xl font-heading font-semibold text-center mb-8 tracking-tight">
                                What are you studying today?
                            </h1>
                            <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search strictly for notes, PYQs, assignments..."
                                    className="h-16 pl-16 pr-6 text-lg rounded-full border-border/50 soft-shadow bg-card focus-visible:ring-primary/20 transition-shadow hover:shadow-md"
                                />
                            </form>
                        </div>

                        {/* Trending Section */}
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-heading font-semibold">Trending Materials</h2>
                            </div>

                            {trending.length === 0 ? (
                                <div className="text-muted-foreground p-8 bg-card rounded-xl text-center border border-border border-dashed">No trending materials found.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {trending.map((mat, i) => (
                                        <Link href={`/viewer/${mat.id}`} key={mat.id}>
                                            <motion.div
                                                whileHover={{ y: -4 }}
                                                transition={{ duration: 0.2 }}
                                                className="h-full"
                                            >
                                                <Card className="h-full soft-shadow cursor-pointer border-border hover:border-primary/20 transition-colors">
                                                    <CardHeader className="pb-3">
                                                        <div className="text-xs font-mono text-muted-foreground mb-1">{mat.subject_code} • {mat.material_type}</div>
                                                        <CardTitle className="leading-tight text-lg">{mat.title}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <CardDescription className="line-clamp-2">{mat.description}</CardDescription>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Continue Reading / Recent Section */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 mt-12">
                                <Clock className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-heading font-semibold">Recently Added</h2>
                            </div>

                            {recent.length === 0 ? (
                                <div className="text-muted-foreground p-8 bg-card rounded-xl text-center border border-border border-dashed">No recent materials available.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {recent.map((mat, i) => (
                                        <Link href={`/viewer/${mat.id}`} key={mat.id}>
                                            <motion.div
                                                whileHover={{ y: -4 }}
                                                transition={{ duration: 0.2 }}
                                                className="h-full"
                                            >
                                                <Card className="h-full soft-shadow cursor-pointer border-border hover:border-primary/20 transition-colors flex flex-col justify-between">
                                                    <CardHeader className="pb-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="text-xs font-mono text-muted-foreground mb-1">{mat.subject_code}</div>
                                                        </div>
                                                        <CardTitle className="text-base leading-tight line-clamp-2">{mat.title}</CardTitle>
                                                    </CardHeader>
                                                </Card>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                    </motion.div>
                )}
            </main>
        </div>
    )
}
