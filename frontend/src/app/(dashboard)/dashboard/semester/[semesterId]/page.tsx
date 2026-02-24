"use client"

import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ChevronLeft, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
    visible: { transition: { staggerChildren: 0.05 } }
}

// Subject Mappings explicitly defined for MVP Phase 2
const subjectMap: Record<string, { slug: string, name: string, code: string }[]> = {
    "2": [
        { slug: "int306", name: "Internet and Web Designing", code: "INT306" },
        { slug: "phy110", name: "Engineering Physics", code: "PHY110" },
        { slug: "cse121", name: "Object Oriented Programming", code: "CSE121" },
        { slug: "cse101", name: "Computer Programming", code: "CSE101" },
        { slug: "mec136", name: "Engineering Graphics", code: "MEC136" },
        { slug: "cse320", name: "Software Engineering", code: "CSE320" },
        { slug: "pel121", name: "Communication Skills I", code: "PEL121" },
        { slug: "pel125", name: "Communication Skills II", code: "PEL125" },
        { slug: "pel130", name: "Communication Skills III", code: "PEL130" },
        { slug: "ece249", name: "Basic Electrical & Electronics", code: "ECE249" },
        { slug: "che110", name: "Environmental Sciences", code: "CHE110" },
        { slug: "mth166", name: "Mathematics", code: "MTH166" }
    ],
    "4": [
        { slug: "data-structures", name: "Data Structures", code: "CSE201" },
        { slug: "operating-systems", name: "Operating Systems", code: "CSE202" },
        { slug: "database-management", name: "Database Management", code: "CSE203" },
        { slug: "computer-networks", name: "Computer Networks", code: "CSE204" },
        { slug: "software-engineering", name: "Software Engineering", code: "CSE205" },
        { slug: "theory-of-computation", name: "Theory of Computation", code: "CSE206" }
    ]
}

export default function SemesterPage() {
    const router = useRouter()
    const params = useParams()
    const semesterId = params.semesterId as string

    // Strictly authorize only IDs 2 and 4
    const validSemesters = ["2", "4"]
    const isValid = validSemesters.includes(semesterId)
    const subjects = subjectMap[semesterId] || []

    useEffect(() => {
        if (!isValid) {
            router.replace('/dashboard')
        }
    }, [isValid, router])

    if (!isValid) return null

    const handleBack = () => {
        router.push('/dashboard')
    }

    const handleSubjectClick = (slug: string) => {
        router.push(`/dashboard/semester/${semesterId}/subject/${slug}`)
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

                <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {subjects.map((sub) => (
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
                                    <p className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase mt-0.5">{sub.code}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

            </motion.div>
        </div>
    )
}
