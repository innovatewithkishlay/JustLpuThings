'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Send, MessageSquare, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Message {
    id: string
    content: string
    status: 'open' | 'resolved'
    admin_reply: string | null
    replied_at: string | null
    created_at: string
}

export default function RequestsPage() {
    const queryClient = useQueryClient()
    const [text, setText] = useState('')

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['messages', 'mine'],
        queryFn: () => apiClient<Message[]>('/messages/mine'),
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
        <div className="min-h-screen bg-background page-container max-w-3xl mx-auto py-10 px-4">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-8">
                    <h1 className="text-2xl font-heading font-bold">Send a Request</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ask us to add materials, report broken links, or share feedback. We'll reply in-app.
                    </p>
                </div>

                {/* Compose box */}
                <div className="relative mb-10">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-indigo-400 rounded-[20px] blur opacity-20" />
                    <div className="relative bg-surface border border-border/50 rounded-[18px] p-4">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="e.g. Can you please add CSE206 Unit 4 notes? The Drive link on the subject page is broken."
                            className="w-full bg-transparent text-sm resize-none border-none outline-none h-28 placeholder:text-muted-foreground/40 leading-relaxed"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
                            }}
                        />
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-muted-foreground/40">Ctrl+Enter to send</span>
                            <Button
                                size="sm"
                                className="rounded-xl gap-2"
                                onClick={handleSend}
                                disabled={!text.trim() || sendMutation.isPending}
                            >
                                {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Send Request
                            </Button>
                        </div>
                    </div>
                </div>

                {/* My requests list */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Your Requests</h2>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center py-14 text-center">
                            <div className="w-12 h-12 bg-muted/40 rounded-2xl flex items-center justify-center mb-3">
                                <MessageSquare className="w-5 h-5 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">No requests yet</p>
                            <p className="text-xs text-muted-foreground/50 mt-1">Your submitted requests and admin replies will appear here</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-surface border border-border/40 rounded-2xl p-4 space-y-3"
                                >
                                    {/* User message */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                            <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${msg.status === 'resolved'
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : 'bg-amber-500/10 text-amber-500'
                                            }`}>
                                            {msg.status === 'resolved'
                                                ? <><CheckCircle2 className="w-3 h-3" /> Resolved</>
                                                : <><Clock className="w-3 h-3" /> Pending</>
                                            }
                                        </div>
                                    </div>

                                    {/* Admin reply */}
                                    {msg.admin_reply && (
                                        <div className="ml-10 bg-primary/5 border border-primary/10 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-1.5">Admin Reply</p>
                                            <p className="text-sm text-foreground leading-relaxed">{msg.admin_reply}</p>
                                            {msg.replied_at && (
                                                <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                                                    {formatDistanceToNow(new Date(msg.replied_at), { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
