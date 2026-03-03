"use client"

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { ChevronLeft, FolderOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
    visible: { transition: { staggerChildren: 0.05 } }
}

interface Subject {
    id: string;
    name: string;
    slug: string;
    semester_number: number;
}

export default function SemesterPage() {
    const router = useRouter()
    const params = useParams()
    const semesterId = params.semesterId as string

    const { data: subjects = [], isLoading } = useQuery({
        queryKey: ["subjects", semesterId],
        queryFn: () => apiClient<Subject[]>(`/materials/subjects?semesterNumber=${semesterId}`)
    })

    const handleBack = () => {
        router.push('/dashboard')
    }

    const handleSubjectClick = (slug: string) => {
        router.push(`/dashboard/semester/${semesterId}/subject/${slug}`)
    }

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-24 page-container max-w-5xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-10">

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl hover:bg-muted">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-heading font-black tracking-tight">Semester {semesterId}</h1>
                            <p className="text-muted-foreground font-medium text-sm">Select a subject to view resources</p>
                        </div>
                    </div>
                </motion.div>

                {subjects.length === 0 ? (
                    <motion.div variants={fadeUp} className="text-center py-20 bg-muted/10 rounded-[32px] border border-dashed border-border/50">
                        <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-foreground mb-1">No Subjects Found</h3>
                        <p className="text-muted-foreground text-sm">New subjects will appear here once indexed by admin.</p>
                    </motion.div>
                ) : (
                    <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {subjects.map((sub: Subject) => (
                            <motion.div key={sub.slug} whileHover={{ y: -4, scale: 1.01 }}>
                                <Card
                                    onClick={() => handleSubjectClick(sub.slug)}
                                    className="cursor-pointer h-full flex items-center p-5 rounded-[20px] bg-surface border-border/60 hover:border-primary/40 soft-shadow hover:shadow-primary/10 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mb-6 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />

                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary mr-4 group-hover:bg-primary text-primary group-hover:text-primary-foreground transition-colors duration-300">
                                        <FolderOpen className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-heading font-bold text-base truncate group-hover:text-primary transition-colors">{sub.name}</h3>
                                        <p className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase mt-0.5 italic">/{sub.slug}</p>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

            </motion.div>
        </div>
    )
}
