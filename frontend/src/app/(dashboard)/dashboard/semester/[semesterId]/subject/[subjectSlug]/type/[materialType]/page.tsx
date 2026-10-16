"use client"

import { useRouter, useParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { EmptyNote, PageHead } from '@/components/app/Notebook'

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

    const typeLabel = materialType === 'ppt' ? 'Presentations' : materialType === 'notes' ? 'Subjective Notes' : 'Syllabus'

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-28 page-container max-w-5xl mx-auto">
            <PageHead
                back={`/dashboard/semester/${semesterId}/subject/${subjectSlug}`}
                crumbs={[
                    { label: `Semester ${semesterId}`, href: `/dashboard/semester/${semesterId}` },
                    { label: formatSlug(subjectSlug), href: `/dashboard/semester/${semesterId}/subject/${subjectSlug}` },
                    { label: typeLabel },
                ]}
                title={typeLabel}
            />

            {isLoading ? (
                <ul className="border-t border-foreground/80">
                    {[1, 2, 3].map(i => <li key={i} className="h-24 border-b border-border animate-pulse bg-muted/30" />)}
                </ul>
            ) : isError ? (
                <EmptyNote title="Couldn’t load these materials">Check your connection and refresh the page.</EmptyNote>
            ) : materials.length === 0 ? (
                <EmptyNote title="Nothing uploaded yet">This section is still empty.</EmptyNote>
            ) : (
                <ul className="border-t border-foreground/80">
                    {materials.map((mat) => (
                        <li key={mat.id} className="border-b border-border">
                            <button
                                type="button"
                                onClick={() => router.push(`/viewer/${mat.slug}`)}
                                className="app-row-link group w-full grid grid-cols-[1fr_auto] items-center gap-6 py-5 px-2 text-left"
                            >
                                <span className="min-w-0">
                                    <span className="block font-mono text-[11px] text-muted-foreground mb-1.5">
                                        Updated {new Date(mat.updated_at || mat.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className="block font-heading text-[22px] leading-snug truncate">{mat.title}</span>
                                    {mat.description && <span className="block mt-1 text-[14px] text-muted-foreground line-clamp-2">{mat.description}</span>}
                                </span>
                                <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
