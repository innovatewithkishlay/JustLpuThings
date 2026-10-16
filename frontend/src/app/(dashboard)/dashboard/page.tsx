"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Lock } from 'lucide-react'
import { WHATSAPP_COMMUNITY_LINK } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { FeedbackModal } from '@/components/modals/FeedbackModal'
import { useState } from 'react'
import { Kicker, PageHead, SectionHead } from '@/components/app/Notebook'

interface Semester {
    number: number;
    is_active: boolean;
}

interface MathSubject {
    id: string;
    name: string;
    slug: string;
    semester_number: number;
}

export default function DashboardPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

    const { data: semesters = [], isLoading } = useQuery({
        queryKey: ["semesters"],
        queryFn: () => apiClient<Semester[]>('/materials/semesters').then(res => res || [])
    })

    const { data: mathSpecial = [], isLoading: isMathLoading } = useQuery({
        queryKey: ["math-special"],
        queryFn: () => apiClient<MathSubject[]>('/materials/subjects/math-special').then(res => res || [])
    })

    const handleSemesterClick = (id: number, active: boolean) => {
        if (!active) return
        router.push(`/dashboard/semester/${id}`)
    }

    const handleSubjectClick = (semesterId: number, subjectSlug: string) => {
        router.push(`/dashboard/semester/${semesterId}/subject/${subjectSlug}`)
    }

    const firstName = (user?.name || user?.email?.split('@')[0] || 'there').split(' ')[0]
    const openCount = semesters.filter((s: Semester) => s.is_active).length

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-28 page-container max-w-6xl mx-auto">
            <PageHead
                title={<>Hi {firstName}. <em className="text-muted-foreground">Which semester?</em></>}
                sub="Pick your semester, then your subject. Notes, PYQs, CA and mid-term papers are all inside."
            />

            {/* Semesters */}
            <section aria-labelledby="sem-heading">
                <div className="flex items-end justify-between mb-5">
                    <div>
                        <Kicker n="01" className="mb-2">Semesters</Kicker>
                        <h2 id="sem-heading" className="sr-only">Semesters</h2>
                    </div>
                    {!isLoading && <p className="font-mono text-[12px] text-muted-foreground">{openCount} of {semesters.length} open</p>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-36 rounded-xl bg-muted/60 animate-pulse" />
                        ))
                    ) : (
                        semesters.map((sem: Semester) => (
                            <button
                                key={sem.number}
                                type="button"
                                onClick={() => handleSemesterClick(sem.number, sem.is_active)}
                                disabled={!sem.is_active}
                                aria-label={`Semester ${sem.number}${sem.is_active ? '' : ' (opening soon)'}`}
                                className={`group relative h-36 text-left rounded-xl p-5 flex flex-col justify-between transition-all ${sem.is_active
                                    ? 'app-card hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--ink-red)] hover:border-foreground/70 focus-visible:outline-2 focus-visible:outline-ring'
                                    : 'border border-dashed border-border text-muted-foreground cursor-not-allowed'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Semester</span>
                                    {sem.is_active
                                        ? <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                        : <Lock className="w-3.5 h-3.5 opacity-50" />}
                                </div>
                                <div className="flex items-end justify-between">
                                    <span className={`font-heading text-[56px] leading-[0.8] tracking-[-0.04em] ${sem.is_active ? '' : 'opacity-40'}`}>{sem.number}</span>
                                    <span className={`text-[12px] ${sem.is_active ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                                        {sem.is_active ? 'open' : 'opening soon'}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </section>

            {/* MTH special collection */}
            {(mathSpecial.length > 0 || isMathLoading) && (
                <section className="mt-16" aria-labelledby="mth-heading">
                    <Kicker n="02" className="mb-2">Special collection</Kicker>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-5">
                            <h2 id="mth-heading" className="font-heading text-[32px] leading-[1.05] tracking-[-0.02em]">
                                Maths, <em>every semester.</em>
                            </h2>
                            <p className="mt-3 text-muted-foreground leading-relaxed">
                                The subject most people get stuck on, so it gets its own shelf: notes, PYQs and the tricks that save time in the exam.
                            </p>
                            <div className="mt-6 rounded-lg overflow-hidden border border-border bg-black">
                                <img src="/assets/math.png" alt="MTH special collection" className="w-full h-auto max-h-44 object-contain" />
                            </div>
                        </div>

                        <ul className="lg:col-span-7 border-t border-foreground/80">
                            {isMathLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <li key={i} className="h-16 border-b border-border animate-pulse bg-muted/40" />
                                ))
                            ) : (
                                mathSpecial.map((sub: MathSubject) => (
                                    <li key={sub.id} className="border-b border-border">
                                        <button
                                            type="button"
                                            onClick={() => handleSubjectClick(sub.semester_number, sub.slug)}
                                            className="app-row-link group w-full grid grid-cols-[90px_1fr_auto] items-center gap-4 py-4 px-2 text-left"
                                        >
                                            <span className="font-mono text-[12px] text-ink-red uppercase">{sub.slug}</span>
                                            <span>
                                                <span className="block font-heading text-[21px] leading-tight">{sub.name}</span>
                                                <span className="block text-[12px] text-muted-foreground mt-0.5">Semester {sub.semester_number} · notes, PYQs, tricks</span>
                                            </span>
                                            <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </section>
            )}

            {/* Everything else */}
            <section className="mt-16">
                <SectionHead n={mathSpecial.length > 0 || isMathLoading ? '03' : '02'} title="While you study" />
                <ul className="border-t border-foreground/80">
                    {[
                        {
                            title: 'Study champions',
                            body: 'See where you stand. Consistency beats cramming.',
                            cta: 'Open leaderboard',
                            href: '/dashboard/leaderboard',
                        },
                        {
                            title: 'Ask the admin',
                            body: 'Missing notes for a subject? Found a broken PDF? Tell us here.',
                            cta: 'Send a request',
                            href: '/dashboard/requests',
                        },
                        {
                            title: 'WhatsApp channel',
                            body: 'New uploads and exam-week updates, straight to your phone.',
                            cta: 'Follow channel',
                            external: WHATSAPP_COMMUNITY_LINK,
                        },
                        {
                            title: 'Leave a review',
                            body: 'If the notes helped, a line from you helps the next batch find us.',
                            cta: 'Write a review',
                            onClick: () => setIsFeedbackOpen(true),
                        },
                    ].map((row) => {
                        const inner = (
                            <>
                                <span className="font-heading text-[21px] leading-tight">{row.title}</span>
                                <span className="text-[14px] text-muted-foreground">{row.body}</span>
                                <span className="text-[13px] font-semibold flex items-center gap-1.5 justify-self-end whitespace-nowrap">
                                    {row.cta} {row.external ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                </span>
                            </>
                        )
                        const cls = 'app-row-link w-full grid grid-cols-1 md:grid-cols-[220px_1fr_auto] items-center gap-x-6 gap-y-1 py-5 px-2 text-left'
                        return (
                            <li key={row.title} className="border-b border-border">
                                {row.href ? (
                                    <Link href={row.href} className={cls}>{inner}</Link>
                                ) : row.external ? (
                                    <a href={row.external} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                                ) : (
                                    <button type="button" onClick={row.onClick} className={cls}>{inner}</button>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </section>

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />
        </div>
    )
}
