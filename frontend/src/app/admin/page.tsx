"use client"

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { Users, BookOpen, Activity, ShieldAlert, Upload, FileIcon, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
}

// Subject Mappings for Admin Upload
const subjectMap: Record<string, { slug: string, name: string }[]> = {
    "2": [
        { slug: "int306", name: "INT306 - Internet and Web Designing" },
        { slug: "phy110", name: "PHY110 - Engineering Physics" },
        { slug: "cse121", name: "CSE121 - Object Oriented Programming" },
        { slug: "cse101", name: "CSE101 - Computer Programming" },
        { slug: "mec136", name: "MEC136 - Engineering Graphics" },
        { slug: "cse320", name: "CSE320 - Software Engineering" },
        { slug: "pel121", name: "PEL121 - Communication Skills I" },
        { slug: "pel125", name: "PEL125 - Communication Skills II" },
        { slug: "pel130", name: "PEL130 - Communication Skills III" },
        { slug: "ece249", name: "ECE249 - Basic Electrical & Electronics" },
        { slug: "che110", name: "CHE110 - Environmental Sciences" },
        { slug: "mth166", name: "MTH166 - Mathematics" }
    ],
    "4": [
        { slug: "data-structures", name: "Data Structures" },
        { slug: "operating-systems", name: "Operating Systems" },
        { slug: "database-management", name: "Database Management" },
        { slug: "computer-networks", name: "Computer Networks" },
        { slug: "software-engineering", name: "Software Engineering" },
        { slug: "theory-of-computation", name: "Theory of Computation" }
    ]
}

interface TelemetryStats {
    totalUsers: number;
    totalMaterials: number;
    totalViews: number;
    activeUsers: number;
    flaggedUsers: number;
}

interface Material {
    id: string;
    semester_number?: number;
    subject_name?: string;
    category?: string;
    unit?: string;
    title: string;
    viewCount?: number;
    total_views?: string | number;
    created_at?: string;
    createdAt?: string;
}

export default function AdminDashboard() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        youtube_url: '',
        semester: '2',
        subject: 'int306',
        category: 'notes',
        unit: ''
    })
    const [file, setFile] = useState<File | null>(null)

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin", "analytics"],
        queryFn: () => apiClient<TelemetryStats>('/admin/telemetry')
    })

    // Fetch materials to display in grouped lists
    const { data: allMaterials = [], isLoading: materialsLoading } = useQuery({
        queryKey: ["admin", "materials", "all"],
        queryFn: () => apiClient<Material[]>('/materials?admin=true') // Standard query block generic
    })

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            return await apiClient('/admin/materials', {
                method: 'POST',
                body: formData
            })
        },
        onSuccess: () => {
            toast.success('Material deployed successfully to R2 pipeline')
            queryClient.invalidateQueries({ queryKey: ["admin", "materials", "all"] })
            queryClient.invalidateQueries({ queryKey: ["materials", uploadForm.semester, uploadForm.subject, uploadForm.category] })

            // Reset state natively
            setUploadForm({ title: '', description: '', youtube_url: '', semester: '2', subject: 'int306', category: 'notes', unit: '' })
            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    })

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!uploadForm.title || !uploadForm.description || (!file && !uploadForm.youtube_url)) {
            toast.error('You must provide either a PDF Document or a YouTube URL (or both)')
            return
        }

        const formData = new FormData()
        formData.append('title', uploadForm.title)
        formData.append('description', uploadForm.description)
        formData.append('semester', uploadForm.semester)
        formData.append('subject', uploadForm.subject)
        formData.append('category', uploadForm.category)
        if (uploadForm.unit) formData.append('unit', uploadForm.unit)
        if (uploadForm.youtube_url) formData.append('youtube_url', uploadForm.youtube_url)
        if (file) formData.append('file', file)

        uploadMutation.mutate(formData)
    }

    if (statsLoading || materialsLoading) {
        return <div className="page-container pt-8"><DashboardSkeleton /></div>
    }

    // Grouping Materials By Semester -> Subject -> Category -> Unit purely mathematically
    const materialsArray = Array.isArray(allMaterials) ? allMaterials : []

    const groupedMaterials = materialsArray.reduce((acc: Record<string, Record<string, Record<string, Record<string, Material[]>>>>, mat) => {
        const sem = mat.semester_number?.toString() || 'Unknown'
        const sub = mat.subject_name || 'Unknown'
        const cat = mat.category || 'notes'
        const unit = mat.unit || 'general'

        if (!acc[sem]) acc[sem] = {}
        if (!acc[sem][sub]) acc[sem][sub] = {}
        if (!acc[sem][sub][cat]) acc[sem][sub][cat] = {}
        if (!acc[sem][sub][cat][unit]) acc[sem][sub][cat][unit] = []

        acc[sem][sub][cat][unit].push(mat)
        return acc
    }, {})

    return (
        <div className="min-h-screen pb-20 pt-8 bg-[#F8FAFC] dark:bg-[#080B11] selection:bg-primary/20">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="page-container max-w-[1400px]">

                {/* Header Strip */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-border/50">
                    <div>
                        <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">Command Center</h1>
                        <p className="text-muted-foreground font-medium">Aggregated platform health, metrics, and data operations pipeline.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3">
                        <Button
                            onClick={() => router.push('/admin/users')}
                            variant="outline"
                            className="bg-surface border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all font-bold text-xs uppercase tracking-widest gap-2"
                        >
                            <Users className="w-4 h-4" />
                            User Analytics
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20 text-primary text-sm font-bold">
                            <Activity className="w-4 h-4 animate-pulse" /> Live Telemetry Linked
                        </div>
                    </div>
                </div>

                {/* Core Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                    {[
                        { tag: 'Total Users', val: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', path: '/admin/users' },
                        { tag: 'Active Materials', val: stats?.totalMaterials || 0, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
                        { tag: 'Global Views', val: stats?.totalViews || 0, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                        { tag: 'Active Sessions', val: stats?.activeUsers || 0, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
                        { tag: 'Flagged IPs', val: stats?.flaggedUsers || 0, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', path: '/admin/users?filter=flagged' }
                    ].map((stat, i) => (
                        <motion.div key={i} variants={itemVariants}>
                            <Card
                                onClick={() => stat.path && router.push(stat.path)}
                                className={`h-full bg-surface border-border/50 soft-shadow transition-all rounded-[20px] ${stat.path ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg hover:-translate-y-1' : 'hover:border-border hover:shadow-md'}`}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.tag}</CardTitle>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-heading font-black">{stat.val}</div>
                                    {stat.path && (
                                        <div className="mt-2 text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Details
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Data Tables Pipeline */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                        <Card className="bg-surface border-border/50 soft-shadow overflow-hidden rounded-[24px]">
                            <CardHeader className="border-b border-border/40 bg-muted/10 p-5">
                                <CardTitle className="flex items-center gap-2 text-[17px] font-heading font-bold text-foreground">
                                    <BookOpen className="w-5 h-5 text-primary" /> Active Document Architecture Tree
                                </CardTitle>
                            </CardHeader>
                            <div className="w-full overflow-x-auto p-4 flex flex-col gap-6">
                                {Object.keys(groupedMaterials).length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No documents uploaded to pipeline yet.</div>
                                ) : (
                                    Object.keys(groupedMaterials).sort().map(semester => (
                                        <div key={semester} className="space-y-4">
                                            <div className="bg-primary/5 border border-primary/20 px-4 py-2 rounded-lg font-heading font-bold text-primary">
                                                Semester {semester}
                                            </div>
                                            <div className="pl-6 space-y-6">
                                                {Object.keys(groupedMaterials[semester]).sort().map(subject => (
                                                    <div key={subject}>
                                                        <div className="text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground mb-3">{subject}</div>
                                                        <div className="pl-4 space-y-4">
                                                            {Object.keys(groupedMaterials[semester][subject]).sort().map(cat => (
                                                                <div key={cat}>
                                                                    <div className="text-xs font-bold font-mono text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded inline-block uppercase tracking-wider mb-2">{cat}</div>
                                                                    <div className="pl-4 space-y-4">
                                                                        {Object.keys(groupedMaterials[semester][subject][cat]).sort().map(unit => (
                                                                            <div key={unit}>
                                                                                <div className="text-[10px] font-bold font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded inline-block uppercase tracking-wider mb-2">Unit: {unit}</div>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                                                                                    {groupedMaterials[semester][subject][cat][unit].map((mat) => (
                                                                                        <div key={mat.id} className="p-3 bg-muted/30 border border-border rounded-xl text-sm flex flex-col justify-between">
                                                                                            <div className="font-semibold text-foreground truncate">{mat.title}</div>
                                                                                            <div className="text-xs text-muted-foreground flex justify-between mt-2">
                                                                                                <span>Views: {mat.total_views || mat.viewCount || 0}</span>
                                                                                                <span className="font-mono">{new Date(mat.created_at || mat.createdAt || new Date()).toLocaleDateString()}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Right Column: Upload Forms & Logs */}
                    <motion.div variants={itemVariants} className="space-y-8">
                        <Card className="bg-surface border-border/50 soft-shadow rounded-[24px] overflow-hidden">
                            <CardHeader className="border-b border-border/40 bg-muted/10 p-5">
                                <CardTitle className="flex items-center gap-2 text-[17px] font-heading font-bold text-foreground">
                                    <Upload className="w-5 h-5 text-primary" /> R2 Upload Pipeline
                                </CardTitle>
                                <CardDescription className="font-medium">Push secure documents natively.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleUploadSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Semester</Label>
                                            <select
                                                value={uploadForm.semester}
                                                onChange={e => {
                                                    const semester = e.target.value;
                                                    const subject = subjectMap[semester] ? subjectMap[semester][0].slug : 'generic';
                                                    setUploadForm({ ...uploadForm, semester, subject });
                                                }}
                                                disabled={uploadMutation.isPending}
                                                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                                    <option key={s} value={s.toString()}>Semester {s}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Category</Label>
                                            <select
                                                value={uploadForm.category}
                                                onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                                                disabled={uploadMutation.isPending}
                                                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            >
                                                <option value="notes">Notes</option>
                                                <option value="ppt">Presentations</option>
                                                <option value="pyqs">PYQs</option>
                                                <option value="midterm">Mid Terms</option>
                                                <option value="ca">Continuous Assessment (CA)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Unit</Label>
                                            <select
                                                value={uploadForm.unit}
                                                onChange={e => setUploadForm({ ...uploadForm, unit: e.target.value })}
                                                disabled={uploadMutation.isPending}
                                                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            >
                                                <option value="">General / Extracurricular</option>
                                                <option value="1">Unit 1</option>
                                                <option value="2">Unit 2</option>
                                                <option value="3">Unit 3</option>
                                                <option value="4">Unit 4</option>
                                                <option value="5">Unit 5</option>
                                                <option value="6">Unit 6</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Subject Route</Label>
                                        <select
                                            value={uploadForm.subject}
                                            onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })}
                                            disabled={uploadMutation.isPending}
                                            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        >
                                            {subjectMap[uploadForm.semester] ? (
                                                subjectMap[uploadForm.semester].map(sub => (
                                                    <option key={sub.slug} value={sub.slug}>{sub.name}</option>
                                                ))
                                            ) : (
                                                <option value="generic">Generic Subject (Placeholder)</option>
                                            )}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Title</Label>
                                        <Input
                                            value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                            placeholder="Unit 1 Foundations..."
                                            disabled={uploadMutation.isPending}
                                            className="h-10 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Description</Label>
                                        <Input
                                            value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                                            placeholder="Deep dive into mathematical matrices..."
                                            disabled={uploadMutation.isPending}
                                            className="h-10 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold tracking-wide uppercase text-muted-foreground">YouTube Video URL (Optional)</Label>
                                        <Input
                                            value={uploadForm.youtube_url} onChange={e => setUploadForm({ ...uploadForm, youtube_url: e.target.value })}
                                            placeholder="https://youtu.be/..."
                                            disabled={uploadMutation.isPending}
                                            className="h-10 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold tracking-wide uppercase text-muted-foreground">PDF Document (Optional if video linked)</Label>
                                        <Input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="application/pdf"
                                            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                            disabled={uploadMutation.isPending}
                                            className="file:bg-muted file:text-muted-foreground file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 cursor-pointer"
                                        />
                                    </div>

                                    <Button type="submit" className="w-full h-11 rounded-xl font-bold mt-2" disabled={uploadMutation.isPending}>
                                        {uploadMutation.isPending ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pushing to Grid...</>
                                        ) : (
                                            <><FileIcon className="w-4 h-4 mr-2" /> Dispatch Material</>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                    </motion.div>

                </div>
            </motion.div>
        </div>
    )
}
