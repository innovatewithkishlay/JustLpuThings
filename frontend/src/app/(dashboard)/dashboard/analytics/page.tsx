"use client"

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { ArrowRight } from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { EmptyNote, PageHead, ProgressLine, SectionHead, Stat } from '@/components/app/Notebook'

interface AnalyticsData {
    total_time_spent: number;
    total_materials_opened: number;
    avg_completion_rate: number;
    most_studied_subject: string;
    last_active: string | null;
    daily_activity: {
        date: string;
        time_spent: number;
        materials_opened: number;
    }[];
    in_progress_materials: {
        id: string;
        title: string;
        slug: string;
        last_page: number;
        total_pages: number;
        completion_percentage: number;
    }[];
    material_history: {
        title: string;
        slug: string;
        semester: number;
        subject: string;
        last_page: number;
        completion_percentage: number;
        total_time_spent: number;
        last_opened: string;
    }[];
}

export default function AnalyticsPage() {
    const router = useRouter()

    const { data, isLoading, isError } = useQuery({
        queryKey: ["user", "analytics"],
        queryFn: () => apiClient<AnalyticsData>('/users/me/analytics'),
        staleTime: 10000,
        refetchInterval: 30000, // 30s pulse for personal metrics
        refetchOnWindowFocus: true
    })

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`
        const mins = Math.floor(seconds / 60)
        if (mins < 60) return `${mins}m`
        const hours = Math.floor(mins / 60)
        return `${hours}h ${mins % 60}m`
    }

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] pb-24 page-container max-w-6xl mx-auto space-y-6">
                <div className="h-28 rounded-lg bg-muted/50 animate-pulse" />
                <div className="h-24 rounded-lg bg-muted/40 animate-pulse" />
                <div className="h-64 rounded-lg bg-muted/30 animate-pulse" />
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className="min-h-[calc(100vh-4rem)] page-container max-w-3xl mx-auto flex items-center">
                <EmptyNote title="Couldn’t load your stats">Refresh the page in a moment.</EmptyNote>
            </div>
        )
    }

    const weekTotal = data.daily_activity.reduce((s, d) => s + d.time_spent, 0)

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-28 page-container max-w-6xl mx-auto">
            <PageHead
                back="/dashboard"
                crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My progress' }]}
                title={<>Your <em>reading</em>, so far</>}
                sub={data.last_active
                    ? <>Last opened something {formatDistanceToNow(new Date(data.last_active), { addSuffix: true })}.</>
                    : 'Open any notes and your progress starts showing up here.'}
            />

            <dl className="grid grid-cols-2 lg:grid-cols-4 border-b border-border -mt-4">
                <Stat label="Total reading time" value={formatTime(data.total_time_spent)} />
                <Stat label="Materials opened" value={data.total_materials_opened} />
                <Stat label="Average completion" value={`${data.avg_completion_rate}%`} />
                <Stat label="Most studied" value={<span className="text-[26px] leading-tight">{data.most_studied_subject || '–'}</span>} />
            </dl>

            {/* Continue reading */}
            {data.in_progress_materials.length > 0 && (
                <section className="mt-14">
                    <SectionHead n="01" title="Pick up where you left off" />
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {data.in_progress_materials.map((mat) => (
                            <li key={mat.id}>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/viewer/${mat.slug}`)}
                                    className="app-card group w-full text-left p-5 h-full flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--ink-red)] hover:border-foreground/60"
                                >
                                    <span className="font-heading text-[19px] leading-snug line-clamp-2">{mat.title}</span>
                                    <span className="mt-auto pt-6 block">
                                        <span className="flex items-center justify-between font-mono text-[11px] text-muted-foreground mb-2">
                                            <span>page {mat.last_page} of {mat.total_pages || '?'}</span>
                                            <span className="text-foreground">{Math.round(mat.completion_percentage)}%</span>
                                        </span>
                                        <ProgressLine value={mat.completion_percentage} />
                                    </span>
                                    <span className="mt-4 text-[13px] font-semibold flex items-center gap-1.5">
                                        Continue <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* This week */}
            <section className="mt-14">
                <SectionHead
                    n={data.in_progress_materials.length > 0 ? '02' : '01'}
                    title="This week"
                    aside={<span className="font-mono text-[12px]">{formatTime(weekTotal)} in total</span>}
                />
                <div className="app-card p-5 sm:p-6 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.daily_activity} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                            <CartesianGrid vertical={false} stroke="var(--border)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-lp-mono)' }}
                                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                            />
                            <YAxis hide />
                            <Tooltip
                                cursor={{ fill: 'var(--muted)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const date = new Date(payload[0].payload.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
                                        const mins = Math.floor(payload[0].value as number / 60)
                                        return (
                                            <div className="app-card px-3 py-2 text-[13px] shadow-lg">
                                                <div className="font-mono text-[11px] text-muted-foreground mb-0.5">{date}</div>
                                                <div className="font-semibold">{mins} min reading</div>
                                                <div className="text-muted-foreground">{payload[0].payload.materials_opened} materials</div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar dataKey="time_spent" fill="var(--foreground)" radius={[3, 3, 0, 0]} maxBarSize={36} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {data.avg_completion_rate > 70 && (
                    <p className="mt-3 font-hand text-[22px] text-ink-red -rotate-1">you finish what you open. nice.</p>
                )}
            </section>

            {/* History */}
            <section className="mt-14">
                <SectionHead n={data.in_progress_materials.length > 0 ? '03' : '02'} title="Everything you’ve opened" />
                {data.material_history.length === 0 ? (
                    <EmptyNote title="Nothing yet">Open any notes and they’ll be listed here, with how far you got.</EmptyNote>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[14px] text-left border-collapse min-w-[640px]">
                            <thead>
                                <tr className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-foreground/80">
                                    <th className="py-2 px-2 font-normal">Material</th>
                                    <th className="py-2 px-2 font-normal">Sem</th>
                                    <th className="py-2 px-2 font-normal w-[180px]">Progress</th>
                                    <th className="py-2 px-2 font-normal text-right">Time</th>
                                    <th className="py-2 px-2 font-normal text-right">Last opened</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.material_history.map((mat, i) => (
                                    <tr
                                        key={i}
                                        onClick={() => router.push(`/viewer/${mat.slug}`)}
                                        className="app-row-link border-b border-border cursor-pointer"
                                    >
                                        <td className="py-3.5 px-2">
                                            <span className="block font-medium">{mat.title}</span>
                                            <span className="block font-mono text-[11px] text-ink-red uppercase mt-0.5">{mat.subject}</span>
                                        </td>
                                        <td className="py-3.5 px-2 font-mono text-muted-foreground">{mat.semester}</td>
                                        <td className="py-3.5 px-2">
                                            <span className="flex items-center gap-3">
                                                <span className="w-24"><ProgressLine value={mat.completion_percentage} /></span>
                                                <span className="font-mono text-[12px]">{Math.round(mat.completion_percentage)}%</span>
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-2 text-right font-mono">{formatTime(mat.total_time_spent)}</td>
                                        <td className="py-3.5 px-2 text-right text-[12px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(mat.last_opened), { addSuffix: true })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}
