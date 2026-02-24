'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Inbox, Loader2, CheckCircle2, Clock, Send,
    User, MessageSquare, Megaphone, AlertTriangle, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface AdminMessage {
    id: string
    content: string
    status: 'open' | 'resolved'
    admin_reply: string | null
    replied_at: string | null
    created_at: string
    user_name: string
    user_email: string
    user_id: string
}

interface AdminNotification {
    id: string
    title: string
    body: string
    type: string
    created_at: string
    target_user_name: string | null
    target_user_email: string | null
}

function MessageCard({ msg, onReply }: { msg: AdminMessage; onReply: (id: string, reply: string) => void }) {
    const [reply, setReply] = useState('')
    const [expanded, setExpanded] = useState(false)

    const handleReply = () => {
        if (!reply.trim()) return
        onReply(msg.id, reply.trim())
        setReply('')
        setExpanded(false)
    }

    return (
        <motion.div
            layout
            className={`border border-border/40 rounded-2xl overflow-hidden ${msg.status === 'resolved' ? 'bg-muted/10' : 'bg-surface'}`}
        >
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{msg.user_name}</p>
                            <p className="text-[10px] text-muted-foreground/60">{msg.user_email}</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${msg.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                        {msg.status === 'resolved'
                            ? <><CheckCircle2 className="w-3 h-3" /> Resolved</>
                            : <><Clock className="w-3 h-3" /> Open</>}
                    </div>
                </div>

                <p className="text-sm mt-3 leading-relaxed text-foreground/90">{msg.content}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-2">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>

                {msg.admin_reply && (
                    <div className="mt-3 bg-primary/5 border border-primary/10 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-1">Your Reply</p>
                        <p className="text-xs text-foreground/80">{msg.admin_reply}</p>
                    </div>
                )}

                {msg.status === 'open' && (
                    <div className="mt-3">
                        {!expanded ? (
                            <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => setExpanded(true)}>
                                <MessageSquare className="w-3 h-3 mr-1.5" /> Reply
                            </Button>
                        ) : (
                            <div className="space-y-2">
                                <textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="w-full bg-background border border-border/50 rounded-xl p-3 text-sm resize-none h-24 outline-none focus:border-primary/40 transition-colors"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" className="rounded-xl gap-1.5 text-xs h-8" onClick={handleReply} disabled={!reply.trim()}>
                                        <Send className="w-3 h-3" /> Send Reply
                                    </Button>
                                    <Button size="sm" variant="ghost" className="rounded-xl text-xs h-8" onClick={() => setExpanded(false)}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export default function AdminInboxPage() {
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')
    const [notifTitle, setNotifTitle] = useState('')
    const [notifBody, setNotifBody] = useState('')
    const [notifType, setNotifType] = useState('announcement')

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['admin', 'messages', filter],
        queryFn: () => apiClient<AdminMessage[]>(`/admin/messages${filter !== 'all' ? `?status=${filter}` : ''}`),
    })

    const { data: notifications = [] } = useQuery({
        queryKey: ['admin', 'notifications'],
        queryFn: () => apiClient<AdminNotification[]>('/admin/notifications'),
    })

    const replyMutation = useMutation({
        mutationFn: ({ id, reply }: { id: string; reply: string }) =>
            apiClient(`/admin/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),
        onSuccess: () => {
            toast.success('Reply sent! User has been notified.')
            queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] })
        },
        onError: () => toast.error('Failed to send reply.'),
    })

    const broadcastMutation = useMutation({
        mutationFn: () => apiClient('/admin/notifications', {
            method: 'POST',
            body: JSON.stringify({ title: notifTitle, body: notifBody, type: notifType }),
        }),
        onSuccess: () => {
            toast.success('Notification sent to all users!')
            setNotifTitle('')
            setNotifBody('')
            queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
        },
        onError: () => toast.error('Failed to send notification.'),
    })

    const openCount = messages.filter(m => m.status === 'open').length

    return (
        <div className="min-h-screen bg-background page-container max-w-5xl mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-heading font-bold flex items-center gap-3">
                    <Inbox className="w-6 h-6 text-primary" /> Messages & Notifications
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage user requests and send system-wide announcements.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: User Inbox */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                            User Requests {openCount > 0 && <span className="text-amber-500">({openCount} open)</span>}
                        </h2>
                        <div className="flex bg-muted/30 rounded-xl p-0.5 text-xs">
                            {(['all', 'open', 'resolved'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-lg font-semibold transition-all capitalize ${filter === f ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center py-14 text-center">
                            <div className="w-12 h-12 bg-muted/40 rounded-2xl flex items-center justify-center mb-3">
                                <Inbox className="w-5 h-5 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Inbox is empty</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {messages.map(msg => (
                                    <MessageCard
                                        key={msg.id}
                                        msg={msg}
                                        onReply={(id, reply) => replyMutation.mutate({ id, reply })}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Right: Send Notifications */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="border border-border/40 rounded-2xl p-5 space-y-4 bg-surface">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                            <Megaphone className="w-3.5 h-3.5" /> Broadcast Notification
                        </h2>

                        <div className="space-y-3">
                            <input
                                value={notifTitle}
                                onChange={e => setNotifTitle(e.target.value)}
                                placeholder="Title (e.g. Platform Maintenance)"
                                className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
                            />
                            <textarea
                                value={notifBody}
                                onChange={e => setNotifBody(e.target.value)}
                                placeholder="Message body..."
                                className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm resize-none h-24 outline-none focus:border-primary/40 transition-colors"
                            />
                            <select
                                value={notifType}
                                onChange={e => setNotifType(e.target.value)}
                                className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40"
                            >
                                <option value="announcement">📢 Announcement</option>
                                <option value="warning">⚠️ Warning</option>
                            </select>
                            <Button
                                className="w-full rounded-xl gap-2"
                                onClick={() => broadcastMutation.mutate()}
                                disabled={!notifTitle.trim() || !notifBody.trim() || broadcastMutation.isPending}
                            >
                                {broadcastMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send to All Users
                            </Button>
                        </div>
                    </div>

                    {/* Recent notifications sent */}
                    {notifications.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-bold">Recent Sent</h3>
                            {notifications.slice(0, 5).map(n => (
                                <div key={n.id} className="bg-muted/20 border border-border/30 rounded-xl px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                        {n.type === 'warning'
                                            ? <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                            : <Megaphone className="w-3 h-3 text-primary flex-shrink-0" />}
                                        <p className="text-xs font-semibold truncate">{n.title}</p>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>
                                    <p className="text-[10px] text-muted-foreground/40 mt-1">
                                        {n.target_user_name ? `→ ${n.target_user_name}` : '→ All users'} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
