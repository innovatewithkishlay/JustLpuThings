"use client"

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/apiClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Clock,
    BookOpen,
    Activity,
    Sparkles,
    ChevronRight,
    Calendar,
    ArrowUpRight,
    PlayCircle
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

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

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
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
            <div className="min-h-[calc(100vh-4rem)] pb-24 pt-10 page-container max-w-6xl mx-auto space-y-12">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <Skeleton className="h-64 rounded-3xl" />
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                    <h2 className="text-xl font-heading font-black">Sync Interrupted</h2>
                    <p className="text-muted-foreground">Unable to fetch your behavioral data streams.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-24 pt-10 page-container max-w-6xl mx-auto selection:bg-primary/20">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-12">

                {/* Header Section */}
                <motion.section variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary mb-2">
                            <Sparkles className="w-3.5 h-3.5" /> Intelligence Center
                        </div>
                        <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight leading-tight">
                            Personal Analytics
                        </h1>
                        <p className="text-muted-foreground font-medium text-base md:text-lg max-w-2xl">
                            Visualizing your academic commitment and reading depth across the platform.
                        </p>
                    </div>
                </motion.section>

                {/* Overview Cards */}
                <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Read Time', value: formatTime(data.total_time_spent), icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Materials Opened', value: data.total_materials_opened, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                        { label: 'Avg. Completion', value: `${data.avg_completion_rate}%`, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Most Studied', value: data.most_studied_subject, icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    ].map((stat, i) => (
                        <Card key={i} className="border-border/40 bg-surface soft-shadow rounded-[32px] overflow-hidden group hover:border-primary/20 transition-all duration-500">
                            <CardContent className="p-6">
                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 border border-current/10`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</h3>
                                <div className="text-2xl font-black font-heading tracking-tight group-hover:text-primary transition-colors">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>

                {/* In Progress Section */}
                {data.in_progress_materials.length > 0 && (
                    <motion.section variants={fadeUp} className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-heading font-black tracking-tight flex items-center gap-3">
                                <PlayCircle className="w-6 h-6 text-primary" /> Continue Reading
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.in_progress_materials.map((mat) => (
                                <Card
                                    key={mat.id}
                                    onClick={() => router.push(`/viewer/${mat.slug}`)}
                                    className="bg-surface border-border/40 soft-shadow rounded-[28px] group cursor-pointer hover:border-primary/40 transition-all duration-500 overflow-hidden"
                                >
                                    <CardContent className="p-6 relative">
                                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground p-2 rounded-xl">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-heading font-bold text-lg mb-4 line-clamp-1 pr-8">{mat.title}</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Current Progress</span>
                                                    <span className="text-sm font-black font-mono">{Math.round(mat.completion_percentage)}%</span>
                                                </div>
                                                <span className="text-[10px] font-bold font-mono text-muted-foreground">Pg {mat.last_page} / {mat.total_pages || '?'}</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${mat.completion_percentage}%` }}
                                                    className="h-full bg-primary"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Activity & Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Activity Chart */}
                    <motion.div variants={fadeUp} className="lg:col-span-3">
                        <Card className="h-full bg-surface border-border/40 soft-shadow rounded-[32px] overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-xl font-heading font-black flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" /> Study Momentum
                                </CardTitle>
                                <CardDescription className="text-sm font-medium">Reading activity (minutes) over the past 7 days</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.daily_activity}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                                                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--border), 0.1)" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(var(--primary), 0.05)', radius: 12 }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const date = new Date(payload[0].payload.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                    const mins = Math.floor(payload[0].value as number / 60)
                                                    return (
                                                        <div className="bg-background/90 backdrop-blur-xl border border-border p-3 rounded-2xl shadow-xl">
                                                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{date}</div>
                                                            <div className="text-sm font-black text-primary">{mins} mins studying</div>
                                                            <div className="text-[10px] font-bold text-muted-foreground mt-0.5">{payload[0].payload.materials_opened} docs focused</div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <Bar
                                            dataKey="time_spent"
                                            radius={[8, 8, 8, 8]}
                                            fill="url(#barGradient)"
                                            barSize={32}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Quick Stats sidebar */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-6">
                        <Card className="bg-surface border-border/40 soft-shadow rounded-[32px] overflow-hidden h-full">
                            <CardHeader className="p-8">
                                <CardTitle className="text-xl font-heading font-black flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" /> Active Ping
                                </CardTitle>
                                <CardDescription className="text-sm font-medium">System telemetry health</CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-6">
                                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
                                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Last Synchronized</div>
                                    <div className="text-lg font-black font-heading text-primary">
                                        {data.last_active ? formatDistanceToNow(new Date(data.last_active), { addSuffix: true }) : 'Never'}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Engagement Insights</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <div className="text-sm">
                                                {data.avg_completion_rate > 70 ? (
                                                    <p className="font-semibold text-foreground">Elite reading depth detected! Keep up the momentum.</p>
                                                ) : (
                                                    <p className="font-medium text-muted-foreground">Consistent reading habits lead to better retention.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Material History Table */}
                <motion.section variants={fadeUp} className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-heading font-black tracking-tight flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-primary" /> Academic Footprint
                        </h2>
                    </div>
                    <Card className="bg-surface border-border/40 soft-shadow rounded-[36px] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/20">
                                    <tr>
                                        <th className="px-8 py-5">Material</th>
                                        <th className="px-8 py-5">Semester</th>
                                        <th className="px-8 py-5">Progress</th>
                                        <th className="px-8 py-5">Investment</th>
                                        <th className="px-8 py-5 text-right">Last Visit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {data.material_history.map((mat, i) => (
                                        <tr
                                            key={i}
                                            onClick={() => router.push(`/viewer/${mat.slug}`)}
                                            className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-heading font-black text-foreground group-hover:text-primary transition-colors">{mat.title}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{mat.subject}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 rounded-lg bg-muted text-[10px] font-black uppercase tracking-widest">Sem {mat.semester}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${Math.min(100, Math.round(mat.completion_percentage))}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black font-mono tracking-widest">{Math.round(mat.completion_percentage)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-mono font-bold text-foreground">
                                                {formatTime(mat.total_time_spent)}
                                            </td>
                                            <td className="px-8 py-6 text-right font-mono text-[10px] text-muted-foreground font-bold">
                                                {formatDistanceToNow(new Date(mat.last_opened), { addSuffix: true })}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.material_history.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center space-y-4">
                                                <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                                    <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                                                </div>
                                                <h3 className="text-xl font-heading font-black">History Silent</h3>
                                                <p className="text-muted-foreground max-w-xs mx-auto">Start reading materials to activate your academic tracking footprint.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.section>

            </motion.div>
        </div>
    )
}
