"use client"

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { Users, BookOpen, Activity, ShieldAlert, Upload, FileIcon, Loader2, Trash2, Edit3, ExternalLink, Check, AlertCircle, Info } from 'lucide-react'
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

    // Edit state
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
    const [editData, setEditData] = useState({ title: '', description: '' })

    // Delete confirmation state
    const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin", "analytics"],
        queryFn: () => apiClient<TelemetryStats>('/admin/telemetry'),
        refetchInterval: 15000 // 15s real-time pulse
    })

    const { data: allMaterials = [], isLoading: materialsLoading } = useQuery({
        queryKey: ["admin", "materials", "all"],
        queryFn: () => apiClient<Material[]>('/materials?admin=true')
    })

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            return await apiClient('/admin/materials', {
                method: 'POST',
                body: formData
            })
        },
        onSuccess: () => {
            toast.success('Material deployed successfully')
            queryClient.invalidateQueries({ queryKey: ["admin", "materials", "all"] })
            queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] })
            setUploadForm({ title: '', description: '', youtube_url: '', semester: '2', subject: 'int306', category: 'notes', unit: '' })
            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await apiClient(`/admin/materials/${id}`, { method: 'DELETE' })
        },
        onSuccess: () => {
            toast.success('Material purged from pipeline and R2 storage')
            queryClient.invalidateQueries({ queryKey: ["admin", "materials", "all"] })
            queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] })
            setDeletingMaterial(null)
            setDeleteConfirmText('')
        },
        onError: (err: any) => toast.error(err.message || 'Purge failed')
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            return await apiClient(`/admin/materials/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            })
        },
        onSuccess: () => {
            toast.success('Metadata updated successfully')
            queryClient.invalidateQueries({ queryKey: ["admin", "materials", "all"] })
            queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] })
            setEditingMaterial(null)
        },
        onError: (err: any) => toast.error(err.message || 'Update failed')
    })

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!uploadForm.title || uploadForm.title.length < 5) {
            toast.error('Material title must be at least 5 characters')
            return
        }

        if (!file && !uploadForm.youtube_url) {
            toast.error('You must provide either a PDF Document or a YouTube URL')
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

    const handleEditSave = () => {
        if (!editingMaterial) return
        updateMutation.mutate({ id: editingMaterial.id, data: editData })
    }

    if (statsLoading || materialsLoading) {
        return <div className="page-container"><DashboardSkeleton /></div>
    }

    const materialsArray = Array.isArray(allMaterials) ? allMaterials : []
    const groupedMaterials = materialsArray.reduce((acc: any, mat) => {
        const sem = mat.semester_number?.toString() || 'Unknown'
        const sub = mat.subject_name || 'Unknown'
        const cat = mat.category || 'notes'
        if (!acc[sem]) acc[sem] = {}
        if (!acc[sem][sub]) acc[sem][sub] = {}
        if (!acc[sem][sub][cat]) acc[sem][sub][cat] = []
        acc[sem][sub][cat].push(mat)
        return acc
    }, {})

    return (
        <div className="min-h-screen pb-20 pt-8 bg-[#F8FAFC] dark:bg-[#06080C] selection:bg-primary/20">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="page-container max-w-[1400px]">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
                            Command Center <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono animate-pulse">LIVE</span>
                        </h1>
                        <p className="text-muted-foreground font-medium mt-1">Platform intelligence, data governance, and secure R2 deployment.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => router.push('/admin/users')}
                            variant="outline"
                            className="h-11 px-6 rounded-2xl bg-surface border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all font-bold text-xs uppercase tracking-widest gap-2"
                        >
                            <Users className="w-4 h-4" /> User Analytics
                        </Button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                    {[
                        { label: 'Platform Users', val: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Active Materials', val: stats?.totalMaterials || 0, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                        { label: 'Knowledge Throughput', val: stats?.totalViews || 0, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Real-time Sessions', val: stats?.activeUsers || 0, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        { label: 'Risk Telemetry', val: stats?.flaggedUsers || 0, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    ].map((stat, i) => (
                        <motion.div key={i} variants={itemVariants}>
                            <Card className="border-none shadow-sm dark:shadow-none bg-surface/50 backdrop-blur-xl rounded-[28px] overflow-hidden group hover:ring-1 ring-primary/20 transition-all">
                                <CardContent className="p-6">
                                    <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-3xl font-heading font-black tracking-tighter mb-1">{stat.val.toLocaleString()}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left: Material Tree */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-heading font-bold text-foreground">Active Architecture Tree</h2>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1 rounded-full">
                                {materialsArray.length} Nodes Indexed
                            </div>
                        </div>

                        <div className="space-y-8">
                            {Object.keys(groupedMaterials).length === 0 ? (
                                <Card className="border-dashed border-2 border-border/50 bg-transparent rounded-[32px] p-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center mb-6">
                                        <Info className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Architecture Empty</h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto">Upload documents to populate the academic graph.</p>
                                </Card>
                            ) : (
                                Object.keys(groupedMaterials).sort().map(sem => (
                                    <motion.div key={sem} variants={itemVariants} className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                            <span className="text-sm font-black text-primary px-4 py-1.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">SEMESTER {sem}</span>
                                            <div className="h-0.5 flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 pl-2">
                                            {Object.keys(groupedMaterials[sem]).sort().map(subject => (
                                                <div key={subject} className="space-y-4 relative">
                                                    <div className="absolute left-0 top-4 bottom-0 w-px bg-border/40 ml-4" />
                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground pl-10 flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-primary" /> {subject}
                                                    </h4>

                                                    <div className="pl-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {Object.keys(groupedMaterials[sem][subject]).map(cat => (
                                                            groupedMaterials[sem][subject][cat].map((mat: Material) => (
                                                                <Card key={mat.id} className="group border-[0.5px] border-border/40 bg-surface/30 backdrop-blur-md rounded-[24px] overflow-hidden hover:border-primary/40 hover:bg-surface transition-all duration-300 shadow-sm hover:shadow-xl">
                                                                    <div className="p-5">
                                                                        <div className="flex items-start justify-between gap-4 mb-3">
                                                                            <div className="space-y-1 overflow-hidden">
                                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-tighter border border-indigo-500/20">{mat.category}</span>
                                                                                    {mat.unit && <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-tighter border border-emerald-500/20">U{mat.unit}</span>}
                                                                                </div>
                                                                                <h5 className="font-bold text-[15px] text-foreground leading-tight truncate px-1 group-hover:text-primary transition-colors">{mat.title}</h5>
                                                                            </div>
                                                                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500"
                                                                                    onClick={(e) => { e.stopPropagation(); setDeletingMaterial(mat); }}
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditingMaterial(mat);
                                                                                        setEditData({ title: mat.title, description: mat.description || '' });
                                                                                    }}
                                                                                >
                                                                                    <Edit3 className="w-4 h-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/20">
                                                                            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground font-mono">
                                                                                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {mat.total_views || 0}</span>
                                                                                <span className="opacity-30">|</span>
                                                                                <span>{mat.created_at || mat.createdAt ? new Date(mat.created_at || mat.createdAt || "").toLocaleDateString() : 'Recent'}</span>
                                                                            </div>
                                                                            <Button variant="ghost" size="sm" className="h-7 w-7 rounded-lg hover:bg-primary/10 text-primary p-0">
                                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </Card>
                                                            ))
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Upload Pipeline */}
                    <div className="lg:col-span-12 xl:col-span-4">
                        <div className="sticky top-8">
                            <Card className="border-none shadow-xl bg-surface rounded-[32px] overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary border border-primary/20">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-2xl font-black font-heading leading-tight italic">Dispatch New Resources</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">SECURE R2 PIPELINE</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 pt-4">
                                    <form onSubmit={handleUploadSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="div-bg p-4 rounded-2xl bg-muted/20 border border-border/50">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Classification Metadata</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <select
                                                        value={uploadForm.semester}
                                                        onChange={e => {
                                                            const semester = e.target.value;
                                                            const subject = subjectMap[semester] ? subjectMap[semester][0].slug : 'generic';
                                                            setUploadForm({ ...uploadForm, semester, subject });
                                                        }}
                                                        className="w-full h-10 px-3 rounded-xl border border-border/50 bg-background/50 text-xs font-bold focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s.toString()}>SEM {s}</option>)}
                                                    </select>
                                                    <select
                                                        value={uploadForm.category}
                                                        onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                                                        className="w-full h-10 px-3 rounded-xl border border-border/50 bg-background/50 text-xs font-bold focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                                    >
                                                        <option value="notes">NOTES</option>
                                                        <option value="pyqs">PYQS</option>
                                                        <option value="midterm">MID TERM</option>
                                                        <option value="ca">CA / ST</option>
                                                    </select>
                                                </div>
                                                <select
                                                    value={uploadForm.subject}
                                                    onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })}
                                                    className="w-full h-10 px-3 rounded-xl border border-border/50 bg-background/50 text-[10px] font-black tracking-tighter uppercase mt-3 focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                                >
                                                    {subjectMap[uploadForm.semester]?.map(sub => <option key={sub.slug} value={sub.slug}>{sub.name}</option>)}
                                                </select>
                                                {uploadForm.category === 'notes' && (
                                                    <select
                                                        value={uploadForm.unit}
                                                        onChange={e => setUploadForm({ ...uploadForm, unit: e.target.value })}
                                                        style={{ colorScheme: 'dark' }}
                                                        className="w-full h-10 px-3 rounded-xl border border-border/50 bg-background/50 text-xs font-bold mt-3 focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                                    >
                                                        <option value="">— Select Unit —</option>
                                                        <option value="overview">Overview (Syllabus / General)</option>
                                                        <option value="1">Unit 1</option>
                                                        <option value="2">Unit 2</option>
                                                        <option value="3">Unit 3</option>
                                                        <option value="4">Unit 4</option>
                                                        <option value="5">Unit 5</option>
                                                        <option value="6">Unit 6</option>
                                                    </select>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Display Vector</Label>
                                                <Input
                                                    placeholder="Aesthetic Material Title..."
                                                    value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                                    className="h-12 bg-muted/10 border-border/40 rounded-2xl px-5 text-sm font-bold shadow-inner"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Narrative Context</Label>
                                                <textarea
                                                    placeholder="Detailed description for the student dashboard..."
                                                    value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                                                    className="w-full min-h-[100px] bg-muted/10 border-border/40 rounded-2xl p-5 text-sm font-medium shadow-inner focus:ring-1 ring-primary/40 outline-none transition-all resize-none"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Media Injection</Label>
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div className="relative group">
                                                        <Input
                                                            placeholder="YouTube URL..."
                                                            value={uploadForm.youtube_url} onChange={e => setUploadForm({ ...uploadForm, youtube_url: e.target.value })}
                                                            className="h-11 bg-muted/10 border-border/40 rounded-xl px-5 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="h-20 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-all group overflow-hidden"
                                                    >
                                                        <Input
                                                            ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
                                                            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                                        />
                                                        {file ? (
                                                            <div className="flex items-center gap-2 text-primary">
                                                                <Check className="w-5 h-5" />
                                                                <span className="text-xs font-black truncate max-w-[200px]">{file.name}</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <FileIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2 group-hover:text-foreground">Attach PDF Payload</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={uploadMutation.isPending}
                                            className="w-full h-14 bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.2em] rounded-[20px] shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                                        >
                                            {uploadMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'INITIATE DEPLOYMENT'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* --- Modals & Overlays --- */}

                {/* Delete Confirmation Overlay */}
                <AnimatePresence>
                    {deletingMaterial && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setDeletingMaterial(null)}
                                className="absolute inset-0 bg-background/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="w-full max-w-md bg-surface border border-rose-500/20 rounded-[32px] overflow-hidden shadow-2xl relative z-10 p-8 text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black font-heading tracking-tight mb-2 italic">Purge Material?</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                    You are about to permanently delete <span className="text-foreground font-bold italic line-through">"{deletingMaterial.title}"</span>.
                                    This will erase the document from R2 storage and the academic index for all users.
                                </p>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type "DELETE" to confirm purge</Label>
                                        <Input
                                            value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                                            className="h-12 bg-rose-500/5 border-rose-500/20 text-center font-mono font-bold tracking-[0.5em] focus-visible:ring-rose-500/40"
                                            placeholder="..."
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button variant="ghost" onClick={() => setDeletingMaterial(null)} className="flex-1 h-12 rounded-2xl font-bold">Abort</Button>
                                        <Button
                                            variant="destructive"
                                            disabled={deleteConfirmText !== 'DELETE' || deleteMutation.isPending}
                                            onClick={() => deleteMutation.mutate(deletingMaterial.id)}
                                            className="flex-1 h-12 rounded-2xl font-black text-xs tracking-widest shadow-lg shadow-rose-500/20"
                                        >
                                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CONFIRM PURGE'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Inline Edit Overlay */}
                <AnimatePresence>
                    {editingMaterial && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setEditingMaterial(null)}
                                className="absolute inset-0 bg-background/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="w-full max-w-lg bg-surface border border-primary/20 rounded-[32px] overflow-hidden shadow-2xl relative z-10 p-8"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black font-heading tracking-tight italic">Refine Metadata</h3>
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-0.5">Editing Node: {editingMaterial.id.substring(0, 8)}...</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Resource Title</Label>
                                        <Input
                                            value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })}
                                            className="h-12 bg-muted/10 border-border/40 rounded-2xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Resource Narrative</Label>
                                        <textarea
                                            value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })}
                                            className="w-full min-h-[120px] bg-muted/10 border-border/40 rounded-2xl p-5 text-sm font-medium focus:ring-1 ring-primary/40 outline-none transition-all resize-none shadow-inner"
                                            placeholder="Update the description..."
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <Button variant="ghost" onClick={() => setEditingMaterial(null)} className="h-12 rounded-2xl font-bold flex-1">Nevermind</Button>
                                        <Button
                                            onClick={handleEditSave}
                                            disabled={updateMutation.isPending}
                                            className="h-12 rounded-2xl font-black text-xs tracking-[0.2em] flex-2 bg-primary shadow-lg shadow-primary/20"
                                        >
                                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE CHANGES'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    )
}

interface Material {
    id: string;
    semester_number?: number;
    subject_name?: string;
    category?: string;
    unit?: string;
    title: string;
    description?: string;
    total_views?: string | number;
    viewCount?: number;
    created_at?: string;
    createdAt?: string;
}

