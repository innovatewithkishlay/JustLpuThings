"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { BookOpen, Lock, Sparkles, MessageCircle, ExternalLink, MessageSquare, Send, Heart, Trophy, TrendingUp } from 'lucide-react'
import { WHATSAPP_COMMUNITY_LINK } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { FeedbackModal } from '@/components/modals/FeedbackModal'
import { useState } from 'react'

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
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

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
                        <p className="text-muted-foreground font-medium text-sm md:text-base max-w-2xl mt-1">
                            Select your active semester to access official notes, pyqs and curated materials.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-48 rounded-[2rem] bg-muted/20 animate-pulse" />
                            ))
                        ) : (
                            semesters.map((sem: Semester) => (
                                <motion.div key={sem.number} whileHover={sem.is_active ? { y: -6 } : {}}>
                                    <Card
                                        onClick={() => handleSemesterClick(sem.number, sem.is_active)}
                                        className={`relative h-64 flex flex-col p-8 rounded-[2.5rem] border transition-all group overflow-hidden ${sem.is_active
                                            ? 'cursor-pointer bg-surface border-border/40 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5'
                                            : 'cursor-not-allowed bg-muted/5 border-border/20 opacity-60 grayscale-[0.8]'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-8 relative z-10">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${sem.is_active
                                                ? 'bg-primary/10 border-primary/20 text-primary group-hover:bg-primary group-hover:text-white'
                                                : 'bg-muted/50 border-border/50 text-muted-foreground'
                                                }`}>
                                                {sem.is_active ? <BookOpen className="w-7 h-7" /> : <Lock className="w-6 h-6 opacity-60" />}
                                            </div>

                                            {sem.is_active ? (
                                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                                    Available
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1 bg-muted/50 border border-border/50 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    Locked
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative z-10 mt-auto">
                                            <h3 className={`font-heading font-black text-3xl tracking-tight transition-colors ${sem.is_active ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                Sem {sem.number}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {sem.is_active ? 'View Modules →' : 'Opening Soon'}
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.section>

                {/* The Student Lounge - Quick Actions */}
                <motion.section variants={fadeUp} className="pt-12 border-t border-border/10">
                    <div className="flex flex-col gap-1 mb-8">
                        <h2 className="text-xl font-heading font-black tracking-tight uppercase opacity-40">The Student Lounge</h2>
                        <p className="text-sm text-muted-foreground font-medium italic">Everything else you need while studying.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* WhatsApp Card */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            className="p-8 rounded-[2.5rem] bg-surface/50 border border-border/40 backdrop-blur-sm relative overflow-hidden group hover:border-[#25D366]/40 transition-all cursor-pointer"
                            onClick={() => window.open(WHATSAPP_COMMUNITY_LINK, '_blank')}
                        >
                            <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                                <MessageCircle className="w-32 h-32 text-[#25D366]" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                                    <MessageCircle className="w-6 h-6 fill-current" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-foreground mb-1">Community</h4>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">Join 1000+ students for real-time updates and exam help.</p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#25D366] flex items-center gap-2">
                                    Follow Channel <ExternalLink className="w-3 h-3" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Talk to Admin Card */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            className="p-8 rounded-[2.5rem] bg-surface/50 border border-border/40 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition-all cursor-pointer"
                            onClick={() => router.push('/dashboard/requests')}
                        >
                            <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity -rotate-12">
                                <MessageSquare className="w-32 h-32 text-primary" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-foreground mb-1">Talk to Admin</h4>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">Request new materials, report bugs, or give feedback directly.</p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    Start Chat <Send className="w-3 h-3" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Share Love Card */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            className="p-8 rounded-[2.5rem] bg-surface/50 border border-border/40 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-all cursor-pointer"
                            onClick={() => setIsFeedbackOpen(true)}
                        >
                            <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-45">
                                <Heart className="w-32 h-32 text-amber-500" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                    <Heart className="w-6 h-6 fill-current" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-foreground mb-1">Share Love</h4>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">Enjoying the platform? Leave a review and help us grow.</p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                                    Give Feedback <Sparkles className="w-3 h-3" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Leaderboard Active Banner */}
                <motion.section variants={fadeUp} className="pt-6 pb-12">
                    <Link href="/dashboard/leaderboard">
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 relative overflow-hidden group hover:border-primary/40 transition-all cursor-pointer">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Trophy className="w-32 h-32 text-primary" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                                        <Trophy className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-xl font-heading font-black text-foreground">Study Champions</h4>
                                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Active Now</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium">See how you rank among your peers. Consistency is key! 🏆</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary group-hover:gap-4 transition-all">
                                    View Leaderboard <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.section>

            </motion.div>

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />
        </div>
    )
}
