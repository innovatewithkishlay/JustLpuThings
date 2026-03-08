"use client"

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { Users, BookOpen, Activity, ShieldAlert, Upload, FileIcon, Loader2, Trash2, Edit3, ExternalLink, Check, AlertCircle, Info, LayoutDashboard, Library, Settings2, CloudUpload, ChevronRight, Menu, X, ArrowUpRight, BarChart3, Fingerprint } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Premium Internal UI Components (Replacements for missing shadcn modules)
const Badge = ({ children, className = "", variant = "default" }: any) => {
    const variants: any = {
        default: "bg-primary/10 text-primary border-primary/20",
        outline: "border-border/50 text-muted-foreground",
        secondary: "bg-muted/10 text-muted-foreground border-border/40",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${variants[variant] || variants.default} ${className}`}>
            {children}
        </span>
    );
};

const TooltipProvider = ({ children }: any) => <>{children}</>;
const Tooltip = ({ children }: any) => <div className="relative group">{children}</div>;
const TooltipTrigger = ({ children, asChild }: any) => <>{children}</>;
const TooltipContent = ({ children, className = "", side = "top" }: any) => {
    const sideClasses: any = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
    };
    return (
        <div className={`absolute hidden group-hover:block z-[100] px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest pointer-events-none shadow-2xl whitespace-nowrap ${sideClasses[side] || sideClasses.top} ${className}`}>
            {children}
        </div>
    );
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
}

interface TelemetryStats {
    totalUsers: number;
    totalMaterials: number;
    totalViews: number;
    activeUsers: number;
    flaggedUsers: number;
    visitsToday: number;
    visitsYesterday: number;
    totalUniqueVisitors: number;
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

interface Subject {
    id: string;
    name: string;
    slug: string;
    semester_number: number;
}

interface Semester {
    number: number;
    is_active: boolean;
}

export default function AdminDashboard() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [activeView, setActiveView] = useState<'OVERVIEW' | 'LIBRARY' | 'REGISTRY' | 'DEPLOYMENT'>('OVERVIEW')
    const [isNavCollapsed, setIsNavCollapsed] = useState(false)

    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        youtube_url: '',
        semester: '2',
        subject: '',
        category: 'notes',
        unit: ''
    })
    const [file, setFile] = useState<File | null>(null)

    // Subject Management State
    const [newSubjectName, setNewSubjectName] = useState('')
    const [newSubjectSem, setNewSubjectSem] = useState('1')
    const [isAddingSubject, setIsAddingSubject] = useState(false)
    const [showSubjectConfirm, setShowSubjectConfirm] = useState(false)

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

    const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
        queryKey: ["admin", "subjects"],
        queryFn: () => apiClient<Subject[]>('/admin/subjects').then(res => res || [])
    })

    const { data: semesters = [], isLoading: semestersLoading } = useQuery({
        queryKey: ["admin", "semesters"],
        queryFn: () => apiClient<Semester[]>('/admin/subjects/semesters').then(res => res || [])
    })

    const toggleSemesterMutation = useMutation({
        mutationFn: async ({ number, isActive }: { number: number, isActive: boolean }) => {
            return await apiClient(`/admin/subjects/semesters/${number}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive })
            })
        },
        onSuccess: () => {
            toast.success('Semester status updated')
            queryClient.invalidateQueries({ queryKey: ["admin", "semesters"] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to update semester')
    })

    const createSubjectMutation = useMutation({
        mutationFn: async (data: { name: string, semesterNumber: number }) => {
            return await apiClient('/admin/subjects', {
                method: 'POST',
                body: JSON.stringify(data)
            })
        },
        onSuccess: () => {
            toast.success('Subject added to semester')
            queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] })
            setNewSubjectName('')
            setIsAddingSubject(false)
        },
        onError: (err: any) => toast.error(err.message || 'Failed to add subject')
    })

    const deleteSubjectMutation = useMutation({
        mutationFn: async (id: string) => {
            return await apiClient(`/admin/subjects/${id}`, { method: 'DELETE' })
        },
        onSuccess: () => {
            toast.success('Subject removed')
            queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] })
            queryClient.invalidateQueries({ queryKey: ["admin", "materials", "all"] })
        },
        onError: (err: any) => toast.error(err.message || 'Failed to remove subject')
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
            setUploadForm(prev => ({ ...prev, title: '', description: '', youtube_url: '', unit: '' }))
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

    const handleCreateSubject = () => {
        if (!newSubjectName || !newSubjectSem) return;
        const semNum = parseInt(newSubjectSem);
        const exists = subjects.some((s: Subject) =>
            s.name.toLowerCase() === newSubjectName.toLowerCase() &&
            s.semester_number === semNum
        );
        if (exists) {
            toast.error('Subject already exists in this semester');
            return;
        }
        setShowSubjectConfirm(true);
    };

    const materialsArray = Array.isArray(allMaterials) ? allMaterials : [];
    const groupedMaterials = materialsArray.reduce((acc: any, mat: Material) => {
        const sem = mat.semester_number || 'Unassigned';
        const sub = mat.subject_name || 'General';
        const cat = mat.category || 'other';
        if (!acc[sem]) acc[sem] = {};
        if (!acc[sem][sub]) acc[sem][sub] = {};
        if (!acc[sem][sub][cat]) acc[sem][sub][cat] = [];
        acc[sem][sub][cat].push(mat);
        return acc;
    }, {});

    const navItems = [
        { id: 'OVERVIEW', label: 'Command Center', icon: LayoutDashboard, desc: 'Platform Telemetry' },
        { id: 'LIBRARY', label: 'Architecture', icon: Library, desc: 'Material Index' },
        { id: 'REGISTRY', label: 'Subject Registry', icon: Settings2, desc: 'Academic Mappings' },
        { id: 'DEPLOYMENT', label: 'Deployment', icon: CloudUpload, desc: 'R2 Pipeline' },
    ] as const;

    if (statsLoading || materialsLoading) {
        return <div className="page-container"><DashboardSkeleton /></div>
    }

    return (
        <TooltipProvider>
            <div className="flex h-screen bg-[#FBFCFE] dark:bg-[#06080C] overflow-hidden selection:bg-primary/20">
                {/* Desktop Sidebar Rail */}
                <motion.aside
                    initial={false}
                    animate={{ width: isNavCollapsed ? 80 : 280 }}
                    className="hidden lg:flex flex-col border-r border-border/40 bg-white/50 dark:bg-black/20 backdrop-blur-xl relative z-50 overflow-hidden"
                >
                    <div className="p-6 flex items-center justify-between">
                        <AnimatePresence mode="wait">
                            {!isNavCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                        <ShieldAlert className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-heading font-black tracking-tighter text-xl italic uppercase">Admin<span className="text-primary italic">X</span></span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                            className="h-8 w-8 rounded-lg hover:bg-primary/5 text-muted-foreground"
                        >
                            {isNavCollapsed ? <Menu className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-180" />}
                        </Button>
                    </div>

                    <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                        {navItems.map((item) => (
                            <Tooltip key={item.id} delayDuration={isNavCollapsed ? 0 : 700}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setActiveView(item.id)}
                                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${activeView === item.id
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                            : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5 shrink-0" />
                                        {!isNavCollapsed && (
                                            <div className="flex flex-col items-start overflow-hidden text-left">
                                                <span className="text-sm font-black tracking-tight">{item.label}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${activeView === item.id ? 'text-primary-foreground/70' : ''}`}>{item.desc}</span>
                                            </div>
                                        )}
                                        {activeView === item.id && (
                                            <motion.div
                                                layoutId="activePill"
                                                className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                {isNavCollapsed && <TooltipContent side="right" className="font-bold text-xs">{item.label}</TooltipContent>}
                            </Tooltip>
                        ))}
                    </div>

                    <div className="p-6 border-t border-border/40 space-y-4">
                        <Button
                            onClick={() => router.push('/admin/users')}
                            variant="outline"
                            className={`w-full h-12 rounded-2xl border-border/50 hover:border-primary/50 gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${isNavCollapsed ? 'px-0 justify-center' : 'px-4'}`}
                        >
                            <Users className="w-4 h-4 text-blue-500" />
                            {!isNavCollapsed && <span>User Registry</span>}
                        </Button>
                    </div>
                </motion.aside>

                {/* Main Workspace Area */}
                <main className="flex-1 overflow-y-auto relative no-scrollbar bg-background">
                    <div className="max-w-[1600px] mx-auto p-6 md:p-10 lg:p-12 min-h-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeView}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-12"
                            >
                                {activeView === 'OVERVIEW' && (
                                    <div className="space-y-12">
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                            <div>
                                                <Badge className="mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary border-primary/20 space-x-2">
                                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                    <span className="font-mono text-[10px] font-black uppercase tracking-widest">System Monitor v4.2</span>
                                                </Badge>
                                                <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight italic">Global Telemetry</h1>
                                                <p className="text-muted-foreground font-medium mt-2 max-w-xl text-lg">Real-time platform intelligence and audience engagement vectors.</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <Button variant="outline" className="h-14 px-8 rounded-2xl bg-surface border-border/40 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 group">
                                                    <Fingerprint className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /> Access Logs
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                            {[
                                                { label: 'Total Nodes', val: stats?.totalMaterials || 0, icon: Library, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                                                { label: 'Today Visits', val: stats?.visitsToday || 0, icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-500/10', sub: `Yesterday: ${stats?.visitsYesterday || 0}` },
                                                { label: 'Unique Reach', val: stats?.totalUniqueVisitors || 0, icon: Fingerprint, color: 'text-purple-500', bg: 'bg-purple-500/10', sub: 'Lifetime' },
                                                { label: 'Security Alerts', val: stats?.flaggedUsers || 0, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                                            ].map((stat, i) => (
                                                <Card key={i} className="border-none shadow-premium bg-surface/50 backdrop-blur-xl rounded-[32px] overflow-hidden group hover:ring-1 ring-primary/20 transition-all">
                                                    <CardContent className="p-8">
                                                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                                                            <stat.icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-4xl font-heading font-black tracking-tighter mb-1">{stat.val.toLocaleString()}</div>
                                                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                                                        {stat.sub && (
                                                            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-muted-foreground/60 italic">
                                                                <ArrowUpRight className="w-3.5 h-3.5" /> {stat.sub}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'LIBRARY' && (
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-3xl font-heading font-black italic">Architecture Tree</h2>
                                                <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-1">{materialsArray.length} Nodes Indexed</p>
                                            </div>
                                        </div>

                                        <div className="space-y-10">
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
                                                    <div key={sem} className="space-y-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                                            <span className="text-sm font-black text-primary px-4 py-1.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">SEMESTER {sem}</span>
                                                            <div className="h-0.5 flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-8 pl-4 border-l border-border/20">
                                                            {Object.keys(groupedMaterials[sem]).sort().map(subject => (
                                                                <div key={subject} className="space-y-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{subject}</h4>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
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
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'REGISTRY' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Semester Intelligence Card */}
                                        <Card className="border-none shadow-xl bg-surface rounded-[32px] overflow-hidden">
                                            <CardHeader className="p-8 pb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                    <Activity className="w-6 h-6" />
                                                </div>
                                                <CardTitle className="text-2xl font-black font-heading leading-tight italic mt-6">Semester Control</CardTitle>
                                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">INDEX VISIBILITY</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 pt-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    {semesters.map((s: Semester) => (
                                                        <button
                                                            key={s.number}
                                                            onClick={() => toggleSemesterMutation.mutate({ number: s.number, isActive: !s.is_active })}
                                                            disabled={toggleSemesterMutation.isPending}
                                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${s.is_active
                                                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
                                                                : 'bg-muted/30 border-border/50 text-muted-foreground grayscale-[0.5]'
                                                                }`}
                                                        >
                                                            <span className="text-[10px] font-black uppercase">Sem {s.number}</span>
                                                            <div className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Subject Management Card */}
                                        <Card className="border-none shadow-xl bg-surface rounded-[32px] overflow-hidden">
                                            <CardHeader className="p-8 pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                                        <BookOpen className="w-6 h-6" />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setIsAddingSubject(!isAddingSubject)}
                                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                                                    >
                                                        {isAddingSubject ? 'Cancel' : 'Add Subject'}
                                                    </Button>
                                                </div>
                                                <CardTitle className="text-2xl font-black font-heading leading-tight italic mt-6">Academic Subjects</CardTitle>
                                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">DYNAMIC MAPPINGS</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 pt-4">
                                                <AnimatePresence mode="wait">
                                                    {isAddingSubject ? (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="space-y-4"
                                                        >
                                                            <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Select Active Semester</Label>
                                                                    <select
                                                                        value={newSubjectSem}
                                                                        onChange={e => setNewSubjectSem(e.target.value)}
                                                                        className="w-full h-10 px-3 rounded-xl border border-border/50 bg-background/50 text-xs font-bold focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                                                    >
                                                                        {semesters
                                                                            .filter((s: Semester) => s.is_active)
                                                                            .map((s: Semester) => <option key={s.number} value={s.number.toString()}>Semester {s.number}</option>)}
                                                                        {semesters.filter((s: Semester) => s.is_active).length === 0 && (
                                                                            <option value="" disabled>No active semesters</option>
                                                                        )}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Subject Name</Label>
                                                                    <Input
                                                                        placeholder="e.g. Mathematics III"
                                                                        value={newSubjectName}
                                                                        onChange={e => setNewSubjectName(e.target.value)}
                                                                        className="h-10 bg-background/50 border-border/40 rounded-xl px-4 text-xs font-bold"
                                                                    />
                                                                </div>
                                                                <Button
                                                                    onClick={handleCreateSubject}
                                                                    disabled={!newSubjectName || !newSubjectSem || createSubjectMutation.isPending}
                                                                    className="w-full h-10 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/20"
                                                                >
                                                                    {createSubjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Subject'}
                                                                </Button>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
                                                        >
                                                            {subjects.length === 0 ? (
                                                                <div className="text-center py-6 text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-50 italic">No Subjects Defined</div>
                                                            ) : (
                                                                subjects
                                                                    .sort((a, b) => a.semester_number - b.semester_number)
                                                                    .map((sub: Subject) => (
                                                                        <div key={sub.id} className="group flex items-center justify-between p-3 rounded-xl bg-muted/10 hover:bg-muted/30 transition-all border border-transparent hover:border-border/50">
                                                                            <div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Badge variant="outline" className="h-4 px-1 text-[8px] font-black">S{sub.semester_number}</Badge>
                                                                                    <div className="text-[11px] font-black text-foreground tracking-tight">{sub.name}</div>
                                                                                </div>
                                                                                <div className="text-[9px] font-mono text-muted-foreground opacity-60">/{sub.slug}</div>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => deleteSubjectMutation.mutate(sub.id)}
                                                                                className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    ))
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {activeView === 'DEPLOYMENT' && (
                                    <div className="max-w-4xl mx-auto">
                                        <Card className="border-none shadow-premium bg-surface rounded-[40px] overflow-hidden">
                                            <CardHeader className="p-10 pb-4">
                                                <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center mb-8 text-primary border border-primary/20 shadow-inner">
                                                    <Upload className="w-8 h-8" />
                                                </div>
                                                <CardTitle className="text-4xl font-black font-heading leading-tight italic">Resource Deployment</CardTitle>
                                                <CardDescription className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground pt-1">Cloudflare R2 Encapsulation Pipeline</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-10 pt-6">
                                                <form onSubmit={handleUploadSubmit} className="space-y-10">
                                                    <div className="space-y-8">
                                                        <div className="p-6 rounded-[28px] bg-muted/20 border border-border/50 space-y-6">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase">Phase 1: Architecture</Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Academic Semester</Label>
                                                                    <select
                                                                        value={uploadForm.semester}
                                                                        onChange={e => {
                                                                            const semester = e.target.value;
                                                                            setUploadForm({ ...uploadForm, semester, subject: '' });
                                                                        }}
                                                                        className="w-full h-12 px-4 rounded-2xl border border-border/50 bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer hover:border-primary/40"
                                                                    >
                                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s: number) => <option key={s} value={s.toString()}>SEMESTER {s}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Content Taxonomy</Label>
                                                                    <select
                                                                        value={uploadForm.category}
                                                                        onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                                                                        className="w-full h-12 px-4 rounded-2xl border border-border/50 bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer hover:border-primary/40"
                                                                    >
                                                                        <option value="notes">NOTES</option>
                                                                        <option value="pyqs">PYQS</option>
                                                                        <option value="midterm">MID TERM</option>
                                                                        <option value="ca">CA / ST</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Subject Node Mapping</Label>
                                                                <select
                                                                    value={uploadForm.subject}
                                                                    onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })}
                                                                    className="w-full h-12 px-4 rounded-2xl border border-border/50 bg-background text-[11px] font-black tracking-tighter uppercase focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer hover:border-primary/40"
                                                                >
                                                                    <option value="">— SELECT TARGET SUBJECT —</option>
                                                                    {subjects
                                                                        .filter((s: Subject) => s.semester_number.toString() === uploadForm.semester)
                                                                        .map((sub: Subject) => <option key={sub.id} value={sub.slug}>{sub.name}</option>)
                                                                    }
                                                                </select>
                                                            </div>
                                                            {uploadForm.category === 'notes' && (
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">LPU Unit Index</Label>
                                                                    <select
                                                                        value={uploadForm.unit}
                                                                        onChange={e => setUploadForm({ ...uploadForm, unit: e.target.value })}
                                                                        className="w-full h-12 px-4 rounded-2xl border border-border/50 bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer hover:border-primary/40"
                                                                    >
                                                                        <option value="">— SELECT UNIT (OPTIONAL) —</option>
                                                                        <option value="overview">Overview (Syllabus / General)</option>
                                                                        <option value="1">UNIT 1</option>
                                                                        <option value="2">UNIT 2</option>
                                                                        <option value="3">UNIT 3</option>
                                                                        <option value="4">UNIT 4</option>
                                                                        <option value="5">UNIT 5</option>
                                                                        <option value="6">UNIT 6</option>
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase">Phase 2: Metadata</Badge>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Display Title</Label>
                                                                <Input
                                                                    placeholder="Aesthetic Material Title..."
                                                                    value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                                                    className="h-14 bg-muted/5 border-border/40 rounded-2xl px-6 text-base font-bold shadow-inner focus-visible:ring-primary/20 transition-all"
                                                                />
                                                            </div>

                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Narrative Context</Label>
                                                                <textarea
                                                                    placeholder="Detailed description for the student dashboard..."
                                                                    value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                                                                    className="w-full min-h-[140px] bg-muted/5 border-border/40 rounded-2xl p-6 text-sm font-medium shadow-inner focus:ring-2 ring-primary/20 outline-none transition-all resize-none hover:border-primary/40"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase">Phase 3: Payload</Badge>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-3">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Instructional Video</Label>
                                                                    <Input
                                                                        placeholder="YouTube URL..."
                                                                        value={uploadForm.youtube_url} onChange={e => setUploadForm({ ...uploadForm, youtube_url: e.target.value })}
                                                                        className="h-12 bg-muted/5 border-border/40 rounded-xl px-5 text-xs font-mono"
                                                                    />
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">PDF Document</Label>
                                                                    <div
                                                                        onClick={() => fileInputRef.current?.click()}
                                                                        className="h-12 border-2 border-dashed border-border/50 rounded-xl flex items-center px-4 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all group overflow-hidden"
                                                                    >
                                                                        <Input
                                                                            ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
                                                                            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                                                        />
                                                                        {file ? (
                                                                            <div className="flex items-center gap-2 text-primary">
                                                                                <Check className="w-4 h-4" />
                                                                                <span className="text-[10px] font-black truncate max-w-[150px] uppercase">{file.name}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <FileIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-3 group-hover:text-foreground">Attach PDF Binary</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="submit"
                                                        disabled={uploadMutation.isPending}
                                                        className="w-full h-20 bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.4em] rounded-[24px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                                        {uploadMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'INITIATE FULL DEPLOYMENT'}
                                                    </Button>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* Overlays & Modals */}
                <AnimatePresence>
                    {showSubjectConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md bg-white dark:bg-[#0C0F14] rounded-[32px] p-10 shadow-2xl border border-border/40"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-8 mx-auto border border-indigo-500/20">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black font-heading text-center italic mb-4">Confirm Subject Registry</h3>
                                <p className="text-center text-muted-foreground font-medium mb-8">
                                    Are you sure you want to map <span className="text-foreground font-bold">"{newSubjectName}"</span> to <span className="text-foreground font-bold">Semester {newSubjectSem}</span>?
                                </p>
                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSubjectConfirm(false)}
                                        className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/50"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            createSubjectMutation.mutate({ name: newSubjectName, semesterNumber: parseInt(newSubjectSem) });
                                            setShowSubjectConfirm(false);
                                        }}
                                        className="flex-1 h-12 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                                    >
                                        Confirm Access
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {editingMaterial && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-2xl bg-white dark:bg-[#0C0F14] rounded-[40px] p-12 shadow-2xl border border-border/40"
                            >
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                            <Edit3 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black font-heading italic">Edit Metadata</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-1">MATERIAL ID: {editingMaterial.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingMaterial(null)} className="rounded-xl"><X className="w-5 h-5" /></Button>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Display Title</Label>
                                        <Input
                                            value={editData.title}
                                            onChange={e => setEditData({ ...editData, title: e.target.value })}
                                            className="h-14 bg-muted/20 border-border/40 rounded-2xl px-6 text-base font-bold shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Description</Label>
                                        <textarea
                                            value={editData.description}
                                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                                            className="w-full min-h-[160px] bg-muted/20 border-border/40 rounded-2xl p-6 text-sm font-medium shadow-inner outline-none resize-none"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleEditSave}
                                        disabled={updateMutation.isPending}
                                        className="w-full h-16 bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20"
                                    >
                                        {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Synchronize Changes'}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {deletingMaterial && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md bg-white dark:bg-[#0C0F14] rounded-[32px] p-10 shadow-2xl border border-border/40"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-8 mx-auto border border-rose-500/20">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black font-heading text-center italic mb-4">Critical Purge Operation</h3>
                                <p className="text-center text-muted-foreground font-medium mb-8">
                                    To purge <span className="text-foreground font-bold">"{deletingMaterial.title}"</span> from R2 and the database, type <span className="text-rose-500 font-black uppercase">DELETE</span> below.
                                </p>
                                <Input
                                    placeholder="TYPE DELETE TO CONFIRM"
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                                    className="h-12 bg-rose-500/5 border-rose-500/20 rounded-xl px-4 text-center text-xs font-black tracking-widest text-rose-600 mb-8 focus:ring-rose-500/20"
                                />
                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setDeletingMaterial(null); setDeleteConfirmText(''); }}
                                        className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                    >
                                        Abort
                                    </Button>
                                    <Button
                                        disabled={deleteConfirmText !== 'DELETE' || deleteMutation.isPending}
                                        onClick={() => deleteMutation.mutate(deletingMaterial.id)}
                                        className="flex-1 h-12 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:grayscale"
                                    >
                                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Execute Purge'}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </TooltipProvider>
    )
}

