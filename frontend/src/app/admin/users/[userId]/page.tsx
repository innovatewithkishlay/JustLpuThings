"use client"

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { ArrowLeft, User, Mail, ShieldAlert, Activity, BookOpen, Clock, AlertTriangle, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    is_blocked: boolean;
    created_at: string;
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

interface UserDetailResponse {
    profile: UserProfile;
    engagement: UserEngagement;
    history: MaterialHistory[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
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
        return <div className="page-container pt-8"><DashboardSkeleton /></div>
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen pt-16 flex justify-center text-center">
                <div className="flex flex-col items-center gap-4">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
                    <h2 className="text-xl font-bold font-heading">User Profile Missing</h2>
                    <p className="text-muted-foreground text-sm">Failed to retrieve behavioral vectors.</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.back()}>Return to Directory</Button>
                </div>
            </div>
        )
    }

    const { profile, engagement, history } = data

    return (
        <div className="min-h-screen pb-20 pt-8 bg-[#F8FAFC] dark:bg-[#080B11] selection:bg-primary/20">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="page-container max-w-[1400px]">

                {/* Header Strip */}
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 pb-4 border-b border-border/50 gap-4">
                    <div className="space-y-4">
                        <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary transition-colors group text-sm font-bold tracking-widest uppercase text-muted-foreground" onClick={() => router.push('/admin/users')}>
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Audience
                        </Button>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                <User className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-heading font-bold tracking-tight">{profile.name || 'Anonymous User'}</h1>
                                <div className="flex items-center gap-3 mt-1.5 font-mono text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="w-4 h-4" /> {profile.email}</span>
                                    <span className="text-muted-foreground/30">•</span>
                                    <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-center border ${profile.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                                profile.is_blocked ? 'bg-red-500/10 text-red-500 border-red-500/20 text-red-500 animate-pulse' :
                                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                            {profile.is_blocked ? 'ACCOUNT SUSPENDED' : `${profile.role} CLEARANCE`}
                        </div>
                        {profile.role !== 'ADMIN' && (
                            <Button
                                variant={profile.is_blocked ? 'default' : 'destructive'}
                                onClick={() => blockMutation.mutate(!profile.is_blocked)}
                                disabled={blockMutation.isPending}
                                className="w-full font-bold shadow-sm"
                            >
                                {profile.is_blocked ? 'Restore Access' : 'Suspend Account'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Engagement Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <motion.div variants={itemVariants}>
                        <Card className="h-full bg-surface border-border/50 soft-shadow transition-all hover:border-border hover:shadow-md rounded-[20px]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Time Spent</CardTitle>
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center border bg-blue-500/10 border-blue-500/20 text-blue-500">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-heading font-black">{formatTime(engagement.total_time_spent)}</div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="h-full bg-surface border-border/50 soft-shadow transition-all hover:border-border hover:shadow-md rounded-[20px]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Materials Opened</CardTitle>
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center border bg-indigo-500/10 border-indigo-500/20 text-indigo-500">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-heading font-black">{engagement.total_materials_opened}</div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="h-full bg-surface border-border/50 soft-shadow transition-all hover:border-border hover:shadow-md rounded-[20px]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Global Completion</CardTitle>
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                                    <Activity className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-heading font-black">{engagement.completion_rate}%</div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="h-full bg-surface border-border/50 soft-shadow transition-all hover:border-border hover:shadow-md rounded-[20px]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Average Time/Doc</CardTitle>
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center border bg-amber-500/10 border-amber-500/20 text-amber-500">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-heading font-black">{formatTime(engagement.avg_time_per_material)}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Per Material Breakdown Table */}
                <motion.div variants={itemVariants}>
                    <Card className="bg-surface border-border/50 overflow-hidden rounded-[24px] soft-shadow min-h-[400px]">
                        <CardHeader className="border-b border-border/40 bg-muted/10 p-5 px-6">
                            <CardTitle className="flex items-center gap-2 text-[17px] font-heading font-bold text-foreground">
                                <FileText className="w-5 h-5 text-primary" /> Consumption History Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!history || history.length === 0 ? (
                                <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-2">
                                        <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-bold font-heading text-foreground">No Document History</h3>
                                    <p>This user has not accessed any secure materials yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/30 font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 whitespace-nowrap">Document Title</th>
                                                <th className="px-6 py-4 whitespace-nowrap">Domain</th>
                                                <th className="px-6 py-4 whitespace-nowrap">Progress</th>
                                                <th className="px-6 py-4 whitespace-nowrap">Time Invested</th>
                                                <th className="px-6 py-4 whitespace-nowrap">Last Accessed</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {history.map((mat) => (
                                                <tr key={mat.id} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-6 py-5 font-medium text-foreground max-w-[300px] truncate">
                                                        {mat.title}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{mat.subject_name}</span>
                                                            <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block w-max">SEM {mat.semester_number}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                                                    <div
                                                                        className={`h-full ${mat.completion_percentage > 80 ? 'bg-emerald-500' : mat.completion_percentage > 30 ? 'bg-amber-500' : 'bg-primary'}`}
                                                                        style={{ width: `${Math.min(100, Math.round(mat.completion_percentage))}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] font-mono tracking-widest font-bold text-muted-foreground">
                                                                    {Math.round(mat.completion_percentage)}%
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                                Pg {mat.last_page} / {mat.total_pages || '?'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 font-mono text-muted-foreground font-semibold">
                                                        {formatTime(mat.total_time_spent)}
                                                    </td>
                                                    <td className="px-6 py-5 font-mono text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(mat.last_opened), { addSuffix: true })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    )
}
