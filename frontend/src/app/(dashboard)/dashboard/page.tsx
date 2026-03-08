"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { BookOpen, Lock, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
    visible: { transition: { staggerChildren: 0.05 } }
}

interface Semester {
    number: number;
    is_active: boolean;
}

export default function DashboardPage() {
    const router = useRouter()
    const { user } = useAuth()

    const { data: semesters = [], isLoading } = useQuery({
        queryKey: ["semesters"],
        queryFn: () => apiClient<Semester[]>('/materials/semesters').then(res => res || [])
    })

    const handleSemesterClick = (id: number, active: boolean) => {
        if (!active) return
        router.push(`/dashboard/semester/${id}`)
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-24 page-container max-w-6xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-12">

                <motion.section variants={fadeUp}>
                    <div className="flex flex-col gap-2 mb-10 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary w-fit mx-auto md:mx-0 mb-2">
                            <Sparkles className="w-4 h-4" /> Welcome back, {user?.name || user?.email?.split('@')[0] || 'Scholar'}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight leading-tight">
                            Academic Progress
                        </h1>
                        <p className="text-muted-foreground font-medium text-base md:text-lg max-w-2xl mt-1">
                            Select your active semester to access curated materials, subjective notes, and official syllabus distributions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-48 rounded-[24px] bg-muted/20 animate-pulse" />
                            ))
                        ) : (
                            semesters.map((sem: Semester) => (
                                <motion.div key={sem.number} whileHover={sem.is_active ? { y: -6, scale: 1.02 } : {}}>
                                    <Card
                                        onClick={() => handleSemesterClick(sem.number, sem.is_active)}
                                        className={`relative h-full flex flex-col p-6 rounded-[24px] border soft-shadow transition-all group overflow-hidden ${sem.is_active
                                            ? 'cursor-pointer bg-surface border-border/60 hover:border-primary/40 hover:shadow-primary/10'
                                            : 'cursor-not-allowed bg-muted/20 border-border/30 opacity-70 grayscale-[0.5]'
                                            }`}
                                    >
                                        {sem.is_active && (
                                            <div className="absolute right-0 bottom-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mb-10 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />
                                        )}

                                        <div className="flex items-start justify-between mb-8 relative z-10">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors duration-500 ${sem.is_active
                                                ? 'bg-primary/10 border-primary/20 text-primary group-hover:bg-primary/20'
                                                : 'bg-muted border-border/50 text-muted-foreground'
                                                }`}>
                                                {sem.is_active ? <BookOpen className="w-7 h-7" /> : <Lock className="w-6 h-6 opacity-60" />}
                                            </div>

                                            {!sem.is_active && (
                                                <div className="px-3 py-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground soft-shadow">
                                                    Coming Soon
                                                </div>
                                            )}
                                            {sem.is_active && (
                                                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500 soft-shadow">
                                                    Active
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative z-10 mt-auto">
                                            <h3 className={`font-heading font-bold text-2xl transition-colors ${sem.is_active ? 'group-hover:text-primary text-foreground' : 'text-muted-foreground'}`}>
                                                Semester {sem.number}
                                            </h3>
                                            {sem.is_active && (
                                                <p className="text-sm text-muted-foreground font-medium mt-2">
                                                    Explore subjects and materials
                                                </p>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.section>

            </motion.div>
        </div>
    )
}
