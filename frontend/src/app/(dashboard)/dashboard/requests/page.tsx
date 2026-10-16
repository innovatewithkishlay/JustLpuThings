'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { EmptyNote, PageHead, SectionHead, Tag } from '@/components/app/Notebook'

interface Message {
    id: string
    content: string
    status: 'open' | 'resolved'
    admin_reply: string | null
    replied_at: string | null
    reply_read_at: string | null
    created_at: string
}

export default function RequestsPage() {
    const queryClient = useQueryClient()
    const [text, setText] = useState('')

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['messages', 'mine'],
        queryFn: async () => {
            const data = await apiClient<Message[]>('/messages/mine');
            // If there are unread replies, mark them as read
            if (data?.some(m => m.admin_reply && !m.reply_read_at)) {
                apiClient('/messages/mark-read', { method: 'POST' }).catch(console.error);
            }
            return data;
        },
    })

    const sendMutation = useMutation({
        mutationFn: (content: string) => apiClient('/messages', {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),
        onSuccess: () => {
            toast.success('Request sent!')
            setText('')
            queryClient.invalidateQueries({ queryKey: ['messages', 'mine'] })
        },
        onError: () => toast.error('Failed to send. Try again.'),
    })

    const handleSend = () => {
        if (!text.trim()) return
        sendMutation.mutate(text.trim())
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-28 page-container max-w-3xl mx-auto">
            <PageHead
                back="/dashboard"
                crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Requests' }]}
                title={<>Ask the <em>admin</em></>}
                sub="Missing notes, a broken PDF, a paper you need before Friday. We reply right here."
            />

            <div className="app-card p-4 mb-14 focus-within:border-ring focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_18%,transparent)] transition-shadow">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    aria-label="Your request"
                    placeholder="e.g. Can you add CSE206 unit 4 notes? The PDF on the subject page won't open."
                    className="w-full bg-transparent text-[15px] resize-none border-none outline-none h-28 placeholder:text-muted-foreground/60 leading-relaxed"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
                    }}
                />
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-border">
                    <span className="font-mono text-[11px] text-muted-foreground">Ctrl + Enter to send</span>
                    <button
                        type="button"
                        className="app-btn h-9"
                        onClick={handleSend}
                        disabled={!text.trim() || sendMutation.isPending}
                    >
                        {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send request
                    </button>
                </div>
            </div>

            <SectionHead n="01" title="Your requests" aside={messages.length ? `${messages.length} sent` : undefined} />

            {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : messages.length === 0 ? (
                <EmptyNote title="Nothing sent yet">Your requests and our replies will show up here.</EmptyNote>
            ) : (
                <ul className="border-t border-foreground/80">
                    {messages.map((msg) => (
                        <li key={msg.id} className="py-5 px-2 border-b border-border">
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                <Tag tone={msg.status === 'resolved' ? 'green' : 'plain'}>{msg.status === 'resolved' ? 'answered' : 'waiting'}</Tag>
                            </div>
                            <p className="mt-1.5 text-[12px] text-muted-foreground">
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>

                            {msg.admin_reply && (
                                <div className="mt-4 ml-4 pl-4 border-l-2 border-ink-blue/60">
                                    <p className="font-hand text-[19px] text-ink-blue leading-none mb-1">admin replied</p>
                                    <p className="text-[15px] leading-relaxed">{msg.admin_reply}</p>
                                    {msg.replied_at && (
                                        <p className="mt-1.5 text-[12px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(msg.replied_at), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
