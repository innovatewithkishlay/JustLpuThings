"use client"

import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ChevronLeft, FileText, MonitorPlay, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
    visible: { transition: { staggerChildren: 0.05 } }
}

const formatSubjectName = (slug: string) => {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export default function SubjectMaterialTypePage() {
    const router = useRouter()
    const params = useParams()

    const semesterId = params.semesterId as string
    const subjectSlug = params.subjectSlug as string
    const subjectName = formatSubjectName(subjectSlug)

    const handleBack = () => {
        router.push(`/dashboard/semester/${semesterId}`)
    }

    const categories = [
        { id: 'notes', label: 'Subjective Notes', description: 'Curated handwritten & digital notes', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10 hover:bg-emerald-500' },
        { id: 'ppt', label: 'Presentations (PPT)', description: 'Official slides & lecture materials', icon: MonitorPlay, color: 'text-blue-500', bg: 'bg-blue-500/10 hover:bg-blue-500' },
        { id: 'syllabus', label: 'Course Syllabus', description: 'Structure, blueprints & weightage', icon: ScrollText, color: 'text-indigo-500', bg: 'bg-indigo-500/10 hover:bg-indigo-500' }
    ]

    const handleCategoryClick = (categoryId: string) => {
        router.push(`/dashboard/semester/${semesterId}/subject/${subjectSlug}/type/${categoryId}`)
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-24 pt-8 page-container max-w-4xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-10">

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl hover:bg-muted">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Semester {semesterId}</span>
                            </div>
                            <h1 className="text-2xl font-heading font-black tracking-tight">{subjectName}</h1>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                        <motion.div key={cat.id} whileHover={{ y: -6, scale: 1.02 }}>
                            <Card
                                onClick={() => handleCategoryClick(cat.id)}
                                className="cursor-pointer h-full flex flex-col items-center text-center p-8 rounded-[24px] bg-surface border-border/60 hover:border-primary/40 soft-shadow hover:shadow-primary/10 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500 text-primary bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground border border-primary/20 soft-shadow`}>
                                    <cat.icon className="w-8 h-8" />
                                </div>

                                <h3 className="font-heading font-bold text-xl mb-2 group-hover:text-primary transition-colors">{cat.label}</h3>
                                <p className="text-sm text-muted-foreground font-medium">{cat.description}</p>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

            </motion.div>
        </div>
    )
}
