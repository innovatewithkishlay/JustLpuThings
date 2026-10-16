"use client"

import { useParams, useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { EmptyNote, PageHead } from '@/components/app/Notebook'

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

    const handleSubjectClick = (slug: string) => {
        router.push(`/dashboard/semester/${semesterId}/subject/${slug}`)
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-28 page-container max-w-5xl mx-auto">
            <PageHead
                back="/dashboard"
                crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: `Semester ${semesterId}` }]}
                title={<>Semester {semesterId}</>}
                sub={isLoading ? 'Loading subjects…' : `${subjects.length} subject${subjects.length === 1 ? '' : 's'}. Pick one to see its notes and papers.`}
            />

            {isLoading ? (
                <ul className="border-t border-foreground/80">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <li key={i} className="h-[72px] border-b border-border animate-pulse bg-muted/30" />
                    ))}
                </ul>
            ) : subjects.length === 0 ? (
                <EmptyNote title="Nothing here yet">New subjects show up here as soon as the admin adds them.</EmptyNote>
            ) : (
                <ol className="border-t border-foreground/80">
                    {subjects.map((sub: Subject, i: number) => (
                        <li key={sub.slug} className="border-b border-border">
                            <button
                                type="button"
                                onClick={() => handleSubjectClick(sub.slug)}
                                className="app-row-link group w-full grid grid-cols-[36px_110px_1fr_auto] sm:grid-cols-[48px_140px_1fr_auto] items-center gap-3 py-5 px-2 text-left"
                            >
                                <span className="font-mono text-[12px] text-muted-foreground tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                                <span className="font-mono text-[13px] text-ink-red uppercase">{sub.name.toLowerCase() === sub.slug.toLowerCase() ? '' : sub.slug}</span>
                                <span className="font-heading text-[22px] leading-tight truncate">{sub.name}</span>
                                <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </button>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    )
}
