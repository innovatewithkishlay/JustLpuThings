"use client"

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { AdminShell } from '@/components/app/AdminShell'
import { EmptyNote, PageHead, ProgressLine, SectionHead, Stat, Tag } from '@/components/app/Notebook'

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    is_blocked: boolean;
    created_at: string;
    latest_message_id?: string;
    message_status?: 'open' | 'resolved';
}

interface UserEngagement {
    total_time_spent: number;
    total_materials_opened: number;
    avg_time_per_material: number;
    completion_rate: number;
    last_active: string | null;
}

interface MaterialHistory {
    id: string;
    title: string;
    slug: string;
    subject_name: string;
    semester_number: number;
    last_page: number;
    total_pages: number | null;
    completion_percentage: number;
    total_time_spent: number;
    last_opened: string;
}

interface SuspiciousEvent {
    id: string;
    event_type: string;
    count: number;
    created_at: string;
}

interface UserDetailResponse {
    profile: UserProfile;
    engagement: UserEngagement;
    history: MaterialHistory[];
    suspicious_activity: SuspiciousEvent[];
}

export default function AdminUserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const userId = params.userId as string

    const { data, isLoading, isError } = useQuery({
        queryKey: ["admin", "users", userId],
        queryFn: () => apiClient<UserDetailResponse>(`/admin/users/${userId}`),
        refetchOnWindowFocus: true
    })

    const blockMutation = useMutation({
        mutationFn: async (shouldBlock: boolean) => {
            const endpoint = shouldBlock ? `/admin/users/${userId}/block` : `/admin/users/${userId}/unblock`
            return await apiClient(endpoint, {
                method: 'PATCH',
                body: JSON.stringify({ reason: "Manual enforcement via Dashboard" })
            })
        },
        onSuccess: () => {
            toast.success('User access policy updated successfully')
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] }) // invalidate detail AND lists
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Failed to update user status')
        }
    })

    const formatTime = (seconds: number | string) => {
        const secs = Number(seconds) || 0;
        if (secs < 60) return `${secs}s`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ${secs % 60}s`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m`;
    }

    if (isLoading) {
        return <AdminShell active="USERS"><DashboardSkeleton /></AdminShell>
    }

    if (isError || !data) {
        return (
            <AdminShell active="USERS">
                <EmptyNote
                    title="Couldn’t find this student"
                    action={<button type="button" className="app-btn-quiet" onClick={() => router.push('/admin/users')}>Back to students</button>}
                >
                    The account may have been deleted.
                </EmptyNote>
            </AdminShell>
        )
    }

    const { profile, engagement, history, suspicious_activity } = data

    const talkTo = async () => {
        if (profile.latest_message_id) {
            router.push(`/admin/inbox?msgId=${profile.latest_message_id}`);
        } else {
            const msg = window.prompt(`Start conversation with ${profile.name || 'this user'}:`);
            if (!msg?.trim()) return;
            try {
                const res = await apiClient<{ success: boolean, data: { id: string } }>(`/admin/users/${profile.id}/message`, {
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
                back="/admin/users"
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Students', href: '/admin/users' }, { label: profile.name || profile.email }]}
                title={<>{profile.name || 'No name'}</>}
                sub={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-[14px]">{profile.email}</span>
                        <span className="opacity-40">·</span>
                        <span>joined {new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="opacity-40">·</span>
                        {profile.is_blocked ? <Tag tone="red">Blocked</Tag> : profile.role === 'ADMIN' ? <Tag tone="blue">Admin</Tag> : <Tag>Student</Tag>}
                    </span>
                }
                actions={profile.role !== 'ADMIN' ? (
                    <>
                        <button
                            type="button"
                            onClick={talkTo}
                            className={`app-btn-quiet ${profile.message_status === 'open' ? '!border-ink-red !text-ink-red' : ''}`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            {profile.message_status === 'open' ? 'Reply to request' : profile.latest_message_id ? 'Conversation' : 'Send a message'}
                        </button>
                        <button
                            type="button"
                            onClick={() => blockMutation.mutate(!profile.is_blocked)}
                            disabled={blockMutation.isPending}
                            className={profile.is_blocked ? 'app-btn' : 'app-btn app-btn-danger'}
                        >
                            {profile.is_blocked ? 'Restore access' : 'Block account'}
                        </button>
                    </>
                ) : undefined}
            />

            <dl className="grid grid-cols-2 lg:grid-cols-4 border-b border-border -mt-4">
                <Stat label="Reading time" value={formatTime(engagement.total_time_spent)} />
                <Stat label="Materials opened" value={engagement.total_materials_opened} />
                <Stat label="Average completion" value={`${engagement.completion_rate}%`} />
                <Stat label="Time per material" value={formatTime(engagement.avg_time_per_material)} />
            </dl>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
                <section className="lg:col-span-8">
                    <SectionHead n="01" title="What they’ve read" aside={history?.length ? `${history.length} materials` : undefined} />
                    {!history || history.length === 0 ? (
                        <EmptyNote title="Nothing opened yet">This student hasn’t opened any materials.</EmptyNote>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[14px] text-left border-collapse min-w-[560px]">
                                <thead>
                                    <tr className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-foreground/80">
                                        <th className="py-2.5 px-2 font-normal">Material</th>
                                        <th className="py-2.5 px-2 font-normal w-[170px]">Progress</th>
                                        <th className="py-2.5 px-2 font-normal text-right">Time</th>
                                        <th className="py-2.5 px-2 font-normal text-right">Last opened</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((mat) => (
                                        <tr key={mat.id} className="border-b border-border">
                                            <td className="py-3 px-2">
                                                <span className="block font-medium truncate max-w-[320px]">{mat.title}</span>
                                                <span className="block font-mono text-[11px] text-muted-foreground uppercase">{mat.subject_name} · sem {mat.semester_number}</span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className="flex items-center gap-3">
                                                    <span className="w-16"><ProgressLine value={mat.completion_percentage} /></span>
                                                    <span className="font-mono text-[12px]">{Math.round(mat.completion_percentage)}%</span>
                                                </span>
                                                <span className="block font-mono text-[11px] text-muted-foreground mt-1">p. {mat.last_page}/{mat.total_pages || '?'}</span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-mono">{formatTime(mat.total_time_spent)}</td>
                                            <td className="py-3 px-2 text-right text-[12px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(mat.last_opened), { addSuffix: true })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="lg:col-span-4">
                    <SectionHead n="02" title="Flags" />
                    {!suspicious_activity || suspicious_activity.length === 0 ? (
                        <div className="app-card p-5">
                            <p className="font-semibold">Nothing unusual</p>
                            <p className="mt-1 text-[14px] text-muted-foreground">No rapid-fire downloads or other odd patterns in the last 24 hours.</p>
                        </div>
                    ) : (
                        <ul className="border-t border-foreground/80">
                            {suspicious_activity.map((event) => (
                                <li key={event.id} className="py-3 px-2 border-b border-border">
                                    <span className="flex items-center justify-between gap-3">
                                        <span className="font-medium text-ink-red capitalize">{event.event_type.replace(/_/g, ' ').toLowerCase()}</span>
                                        <span className="font-mono text-[13px]">×{event.count}</span>
                                    </span>
                                    <span className="block text-[12px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
                                </li>
                            ))}
                            <li className="pt-3 px-2 text-[12px] text-muted-foreground">Flags clear after 24 hours without another event.</li>
                        </ul>
                    )}
                </section>
            </div>
        </AdminShell>
    )
}
