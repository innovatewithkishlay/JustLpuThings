'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/apiClient'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { AdminShell } from '@/components/app/AdminShell'
import { EmptyNote, Kicker, PageHead, Tag } from '@/components/app/Notebook'

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
    reply_read_at: string | null
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

function MessageCard({ msg, onReply, initiallyExpanded = false }: { msg: AdminMessage; onReply: (id: string, reply: string) => void, initiallyExpanded?: boolean }) {
    const [reply, setReply] = useState('')
    const [expanded, setExpanded] = useState(initiallyExpanded)

    const [isEditing, setIsEditing] = useState(false)

    const handleReply = () => {
        if (!reply.trim()) return
        onReply(msg.id, reply.trim())
        setReply('')
        setExpanded(false)
        setIsEditing(false)
    }

    const startEditing = () => {
        setReply(msg.admin_reply || '')
        setIsEditing(true)
        setExpanded(true)
    }

    return (
        <li className={`py-5 px-2 border-b border-border ${msg.status === 'resolved' ? 'opacity-80' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-semibold">{msg.user_name}</p>
                    <p className="font-mono text-[12px] text-muted-foreground">{msg.user_email}</p>
                </div>
                <span className="flex items-center gap-3 shrink-0">
                    <span className="text-[12px] text-muted-foreground">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                    <Tag tone={msg.status === 'resolved' ? 'green' : 'red'}>{msg.status === 'resolved' ? 'answered' : 'open'}</Tag>
                </span>
            </div>

            <p className="mt-3 text-[15px] leading-relaxed">{msg.content}</p>

            {msg.admin_reply && !isEditing && (
                <div className="mt-4 ml-4 pl-4 border-l-2 border-ink-blue/60">
                    <p className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground mb-1">
                        <span>Your reply {msg.reply_read_at && <span className="text-emerald-700 dark:text-emerald-400">· seen</span>}</span>
                        {!msg.reply_read_at && (
                            <span className="flex items-center gap-3">
                                <button type="button" onClick={startEditing} className="hover:text-foreground underline-offset-4 hover:underline">Edit</button>
                                <button type="button" onClick={() => onReply(msg.id, 'DELETE_REPLY')} className="hover:text-destructive underline-offset-4 hover:underline">Delete</button>
                            </span>
                        )}
                    </p>
                    <p className="text-[14px] text-ink-blue">{msg.admin_reply}</p>
                </div>
            )}

            {(msg.status === 'open' || isEditing) && (
                <div className="mt-4">
                    {!expanded && !isEditing ? (
                        <button type="button" className="app-btn-quiet h-8 px-3 text-[13px]" onClick={() => setExpanded(true)}>
                            Reply
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder={isEditing ? "Edit your reply…" : "Write a reply…"}
                                aria-label="Reply"
                                rows={3}
                                className="app-field"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button type="button" className="app-btn h-8 px-3 text-[13px]" onClick={handleReply} disabled={!reply.trim() || reply.trim() === msg.admin_reply}>
                                    <Send className="w-3.5 h-3.5" /> {isEditing ? 'Update reply' : 'Send reply'}
                                </button>
                                <button type="button" className="app-btn-quiet h-8 px-3 text-[13px]" onClick={() => { setExpanded(false); setIsEditing(false); }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </li>
    )
}

export default function AdminInboxPage() {
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()
    const msgId = searchParams.get('msgId')

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
        mutationFn: ({ id, reply }: { id: string; reply: string }) => {
            if (reply === 'DELETE_REPLY') {
                return apiClient(`/admin/messages/${id}/reply`, { method: 'DELETE' });
            }
            // Use PATCH if there's already a reply (editing)
            const method = messages.find(m => m.id === id)?.admin_reply ? 'PATCH' : 'POST';
            return apiClient(`/admin/messages/${id}/reply`, {
                method,
                body: JSON.stringify({ reply })
            });
        },
        onSuccess: (_, variables) => {
            const isDelete = variables.reply === 'DELETE_REPLY';
            toast.success(isDelete ? 'Reply deleted.' : 'Reply updated!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] })
        },
        onError: (err: any) => toast.error(err?.message || 'Action failed.'),
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
        <AdminShell active="INBOX">
            <PageHead
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Inbox' }]}
                title={<>Inbox</>}
                sub="Requests from students on the left. Announcements to everyone on the right."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <section className="lg:col-span-7" aria-label="Student requests">
                    <div className="flex items-end justify-between gap-4 mb-4">
                        <div>
                            <Kicker n="01" className="mb-2">Requests</Kicker>
                            <p className="font-heading text-[26px] leading-tight">
                                {openCount > 0 ? <>{openCount} waiting for a reply</> : 'All answered'}
                            </p>
                        </div>
                        <div role="tablist" aria-label="Filter" className="flex gap-4 text-[14px]">
                            {(['all', 'open', 'resolved'] as const).map(f => (
                                <button
                                    key={f}
                                    role="tab"
                                    aria-selected={filter === f}
                                    onClick={() => setFilter(f)}
                                    className={`relative pb-1 capitalize ${filter === f ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {f === 'resolved' ? 'answered' : f}
                                    {filter === f && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-ink-red" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                    ) : messages.length === 0 ? (
                        <EmptyNote title="Inbox is empty">When a student sends a request, it lands here.</EmptyNote>
                    ) : (
                        <ul className="border-t border-foreground/80">
                            {messages.map(msg => (
                                <MessageCard
                                    key={msg.id}
                                    msg={msg}
                                    onReply={(id, reply) => replyMutation.mutate({ id, reply })}
                                    initiallyExpanded={msg.id === msgId}
                                />
                            ))}
                        </ul>
                    )}
                </section>

                <section className="lg:col-span-5" aria-label="Announcements">
                    <Kicker n="02" className="mb-2">Announce</Kicker>
                    <p className="font-heading text-[26px] leading-tight mb-4">Tell everyone</p>
                    <div className="app-card p-5 space-y-3">
                        <input
                            value={notifTitle}
                            onChange={e => setNotifTitle(e.target.value)}
                            placeholder="Title, e.g. CSE320 unit 4 is up"
                            aria-label="Title"
                            className="app-field"
                        />
                        <textarea
                            value={notifBody}
                            onChange={e => setNotifBody(e.target.value)}
                            placeholder="What should students know?"
                            aria-label="Message"
                            rows={4}
                            className="app-field"
                        />
                        <select value={notifType} onChange={e => setNotifType(e.target.value)} aria-label="Type" className="app-field">
                            <option value="announcement">Announcement</option>
                            <option value="warning">Warning</option>
                        </select>
                        <button
                            type="button"
                            className="app-btn w-full"
                            onClick={() => broadcastMutation.mutate()}
                            disabled={!notifTitle.trim() || !notifBody.trim() || broadcastMutation.isPending}
                        >
                            {broadcastMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send to every student
                        </button>
                    </div>

                    {notifications.length > 0 && (
                        <div className="mt-8">
                            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-2">Sent recently</p>
                            <ul className="border-t border-border">
                                {notifications.slice(0, 5).map(n => (
                                    <li key={n.id} className="py-3 border-b border-border">
                                        <p className="flex items-center gap-2 text-[14px] font-semibold">
                                            {n.type === 'warning' && <Tag tone="red">warning</Tag>}
                                            <span className="truncate">{n.title}</span>
                                        </p>
                                        <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>
                                        <p className="text-[12px] text-muted-foreground mt-1">
                                            {n.target_user_name ? `to ${n.target_user_name}` : 'to everyone'} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            </div>
        </AdminShell>
    )
}
