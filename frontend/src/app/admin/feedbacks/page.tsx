"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Heart,
    Check,
    X,
    Trash2,
    MessageSquare,
    Clock,
    Star,
    ShieldCheck,
    Filter,
    Loader2,
    ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'

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

const Badge = ({ children, variant = "pending" }: { children: React.ReactNode, variant?: string }) => {
    const variants: any = {
        pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    }
    return (
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${variants[variant]}`}>
            {children}
        </span>
    )
}

export default function AdminFeedbackPage() {
    const router = useRouter()
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

    return (
        <div className="min-h-screen bg-[#FBFCFE] dark:bg-[#06080C] p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <button
                            onClick={() => router.push('/admin')}
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-heading font-black tracking-tight italic flex items-center gap-4">
                            Feedback Moderation <Heart className="w-8 h-8 text-primary fill-current" />
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm opacity-80">
                            Review and approve student testimonials before they appear on the landing page.
                        </p>
                    </div>

                    <div className="flex bg-surface border border-border/40 rounded-2xl p-1 gap-1">
                        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feedback List */}
                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-48 rounded-[32px] bg-muted/20 animate-pulse" />
                        ))
                    ) : feedbacks.length === 0 ? (
                        <Card className="border-dashed border-2 border-border/50 bg-transparent rounded-[32px] p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center mb-6">
                                <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">No Feedbacks Found</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">
                                {filter === 'pending' ? 'Hooray! No pending reviews to moderate.' : 'No items match your current filter.'}
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            <AnimatePresence>
                                {feedbacks.map((fb) => (fb && (
                                    <motion.div
                                        key={fb.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                    >
                                        <Card className="group border-none shadow-premium bg-surface/50 backdrop-blur-xl rounded-[32px] overflow-hidden hover:ring-1 ring-primary/20 transition-all p-8">
                                            <div className="flex flex-col md:flex-row gap-8">
                                                {/* Left: User Info & Score */}
                                                <div className="md:w-64 space-y-4 shrink-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                            <Check className="w-5 h-5" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm font-black tracking-tight truncate">{fb.user_name}</p>
                                                            <p className="text-[10px] text-muted-foreground font-bold truncate">{fb.user_email}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-4 h-4 ${i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
                                                            />
                                                        ))}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Badge variant={fb.status}>{fb.status}</Badge>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground opacity-60">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {format(new Date(fb.created_at), 'MMM dd, yyyy')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Center: Content */}
                                                <div className="flex-1">
                                                    <div className="relative">
                                                        <div className="absolute -left-4 -top-4 text-primary/10 text-6xl font-serif">“</div>
                                                        <p className="text-base font-medium text-foreground/80 leading-relaxed relative z-10 italic">
                                                            {fb.content}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: Actions */}
                                                <div className="flex md:flex-col justify-end gap-3">
                                                    {fb.status !== 'approved' && (
                                                        <Button
                                                            size="icon"
                                                            onClick={() => moderationMutation.mutate({ id: fb.id, status: 'approved' })}
                                                            className="h-12 w-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                                        >
                                                            <Check className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                    {fb.status !== 'rejected' && (
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            onClick={() => moderationMutation.mutate({ id: fb.id, status: 'rejected' })}
                                                            className="h-12 w-12 rounded-2xl border-border/40 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => deleteMutation.mutate(fb.id)}
                                                        className="h-12 w-12 rounded-2xl hover:bg-muted text-muted-foreground hover:text-rose-500"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
