"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { Users, BookOpen, Activity, AlertTriangle, ShieldAlert } from 'lucide-react'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
}

export default function AdminDashboard() {
    const { data: stats, isLoading: loading } = useQuery({
        queryKey: ["admin", "analytics"],
        queryFn: () => apiClient<any>('/admin/telemetry')
    })

    if (loading) {
        return <div className="page-container pt-8"><DashboardSkeleton /></div>
    }

    return (
        <div className="min-h-screen pb-20 pt-8 bg-[#F8FAFC] dark:bg-[#080B11] selection:bg-primary/20">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="page-container max-w-[1400px]">

                {/* Header Strip */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-border/50">
                    <div>
                        <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">Command Center</h1>
                        <p className="text-muted-foreground font-medium">Aggregated platform health, metrics, and risk monitoring.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20 text-primary text-sm font-bold">
                        <Activity className="w-4 h-4 animate-pulse" /> Live Telemetry Linked
                    </div>
                </div>

                {/* Core Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                    {[
                        { tag: 'Total Users', val: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
                        { tag: 'Active Materials', val: stats?.totalMaterials || 0, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
                        { tag: 'Global Views', val: stats?.totalViews || 0, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                        { tag: 'Active Sessions', val: stats?.activeUsers || 0, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
                        { tag: 'Flagged IPs', val: stats?.flaggedUsers || 0, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' }
                    ].map((stat, i) => (
                        <motion.div key={i} variants={itemVariants}>
                            <Card className="h-full bg-surface border-border/50 soft-shadow transition-all hover:border-border hover:shadow-md rounded-[20px]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.tag}</CardTitle>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-heading font-black">{stat.val}</div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Primary Datatables Layout */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">

                        <Card className="bg-surface border-border/50 soft-shadow overflow-hidden rounded-[24px]">
                            <CardHeader className="border-b border-border/40 bg-muted/10 p-5">
                                <CardTitle className="flex items-center gap-2 text-[17px] font-heading font-bold text-foreground">
                                    <Users className="w-5 h-5 text-primary" /> Recent Identity Integrations
                                </CardTitle>
                            </CardHeader>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-sm text-left font-medium">
                                    <thead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground bg-background">
                                        <tr>
                                            <th className="px-6 py-4 border-b border-border/40">User Identity</th>
                                            <th className="px-6 py-4 border-b border-border/40">Role Authority</th>
                                            <th className="px-6 py-4 border-b border-border/40 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {/* Simulation Stub */}
                                        {[1, 2, 3].map((u) => (
                                            <tr key={u} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">U{u}</div>
                                                        <span className="font-semibold text-foreground">u123891{u}@lpu.in</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-muted text-muted-foreground border border-border/50">Student</span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Authorized
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <Card className="bg-surface border-border/50 soft-shadow overflow-hidden rounded-[24px]">
                            <CardHeader className="border-b border-border/40 bg-muted/10 p-5">
                                <CardTitle className="flex items-center gap-2 text-[17px] font-heading font-bold text-foreground">
                                    <BookOpen className="w-5 h-5 text-primary" /> Storage Index Sync Line
                                </CardTitle>
                            </CardHeader>
                            <div className="p-6">
                                <div className="w-full rounded-xl border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-muted/10">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                        <BookOpen className="w-6 h-6 text-primary" />
                                    </div>
                                    <h4 className="font-heading font-bold text-lg mb-1">Index Operations Disabled</h4>
                                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                        Manual R2 pipeline synchronization is restricted by IAM policies here natively.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Abuse Log Sidebar Structure */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-surface border-red-500/20 soft-shadow h-full rounded-[24px] overflow-hidden">
                            <CardHeader className="border-b border-red-500/10 bg-red-500/5 p-5">
                                <CardTitle className="flex items-center gap-2 text-[17px] font-heading font-bold text-red-500">
                                    <AlertTriangle className="w-5 h-5" /> Threat Traps
                                </CardTitle>
                            </CardHeader>
                            <div className="p-0">
                                <div className="divide-y divide-border/40">
                                    {/* Risk Events Block */}
                                    {[1, 2, 3, 4, 5].map((log) => (
                                        <div key={log} className="p-5 hover:bg-muted/30 transition-colors flex gap-4 items-start relative group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold mb-1 text-foreground leading-tight">Rate Limit Breached (IP: 142.250.xxx)</p>
                                                <p className="text-xs text-muted-foreground font-medium pr-2">Redis sliding window auto-blocked signature originating from aggressive scan attempt.</p>
                                                <p className="text-[10px] font-mono font-bold text-red-500/80 uppercase mt-2">T-{log}4 mins ago</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    )
}
