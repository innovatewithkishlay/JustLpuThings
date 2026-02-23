"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ChevronLeft, FileIcon, SearchX, FileText, MonitorPlay, FileImage, LayoutGrid, Clock, ArrowRight, BookOpenText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

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
    description: string
    subjectCode: string
    category: string
    unit: string
    youtube_url?: string
    has_file: boolean
    created_at: string
    updated_at: string
}

export default function SubjectMaterialsPage() {
    const router = useRouter()
    const params = useParams()

    const semesterId = params.semesterId as string
    const subjectSlug = params.subjectSlug as string
    const subjectName = formatSlug(subjectSlug)

    const [activeTab, setActiveTab] = useState('theory') // 'theory', 'ca', 'midterm', 'pyqs'
    const [activeUnit, setActiveUnit] = useState<string>('all') // 'all' or '1', '2', etc

    const { data: materials = [], isLoading, isError } = useQuery({
        queryKey: ["materials", semesterId, subjectSlug],
        queryFn: () => apiClient<Material[]>(`/materials?semester=${semesterId}&subject=${subjectSlug}`),
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    })

    const handleBack = () => router.push(`/dashboard/semester/${semesterId}`)

    // Filter logic
    const filteredByCategory = materials.filter(m => {
        if (activeTab === 'theory') return m.category === 'notes' || m.category === 'ppt' || m.category === 'syllabus'
        return m.category === activeTab
    })

    const displayedMaterials = filteredByCategory.filter(m => {
        if (activeTab !== 'theory') return true;
        if (activeUnit === 'all') return true;
        return m.unit === activeUnit;
    })

    // Sub-tab definitions
    const TABS = [
        { id: 'theory', label: 'Lectures & Notes', icon: BookOpenText },
        { id: 'ca', label: 'CA PYQs', icon: Clock },
        { id: 'midterm', label: 'Mid-Term PYQs', icon: LayoutGrid },
        { id: 'pyqs', label: 'End-Term PYQs', icon: FileImage }
    ]

    const UNIT_TABS = ['all', '1', '2', '3', '4', '5', '6']

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-24 pt-8 page-container max-w-5xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">

                <motion.div variants={fadeUp} className="flex flex-col border-b border-border/50 pb-6">
                    <div className="flex items-center gap-4 mb-3">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl hover:bg-muted">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Link href="/dashboard" className="text-xs font-mono font-bold hover:text-primary transition-colors tracking-wider uppercase text-muted-foreground bg-muted hover:bg-primary/10 px-2 py-0.5 rounded-md">Dashboard</Link>
                                <span className="text-muted-foreground text-xs">/</span>
                                <Link href={`/dashboard/semester/${semesterId}`} className="text-xs font-mono font-bold hover:text-primary transition-colors tracking-wider uppercase text-muted-foreground bg-muted hover:bg-primary/10 px-2 py-0.5 rounded-md">Sem {semesterId}</Link>
                                <span className="text-muted-foreground text-xs">/</span>
                                <span className="text-xs font-mono font-bold tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">{subjectName}</span>
                            </div>
                            <h1 className="text-3xl font-heading font-black tracking-tight">{subjectName} Workspace</h1>
                        </div>
                    </div>
                </motion.div>

                {/* Primary Tabs */}
                <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setActiveUnit('all'); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 soft-shadow
                                ${activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground scale-[1.02] border-transparent shadow-primary/20'
                                    : 'bg-surface border-border/50 text-muted-foreground hover:bg-muted/80'}`
                            }
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* Conditional Secondary Tabs (Units) */}
                <AnimatePresence>
                    {activeTab === 'theory' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-wrap gap-2 bg-muted/40 p-2 rounded-2xl overflow-hidden"
                        >
                            {UNIT_TABS.map(unit => (
                                <button
                                    key={unit}
                                    onClick={() => setActiveUnit(unit)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300
                                        ${activeUnit === unit
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`
                                    }
                                >
                                    {unit === 'all' ? 'Overview' : `Unit ${unit}`}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

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
                        ) : displayedMaterials.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/60 rounded-3xl bg-surface/50">
                                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-5 border border-border text-muted-foreground">
                                    <SearchX className="w-8 h-8 opacity-50" />
                                </div>
                                <h3 className="font-heading font-bold text-lg mb-1 text-foreground">No data available</h3>
                                <p className="text-muted-foreground font-medium text-sm max-w-[250px]">The pipeline is currently empty for this specific section.</p>
                            </motion.div>
                        ) : (
                            <motion.div key="list" variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {displayedMaterials.map((mat) => (
                                    <motion.div key={mat.id} variants={fadeUp} whileHover={{ y: -4, scale: 1.01 }}>
                                        <Card
                                            onClick={() => mat.has_file ? router.push(`/viewer/${mat.id}`) : mat.youtube_url ? window.open(mat.youtube_url, '_blank') : null}
                                            className={`h-full flex flex-col p-5 rounded-[24px] bg-surface border-border/60 hover:border-primary/40 soft-shadow hover:shadow-primary/10 transition-all group relative overflow-hidden ${mat.has_file || mat.youtube_url ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />

                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 transition-colors duration-300
                                                    ${mat.category === 'notes' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500/20' :
                                                        mat.category === 'ppt' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500 group-hover:bg-blue-500/20' :
                                                            mat.category === 'pyqs' || mat.category === 'ca' || mat.category === 'midterm' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 group-hover:bg-amber-500/20' :
                                                                'bg-primary/10 border-primary/20 text-primary group-hover:bg-primary/20'}`}>
                                                    {mat.category === 'notes' ? <FileText className="w-5 h-5" /> :
                                                        mat.category === 'ppt' ? <MonitorPlay className="w-5 h-5" /> :
                                                            mat.category === 'pyqs' || mat.category === 'ca' || mat.category === 'midterm' ? <FileImage className="w-5 h-5" /> :
                                                                <FileIcon className="w-5 h-5" />}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {mat.unit && activeTab === 'theory' && (
                                                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                            Unit {mat.unit}
                                                        </span>
                                                    )}
                                                    {(mat.category === 'ca' || mat.category === 'midterm') && (
                                                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                            {mat.category === 'ca' ? 'CA PQ' : 'MT PQ'}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-full border border-border">
                                                        {new Date(mat.updated_at || mat.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="font-heading font-bold text-[17px] mb-2 group-hover:text-primary transition-colors leading-tight line-clamp-2">{mat.title}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                                                    {mat.description}
                                                </p>
                                            </div>

                                            <div className="mt-5 pt-5 border-t border-border/40 flex flex-col gap-2 mt-auto">
                                                {mat.youtube_url && (
                                                    <a
                                                        href={mat.youtube_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="group/btn flex items-center justify-between bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2.5 rounded-xl border border-red-500/20 hover:border-red-500 transition-all duration-300 soft-shadow hover:shadow-red-500/20"
                                                    >
                                                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Watch Video Lecture</span>
                                                        <MonitorPlay className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                                    </a>
                                                )}

                                                {mat.has_file && (
                                                    <div className="flex justify-between items-center px-4 py-2.5 bg-primary/5 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl border border-primary/20 hover:border-primary transition-all duration-300 soft-shadow hover:shadow-primary/20 group/read">
                                                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider">{mat.category === 'notes' ? 'Read Document' : mat.category === 'ppt' ? 'View Slides' : 'Open Document'}</span>
                                                        <ArrowRight className="w-4 h-4 transition-transform group-hover/read:-rotate-45" />
                                                    </div>
                                                )}
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
