"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ChevronLeft, FileIcon, SearchX, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Skeleton } from '@/components/ui/skeleton'

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const stagger = {
    visible: { transition: { staggerChildren: 0.05 } }
}

const formatSlug = (slug: string) => {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

interface Material {
    id: string
    title: string
    slug: string
    description: string
    subjectCode: string
    created_at: string
    updated_at: string
}

export default function MaterialListPage() {
    const router = useRouter()
    const params = useParams()

    const semesterId = params.semesterId as string
    const subjectSlug = params.subjectSlug as string
    const materialType = params.materialType as string

    const { data: materials = [], isLoading, isError } = useQuery({
        queryKey: ["materials", semesterId, subjectSlug, materialType],
        queryFn: () => apiClient<Material[]>(`/materials?semester=${semesterId}&subject=${subjectSlug}&type=${materialType}`),
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1
    })

    const handleBack = () => {
        router.push(`/dashboard/semester/${semesterId}/subject/${subjectSlug}`)
    }

    const typeLabel = materialType === 'ppt' ? 'Presentations' : materialType === 'notes' ? 'Subjective Notes' : 'Syllabus'

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-24 page-container max-w-5xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-10">

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl hover:bg-muted">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Sem {semesterId}</span>
                                <span className="text-xs font-mono font-bold tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{formatSlug(subjectSlug)}</span>
                            </div>
                            <h1 className="text-2xl font-heading font-black tracking-tight">{typeLabel}</h1>
                        </div>
                    </div>
                </motion.div>

                <div className="min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-28 w-full rounded-2xl bg-surface border border-border/50" />
                                ))}
                            </motion.div>
                        ) : isError ? (
                            <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20 text-red-500">
                                    <FileIcon className="w-8 h-8" />
                                </div>
                                <h3 className="font-heading font-bold text-xl mb-1 text-foreground">Failed to load materials</h3>
                                <p className="text-muted-foreground font-medium text-sm">Please try again later or check your connection.</p>
                            </motion.div>
                        ) : materials.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/60 rounded-3xl bg-surface/50">
                                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-5 border border-border text-muted-foreground">
                                    <SearchX className="w-8 h-8 opacity-50" />
                                </div>
                                <h3 className="font-heading font-bold text-lg mb-1 text-foreground">No materials uploaded yet</h3>
                                <p className="text-muted-foreground font-medium text-sm max-w-[250px]">The pipeline is currently empty for this specific section.</p>
                            </motion.div>
                        ) : (
                            <motion.div key="list" variants={stagger} initial="hidden" animate="visible" className="space-y-4">
                                {materials.map((mat) => (
                                    <motion.div key={mat.id} variants={fadeUp} whileHover={{ y: -2, scale: 1.005 }}>
                                        <Card
                                            onClick={() => router.push(`/viewer/${mat.slug}`)}
                                            className="cursor-pointer flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-6 rounded-[24px] bg-surface border-border/60 hover:border-primary/40 soft-shadow hover:shadow-primary/10 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />

                                            <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary flex-shrink-0 group-hover:bg-primary/10 transition-colors duration-300">
                                                <FileIcon className="w-6 h-6" />
                                            </div>

                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-2">
                                                    <h3 className="font-heading font-bold text-[17px] truncate group-hover:text-primary transition-colors">{mat.title}</h3>
                                                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground whitespace-nowrap">
                                                        Updated {new Date(mat.updated_at || mat.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                                                    {mat.description}
                                                </p>
                                            </div>

                                            <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors duration-300">
                                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    )
}
