"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Users, FileText, AlertTriangle } from 'lucide-react'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'

type AdminStats = {
    total_users: number;
    total_materials: number;
    total_views: number;
    active_users_last_24h: number;
    suspicious_users_count: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await apiFetch<AdminStats>('/admin/dashboard')
                setStats(data)
            } catch (err) {
                console.error("Failed to load admin stats", err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-background p-6 pt-24">
            <div className="container mx-auto">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-background">
            {/* Admin Header */}
            <header className="h-16 border-b border-border/50 bg-card flex items-center px-6 sticky top-0 z-30">
                <h1 className="font-heading font-bold text-xl text-primary">Intelligence Console</h1>
            </header>

            <main className="container mx-auto px-6 py-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="soft-shadow border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                                <Users className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold font-mono">{stats?.total_users || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1 text-emerald-500">{stats?.active_users_last_24h || 0} active rolling 24h</p>
                            </CardContent>
                        </Card>

                        <Card className="soft-shadow border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Global Materials</CardTitle>
                                <FileText className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold font-mono">{stats?.total_materials || 0}</div>
                            </CardContent>
                        </Card>

                        <Card className="soft-shadow border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Access Events</CardTitle>
                                <Activity className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold font-mono">{stats?.total_views || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">across all resources</p>
                            </CardContent>
                        </Card>

                        <Card className="soft-shadow border-destructive/20 bg-destructive/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-destructive">Flagged Users</CardTitle>
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold font-mono text-destructive">{stats?.suspicious_users_count || 0}</div>
                                <p className="text-xs text-destructive/80 mt-1">pending review in abuse logs</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Module Sections Placeholder (Implementation ready for extension) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="min-h-[400px] border-border soft-shadow">
                            <CardHeader>
                                <CardTitle>Recent Abuses</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                                Connect to actual /admin/abuse endpoint
                            </CardContent>
                        </Card>
                        <Card className="min-h-[400px] border-border soft-shadow">
                            <CardHeader>
                                <CardTitle>System Load & Telemetry</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                                Connect to actual /health/worker metrics
                            </CardContent>
                        </Card>
                    </div>

                </motion.div>
            </main>
        </div>
    )
}
