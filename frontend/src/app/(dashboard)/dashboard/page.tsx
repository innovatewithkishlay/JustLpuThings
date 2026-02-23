"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { BookOpen, Lock, Sparkles } from 'lucide-react'

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
    visible: { transition: { staggerChildren: 0.05 } }
}

// Static Phase 2 Baseline Configuration
const semesters = [
    { id: 1, label: 'Semester 1', active: false },
    { id: 2, label: 'Semester 2', active: true },
    { id: 3, label: 'Semester 3', active: false },
    { id: 4, label: 'Semester 4', active: true },
    { id: 5, label: 'Semester 5', active: false },
    { id: 6, label: 'Semester 6', active: false },
    { id: 7, label: 'Semester 7', active: false },
    { id: 8, label: 'Semester 8', active: false },
]

export default function DashboardPage() {
    const router = useRouter()

    const handleSemesterClick = (id: number, active: boolean) => {
        if (!active) return
        router.push(`/dashboard/semester/${id}`)
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-24 pt-10 page-container max-w-6xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-12">

                <motion.section variants={fadeUp}>
                    <div className="flex flex-col gap-2 mb-10 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight leading-tight flex items-center justify-center md:justify-start gap-4">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20"><Sparkles className="w-6 h-6" /></div>
                            Academic Progress
                        </h1>
                        <p className="text-muted-foreground font-medium text-base md:text-lg max-w-2xl ml-0 md:ml-14">
                            Select your active semester to access curated materials, subjective notes, and official syllabus distributions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {semesters.map((sem) => (
                            <motion.div key={sem.id} whileHover={sem.active ? { y: -6, scale: 1.02 } : {}}>
                                <Card
                                    onClick={() => handleSemesterClick(sem.id, sem.active)}
                                    className={`relative h-full flex flex-col p-6 rounded-[24px] border soft-shadow transition-all group overflow-hidden ${sem.active
                                            ? 'cursor-pointer bg-surface border-border/60 hover:border-primary/40 hover:shadow-primary/10'
                                            : 'cursor-not-allowed bg-muted/20 border-border/30 opacity-70 grayscale-[0.5]'
                                        }`}
                                >
                                    {sem.active && (
                                        <div className="absolute right-0 bottom-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mb-10 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />
                                    )}

                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors duration-500 ${sem.active
                                                ? 'bg-primary/10 border-primary/20 text-primary group-hover:bg-primary/20'
                                                : 'bg-muted border-border/50 text-muted-foreground'
                                            }`}>
                                            {sem.active ? <BookOpen className="w-7 h-7" /> : <Lock className="w-6 h-6 opacity-60" />}
                                        </div>

                                        {!sem.active && (
                                            <div className="px-3 py-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground soft-shadow">
                                                Coming Soon
                                            </div>
                                        )}
                                        {sem.active && (
                                            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500 soft-shadow">
                                                Active
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative z-10 mt-auto">
                                        <h3 className={`font-heading font-bold text-2xl transition-colors ${sem.active ? 'group-hover:text-primary text-foreground' : 'text-muted-foreground'}`}>
                                            {sem.label}
                                        </h3>
                                        {sem.active && (
                                            <p className="text-sm text-muted-foreground font-medium mt-2">
                                                Explore subjects and materials
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

            </motion.div>
        </div>
    )
}
