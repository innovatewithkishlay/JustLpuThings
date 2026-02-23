"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { BookOpen, Clock, TrendingUp, Sparkles } from 'lucide-react'

interface Material {
    id: string
    title: string
    description: string
    subjectCode: string
    viewCount: number
}

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
    visible: { transition: { staggerChildren: 0.05 } }
}

export default function DashboardPage() {
    const { data: trending = [], isLoading: trendingLoading } = useQuery({
        queryKey: ["materials", "trending"],
        queryFn: () => apiClient<Material[]>('/materials/discovery/trending')
    })

    const { data: recent = [], isLoading: recentLoading } = useQuery({
        queryKey: ["materials", "recent"],
        queryFn: () => apiClient<Material[]>('/materials/discovery/recent')
    })

    const loading = trendingLoading || recentLoading

    if (loading) {
        return (
            <div className="page-container pt-8">
                <DashboardSkeleton />
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-24 pt-10 page-container">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-20">

                {/* Continue Reading Section (Horizontal) */}
                {recent.length > 0 && (
                    <motion.section variants={fadeUp}>
                        <div className="flex flex-col gap-1 mb-8">
                            <h2 className="text-2xl font-heading font-bold flex items-center gap-3">
                                <div className="p-1.5 bg-primary/10 rounded-lg"><Clock className="w-5 h-5 text-primary" /></div>
                                Resume Flow
                            </h2>
                            <p className="text-muted-foreground font-medium text-sm ml-10">Pick up exactly where you left off</p>
                        </div>

                        <div className="flex space-x-6 overflow-x-auto pb-8 pt-2 px-2 -mx-2 no-scrollbar snap-x">
                            {recent.map((mat) => (
                                <Link href={`/viewer/${mat.id}`} key={`recent-${mat.id}`} className="snap-start min-w-[340px] sm:min-w-[420px]">
                                    <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
                                        <Card className="flex items-center gap-5 p-5 rounded-[24px] bg-surface border-border/60 hover:border-primary/30 soft-shadow hover:shadow-primary/5 transition-all group overflow-hidden relative">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />

                                            <div className="w-20 h-28 rounded-2xl bg-muted/30 flex items-center justify-center border border-border/50 flex-shrink-0 group-hover:bg-primary/5 transition-colors duration-500 relative z-10">
                                                <BookOpen className="w-8 h-8 text-muted-foreground/70 group-hover:text-primary transition-colors duration-500 group-hover:scale-110" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2 relative z-10">
                                                <h3 className="font-heading font-bold text-[17px] truncate group-hover:text-primary transition-colors">{mat.title}</h3>
                                                <p className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase mt-1 mb-4">{mat.subjectCode}</p>
                                                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: '66%' }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Trending Section (Grid) */}
                {trending.length > 0 && (
                    <motion.section variants={fadeUp}>
                        <div className="flex flex-col gap-1 mb-8">
                            <h2 className="text-2xl font-heading font-bold flex items-center gap-3">
                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><TrendingUp className="w-5 h-5" /></div>
                                Trending Vectors
                            </h2>
                            <p className="text-muted-foreground font-medium text-sm ml-10">High velocity materials actively researched</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {trending.map((mat) => (
                                <Link href={`/viewer/${mat.id}`} key={`trend-${mat.id}`}>
                                    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="h-full">
                                        <Card className="h-full flex flex-col p-6 rounded-[24px] bg-surface border-border/60 hover:border-primary/30 soft-shadow hover:shadow-primary/5 group relative overflow-hidden">
                                            <div className="absolute right-0 bottom-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mb-10 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />

                                            <div className="aspect-[4/3] rounded-2xl bg-muted/30 flex items-center justify-center mb-5 relative overflow-hidden border border-border/30 group-hover:bg-primary/5 transition-colors duration-500 z-10">
                                                <BookOpen className="w-12 h-12 text-muted-foreground/30 group-hover:text-primary/70 transition-colors duration-500 group-hover:scale-105" />
                                                <div className="absolute top-3 right-3 bg-surface/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-foreground border border-border/50 soft-shadow">
                                                    {mat.viewCount} ops
                                                </div>
                                            </div>
                                            <div className="relative z-10 flex-1 flex flex-col">
                                                <h3 className="font-heading font-bold text-[17px] line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-2">
                                                    {mat.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-auto font-medium">
                                                    {mat.description}
                                                </p>
                                            </div>
                                        </Card>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Recommendations Section */}
                {recent.length > 0 && (
                    <motion.section variants={fadeUp}>
                        <div className="flex flex-col gap-1 mb-8">
                            <h2 className="text-2xl font-heading font-bold flex items-center gap-3">
                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Sparkles className="w-5 h-5" /></div>
                                Curated Path
                            </h2>
                            <p className="text-muted-foreground font-medium text-sm ml-10">Intelligent discoveries based on access footprints</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {recent.map((mat) => (
                                <Link href={`/viewer/${mat.id}`} key={`rec-${mat.id}`}>
                                    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="h-full">
                                        <Card className="h-full flex flex-col p-6 rounded-[24px] bg-surface border-border/60 hover:border-primary/30 soft-shadow hover:shadow-primary/5 group">
                                            <div className="h-1.5 w-12 bg-muted rounded-full mb-5 group-hover:w-full group-hover:bg-primary transition-all duration-700 ease-out" />
                                            <h3 className="font-heading font-bold text-[17px] line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-2">
                                                {mat.title}
                                            </h3>
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">{mat.subjectCode}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-3 mt-auto font-medium">
                                                {mat.description}
                                            </p>
                                        </Card>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.section>
                )}
            </motion.div>
        </div>
    )
}
