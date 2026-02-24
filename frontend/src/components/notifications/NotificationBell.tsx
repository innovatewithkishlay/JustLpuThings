'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Bell, X, CheckCheck, MessageSquare, Megaphone, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
    id: string
    title: string
    body: string
    type: 'reply' | 'announcement' | 'warning'
    read_at: string | null
    created_at: string
}

const typeConfig = {
    reply: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    announcement: { icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
}

export function NotificationBell() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => apiClient<Notification[]>('/notifications'),
        enabled: !!user,
        refetchInterval: 60000, // Poll every 60s
    })

    const { data: countData } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => apiClient<{ count: number }>('/notifications/unread-count'),
        enabled: !!user,
        refetchInterval: 30000,
    })

    const markAllMutation = useMutation({
        mutationFn: () => apiClient('/notifications/read-all', { method: 'PATCH' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    const markOneMutation = useMutation({
        mutationFn: (id: string) => apiClient(`/notifications/${id}/read`, { method: 'PATCH' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    const unreadCount = countData?.count ?? 0

    if (!user) return null

    return (
        <div className="relative">
            <Button
                variant="ghost"
                className="relative w-10 h-10 px-0 rounded-2xl hover:bg-white/10 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <Bell className="h-5 w-5 text-foreground/70" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center px-1"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </Button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-12 z-50 w-[360px] bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold">Notifications</span>
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground"
                                            onClick={() => markAllMutation.mutate()}
                                        >
                                            <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className="w-7 h-7 px-0" onClick={() => setOpen(false)}>
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Notification list */}
                            <div className="max-h-[420px] overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <div className="w-12 h-12 bg-muted/40 rounded-2xl flex items-center justify-center mb-3">
                                            <Bell className="w-5 h-5 text-muted-foreground/40" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">Admin replies and announcements will appear here</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/30">
                                        {notifications.map((notif) => {
                                            const cfg = typeConfig[notif.type] || typeConfig.announcement
                                            const Icon = cfg.icon
                                            const isUnread = !notif.read_at
                                            return (
                                                <div
                                                    key={notif.id}
                                                    className={`flex gap-3 px-4 py-3.5 transition-colors cursor-pointer hover:bg-muted/20 ${isUnread ? 'bg-primary/[0.02]' : ''}`}
                                                    onClick={() => {
                                                        if (isUnread) markOneMutation.mutate(notif.id)
                                                    }}
                                                >
                                                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${cfg.bg}`}>
                                                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-sm font-semibold leading-tight">{notif.title}</p>
                                                            {isUnread && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                                                        <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
