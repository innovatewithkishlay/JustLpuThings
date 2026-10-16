"use client"

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { MessageSquare, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AdminShell } from '@/components/app/AdminShell'
import { EmptyNote, PageHead, ProgressLine, Tag } from '@/components/app/Notebook'

interface UserAnalyticsOverview {
    id: string;
    email: string;
    name: string;
    role: string;
    is_blocked: boolean;
    created_at: string;
    total_materials_opened: string | number;
    total_time_spent: string | number;
    completion_rate: string | number;
    last_active: string | null;
    latest_message_id?: string;
    message_status?: 'open' | 'resolved';
}

export default function AdminUsersPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Debounce watcher
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 500)
        return () => clearTimeout(handler)
    }, [searchTerm])

    const { data: users, isLoading, isError } = useQuery({
        queryKey: ["admin", "users", debouncedSearch],
        queryFn: () => apiClient<UserAnalyticsOverview[]>(`/admin/users${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`),
        staleTime: 10000,
        refetchInterval: 30000, // 30s pulse for user grid
        refetchOnWindowFocus: true
    })

    const formatTime = (seconds: number | string) => {
        const secs = Number(seconds) || 0;
        if (secs < 60) return `${secs}s`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ${secs % 60}s`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m`;
    }

    const talkTo = async (user: UserAnalyticsOverview) => {
        if (user.latest_message_id) {
            router.push(`/admin/inbox?msgId=${user.latest_message_id}`);
        } else {
            const msg = window.prompt(`Start conversation with ${user.name || 'this user'}:`);
            if (!msg?.trim()) return;
            try {
                const res = await apiClient<{ success: boolean, data: { id: string } }>(`/admin/users/${user.id}/message`, {
                    method: 'POST',
                    body: JSON.stringify({ message: msg.trim() })
                });
                toast.success('Message sent! Opening inbox...');
                router.push(`/admin/inbox?msgId=${res.data.id}`);
            } catch (err: any) {
                toast.error(err.message || 'Failed to send message');
            }
        }
    }

    return (
        <AdminShell active="USERS">
            <PageHead
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Students' }]}
                title={<>Students</>}
                sub="Who’s reading, how much, and when they were last here. Click a row for the full profile."
                actions={
                    <label className="relative block w-full md:w-80">
                        <span className="sr-only">Search students</span>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or email"
                            className="app-field pl-9"
                        />
                    </label>
                }
            />

            {isLoading ? (
                <ul>{Array.from({ length: 8 }).map((_, i) => <li key={i} className="h-14 border-b border-border animate-pulse bg-muted/30" />)}</ul>
            ) : isError ? (
                <EmptyNote title="Couldn’t load students">Check that you’re still signed in as an admin.</EmptyNote>
            ) : !users || users.length === 0 ? (
                <EmptyNote title="No one matches that">Try a shorter name or part of the email.</EmptyNote>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-[14px] text-left border-collapse min-w-[860px]">
                        <thead>
                            <tr className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-foreground/80">
                                <th className="py-2.5 px-2 font-normal">Student</th>
                                <th className="py-2.5 px-2 font-normal">Status</th>
                                <th className="py-2.5 px-2 font-normal text-right">Opened</th>
                                <th className="py-2.5 px-2 font-normal text-right">Reading time</th>
                                <th className="py-2.5 px-2 font-normal w-[170px]">Completion</th>
                                <th className="py-2.5 px-2 font-normal">Last seen</th>
                                <th className="py-2.5 px-2 font-normal text-right">Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                    className={`app-row-link border-b border-border cursor-pointer ${user.is_blocked ? 'opacity-55' : ''}`}
                                >
                                    <td className="py-3 px-2">
                                        <span className="block font-medium">{user.name || 'No name'}</span>
                                        <span className="block font-mono text-[12px] text-muted-foreground">{user.email}</span>
                                    </td>
                                    <td className="py-3 px-2">
                                        {user.is_blocked ? <Tag tone="red">Blocked</Tag> : user.role === 'ADMIN' ? <Tag tone="blue">Admin</Tag> : <Tag>Student</Tag>}
                                    </td>
                                    <td className="py-3 px-2 text-right font-mono tabular-nums">{user.total_materials_opened}</td>
                                    <td className="py-3 px-2 text-right font-mono tabular-nums">{formatTime(user.total_time_spent)}</td>
                                    <td className="py-3 px-2">
                                        <span className="flex items-center gap-3">
                                            <span className="w-20"><ProgressLine value={Number(user.completion_rate)} /></span>
                                            <span className="font-mono text-[12px]">{Math.round(Number(user.completion_rate))}%</span>
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-[13px] text-muted-foreground whitespace-nowrap">
                                        {user.last_active ? new Date(user.last_active).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); talkTo(user) }}
                                            title={!user.latest_message_id ? 'Start a conversation' : user.message_status === 'open' ? 'Open request, reply now' : 'Conversation history'}
                                            aria-label={!user.latest_message_id ? `Message ${user.name || user.email}` : 'Open conversation'}
                                            className={`relative inline-flex w-9 h-9 items-center justify-center rounded-md border transition-colors ${user.message_status === 'open'
                                                ? 'border-ink-red text-ink-red hover:bg-ink-red/10'
                                                : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            {user.message_status === 'open' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-ink-red" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminShell>
    )
}
