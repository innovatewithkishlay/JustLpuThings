"use client"

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowRight, Play } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { EmptyNote, PageHead, Tag } from '@/components/app/Notebook'

// Course codes (cse316) read as codes; anything else as Title Case
const formatSlug = (slug: string) => {
    if (/^[a-z]{2,4}\d{3}[a-z]?$/i.test(slug)) return slug.toUpperCase()
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

interface Material {
    id: string
    title: string
    slug: string
    description: string
    subjectCode: string
    category: string
    unit: string
    youtube_url?: string
    has_file: boolean
    created_at: string
    updated_at: string
}

const CATEGORY_LABEL: Record<string, string> = {
    notes: 'Notes',
    ppt: 'Slides',
    syllabus: 'Syllabus',
    ca: 'CA',
    midterm: 'Mid-term',
    pyqs: 'End-term',
}

export default function SubjectMaterialsPage() {
    const router = useRouter()
    const params = useParams()

    const semesterId = params.semesterId as string
    const subjectSlug = params.subjectSlug as string
    const subjectName = formatSlug(subjectSlug)

    const [activeTab, setActiveTab] = useState('theory') // 'theory', 'ca', 'midterm', 'pyqs'
    const [activeUnit, setActiveUnit] = useState<string>('overview') // 'overview' or '1'-'6'

    const { data: materials = [], isLoading, isError } = useQuery({
        queryKey: ["materials", semesterId, subjectSlug],
        queryFn: () => apiClient<Material[]>(`/materials?semester=${semesterId}&subject=${subjectSlug}`),
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    })

    // Filter logic
    const filteredByCategory = materials.filter(m => {
        if (activeTab === 'theory') return m.category === 'notes' || m.category === 'ppt' || m.category === 'syllabus'
        return m.category === activeTab
    })

    const displayedMaterials = filteredByCategory.filter(m => {
        if (activeTab !== 'theory') return true;
        if (activeUnit === 'overview') return !m.unit || m.unit === 'overview';
        return m.unit === activeUnit;
    })

    const countFor = (tab: string) => materials.filter(m =>
        tab === 'theory' ? (m.category === 'notes' || m.category === 'ppt' || m.category === 'syllabus') : m.category === tab
    ).length

    const TABS = [
        { id: 'theory', label: 'Lectures & notes' },
        { id: 'ca', label: 'CA papers' },
        { id: 'midterm', label: 'Mid-term papers' },
        { id: 'pyqs', label: 'End-term PYQs' }
    ]

    const UNIT_TABS = ['overview', '1', '2', '3', '4', '5', '6']

    const openMaterial = (mat: Material) => {
        if (mat.has_file) router.push(`/viewer/${mat.slug}`)
        else if (mat.youtube_url) window.open(mat.youtube_url, '_blank')
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-28 page-container max-w-5xl mx-auto">
            <PageHead
                back={`/dashboard/semester/${semesterId}`}
                crumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: `Semester ${semesterId}`, href: `/dashboard/semester/${semesterId}` },
                    { label: subjectName },
                ]}
                title={<>{subjectName}</>}
                sub={isLoading ? 'Loading materials…' : `${materials.length} item${materials.length === 1 ? '' : 's'} so far: notes by unit, and every paper we could find.`}
            />

            {/* Section tabs */}
            <div role="tablist" aria-label="Material type" className="flex gap-6 sm:gap-8 border-b border-border overflow-x-auto no-scrollbar">
                {TABS.map(tab => {
                    const on = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={on}
                            onClick={() => { setActiveTab(tab.id); setActiveUnit('overview'); }}
                            className={`relative shrink-0 pb-3 text-[15px] transition-colors ${on ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab.label}
                            {!isLoading && <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">{countFor(tab.id)}</span>}
                            {on && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-ink-red" />}
                        </button>
                    )
                })}
            </div>

            {/* Units */}
            {activeTab === 'theory' && (
                <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Unit">
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground mr-2">Unit</span>
                    {UNIT_TABS.map(unit => {
                        const on = activeUnit === unit
                        return (
                            <button
                                key={unit}
                                onClick={() => setActiveUnit(unit)}
                                aria-pressed={on}
                                className={`h-8 min-w-8 px-3 rounded-full text-[13px] border transition-colors ${on
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'}`}
                            >
                                {unit === 'overview' ? 'Overview' : unit}
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="mt-8 min-h-[300px]">
                {isLoading ? (
                    <ul className="border-t border-foreground/80">
                        {[1, 2, 3, 4].map(i => (
                            <li key={i} className="h-24 border-b border-border animate-pulse bg-muted/30" />
                        ))}
                    </ul>
                ) : isError ? (
                    <EmptyNote title="Couldn’t load this subject">Check your connection and refresh the page.</EmptyNote>
                ) : displayedMaterials.length === 0 ? (
                    <EmptyNote title={activeTab === 'theory' && activeUnit === 'overview' && filteredByCategory.length > 0 ? 'Choose a unit' : 'Nothing in this section yet'}>
                        {activeTab === 'theory' && activeUnit !== 'overview'
                            ? `Unit ${activeUnit} hasn’t been uploaded. Try another unit, or ask the admin for it.`
                            : activeTab === 'theory' && filteredByCategory.length > 0
                                ? 'Notes for this subject are filed by unit. Pick a unit above.'
                                : 'This section is still empty. Ask the admin if you need it.'}
                    </EmptyNote>
                ) : (
                    <ul className="border-t border-foreground/80">
                        {displayedMaterials.map((mat) => {
                            const clickable = mat.has_file || !!mat.youtube_url
                            return (
                                <li key={mat.id} className="border-b border-border">
                                    <div
                                        role={clickable ? 'button' : undefined}
                                        tabIndex={clickable ? 0 : undefined}
                                        onClick={() => openMaterial(mat)}
                                        onKeyDown={(e) => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openMaterial(mat) } }}
                                        className={`group grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-8 gap-y-3 py-5 px-2 ${clickable ? 'app-row-link cursor-pointer' : ''}`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <Tag tone={mat.category === 'notes' ? 'blue' : mat.category === 'ppt' || mat.category === 'syllabus' ? 'plain' : 'red'}>
                                                    {CATEGORY_LABEL[mat.category] || mat.category}
                                                </Tag>
                                                {mat.unit && mat.unit !== 'overview' && activeTab === 'theory' && <Tag>Unit {mat.unit}</Tag>}
                                                <span className="font-mono text-[11px] text-muted-foreground">
                                                    {new Date(mat.updated_at || mat.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <h3 className="font-heading text-[22px] leading-snug tracking-[-0.01em]">{mat.title}</h3>
                                            {mat.description && (
                                                <p className="mt-1 text-[14px] text-muted-foreground line-clamp-2 leading-relaxed">{mat.description}</p>
                                            )}
                                        </div>

                                        <div className="flex sm:flex-col items-start sm:items-end justify-center gap-2">
                                            {mat.has_file && (
                                                <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold whitespace-nowrap">
                                                    {mat.category === 'ppt' ? 'View slides' : 'Read'} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                                </span>
                                            )}
                                            {mat.youtube_url && (
                                                <a
                                                    href={mat.youtube_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-red hover:underline underline-offset-4 whitespace-nowrap"
                                                >
                                                    <Play className="w-3.5 h-3.5 fill-current" /> Watch lecture
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}
