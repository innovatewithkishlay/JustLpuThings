"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { AdminShell } from '@/components/app/AdminShell'
import { EmptyNote, PageHead, Tag } from '@/components/app/Notebook'

interface Feedback {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    content: string;
    rating: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export default function AdminFeedbackPage() {
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

    const { data: feedbacks = [], isLoading } = useQuery({
        queryKey: ["admin", "feedbacks", filter],
        queryFn: () => apiClient<Feedback[]>(`/admin/feedbacks${filter !== 'all' ? `?status=${filter}` : ''}`)
    })

    const moderationMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            return await apiClient(`/admin/feedbacks/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            })
        },
        onSuccess: (_, variables) => {
            toast.success(`Feedback ${variables.status} successfully`)
            queryClient.invalidateQueries({ queryKey: ["admin", "feedbacks"] })
        },
        onError: (err: any) => toast.error(err.message || "Failed to update feedback status")
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await apiClient(`/admin/feedbacks/${id}`, { method: 'DELETE' })
        },
        onSuccess: () => {
            toast.success("Feedback deleted")
            queryClient.invalidateQueries({ queryKey: ["admin", "feedbacks"] })
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete feedback")
    })

    const FILTERS = [
        { id: 'pending', label: 'Waiting' },
        { id: 'approved', label: 'On the home page' },
        { id: 'rejected', label: 'Rejected' },
        { id: 'all', label: 'All' },
    ] as const

    return (
        <AdminShell active="FEEDBACKS">
            <PageHead
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reviews' }]}
                title={<>Reviews</>}
                sub="Approved reviews appear on the home page under “We didn’t write these.” Nothing goes up without your OK."
            />

            <div role="tablist" aria-label="Filter reviews" className="flex gap-6 border-b border-border mb-8 overflow-x-auto no-scrollbar">
                {FILTERS.map((f) => {
                    const on = filter === f.id
                    return (
                        <button
                            key={f.id}
                            role="tab"
                            aria-selected={on}
                            onClick={() => setFilter(f.id)}
                            className={`relative shrink-0 pb-3 text-[15px] ${on ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {f.label}
                            {on && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-ink-red" />}
                        </button>
                    )
                })}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-muted/40 animate-pulse" />)}
                </div>
            ) : feedbacks.length === 0 ? (
                <EmptyNote title={filter === 'pending' ? 'All caught up' : 'Nothing here'}>
                    {filter === 'pending' ? 'No reviews are waiting for approval.' : 'No reviews match this filter.'}
                </EmptyNote>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedbacks.map((fb) => (fb && (
                        <li key={fb.id} className="app-card p-6 flex flex-col">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{fb.user_name}</p>
                                    <p className="font-mono text-[12px] text-muted-foreground truncate">{fb.user_email}</p>
                                </div>
                                <Tag tone={fb.status === 'approved' ? 'green' : fb.status === 'rejected' ? 'red' : 'plain'}>
                                    {fb.status === 'pending' ? 'waiting' : fb.status}
                                </Tag>
                            </div>

                            <blockquote className="mt-4 font-heading text-[19px] leading-snug tracking-[-0.01em]">
                                “{fb.content}”
                            </blockquote>

                            <div className="mt-auto pt-5 flex items-center justify-between gap-3 text-[13px]">
                                <span className="text-muted-foreground">
                                    <span className="text-amber-500 tracking-[0.1em]" aria-label={`${fb.rating} out of 5`}>{'★'.repeat(fb.rating)}<span className="opacity-25">{'★'.repeat(5 - fb.rating)}</span></span>
                                    <span className="ml-3 font-mono text-[11px]">{format(new Date(fb.created_at), 'd MMM yyyy')}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                    {fb.status !== 'approved' && (
                                        <button type="button" onClick={() => moderationMutation.mutate({ id: fb.id, status: 'approved' })} className="app-btn h-8 px-3 text-[13px]">
                                            Approve
                                        </button>
                                    )}
                                    {fb.status !== 'rejected' && (
                                        <button type="button" onClick={() => moderationMutation.mutate({ id: fb.id, status: 'rejected' })} className="app-btn-quiet h-8 px-3 text-[13px]">
                                            Reject
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate(fb.id)}
                                        className="h-8 px-2 text-[13px] text-muted-foreground hover:text-destructive"
                                    >
                                        Delete
                                    </button>
                                </span>
                            </div>
                        </li>
                    )))}
                </ul>
            )}
        </AdminShell>
    )
}
