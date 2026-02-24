"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { Users, Search, Clock, BookOpen, ChevronRight, Activity } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

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
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
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
        staleTime: 30000,
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

    return (
        <div className="min-h-screen pb-20 pt-8 bg-[#F8FAFC] dark:bg-[#080B11] selection:bg-primary/20">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="page-container max-w-[1400px]">

                {/* Header Strip */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-border/50">
                    <div>
                        <div className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-muted-foreground mb-4">
                            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.push('/admin')}>Command Center</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-primary">User Analytics</span>
                        </div>
                        <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">Audience Telemetry</h1>
                        <p className="text-muted-foreground font-medium">Track engagement, intercept abuse, and monitor global reading depths.</p>
                    </div>
                </div>

                {/* Search Bar */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by email or name..."
                            className="pl-10 h-12 bg-surface border-border/50 text-base rounded-2xl shadow-sm focus-visible:ring-primary/20"
                        />
                    </div>
                </motion.div>

                {/* Users Table */}
                <motion.div variants={itemVariants}>
                    <Card className="bg-surface border-border/50 overflow-hidden rounded-[24px] soft-shadow min-h-[500px]">
                        <CardHeader className="border-b border-border/40 bg-muted/10 p-5 px-6">
                            <CardTitle className="flex items-center gap-2 text-[17px] font-heading font-bold text-foreground">
                                <Users className="w-5 h-5 text-primary" /> Active Profiles Directory
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-6">
                                    <DashboardSkeleton />
                                </div>
                            ) : isError ? (
                                <div className="p-16 text-center text-red-500 font-bold">Failed to load user analytics matrix. Check your permissions.</div>
                            ) : !users || users.length === 0 ? (
                                <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-2">
                                        <Search className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-bold font-heading text-foreground">No Users Found</h3>
                                    <p>Try adjusting your search query.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/30 font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 rounded-tl-xl whitespace-nowrap">Identity</th>
                                                <th className="px-6 py-4 whitespace-nowrap">Clearance</th>
                                                <th className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Opened</div></th>
                                                <th className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Read Time</div></th>
                                                <th className="px-6 py-4 whitespace-nowrap">Depth</th>
                                                <th className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> Last Ping</div></th>
                                                <th className="px-6 py-4 rounded-tr-xl"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {users.map((user) => (
                                                <tr
                                                    key={user.id}
                                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                                    className={`hover:bg-muted/30 cursor-pointer transition-colors group ${user.is_blocked ? 'opacity-50' : ''}`}
                                                >
                                                    <td className="px-6 py-5 font-medium text-foreground">
                                                        <div className="flex flex-col">
                                                            <span>{user.name || 'Anonymous'}</span>
                                                            <span className="text-xs text-muted-foreground font-mono mt-0.5">{user.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                                                            user.is_blocked ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                                'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                            }`}>
                                                            {user.is_blocked ? 'SUSPENDED' : user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 font-mono text-muted-foreground font-semibold">
                                                        {user.total_materials_opened}
                                                    </td>
                                                    <td className="px-6 py-5 font-mono text-muted-foreground font-semibold">
                                                        {formatTime(user.total_time_spent)}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                                                <div
                                                                    className={`h-full ${Number(user.completion_rate) > 80 ? 'bg-emerald-500' : Number(user.completion_rate) > 30 ? 'bg-amber-500' : 'bg-primary'}`}
                                                                    style={{ width: `${Math.min(100, Math.round(Number(user.completion_rate)))}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-mono tracking-widest font-bold text-muted-foreground">
                                                                {Math.round(Number(user.completion_rate))}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 font-mono text-xs text-muted-foreground">
                                                        {user.last_active ? new Date(user.last_active).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <Button variant="ghost" size="icon" className="group-hover:bg-primary/10 group-hover:text-primary rounded-xl transition-all">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
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
