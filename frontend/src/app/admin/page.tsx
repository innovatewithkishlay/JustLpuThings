"use client"

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { Loader2, Trash2, Edit3, Check, FileUp } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { AdminShell, AdminView, viewFromHash } from '@/components/app/AdminShell'
import { EmptyNote, Kicker, PageHead, SectionHead, Stat, Tag } from '@/components/app/Notebook'

interface TelemetryStats {
    totalUsers: number;
    totalMaterials: number;
    totalViews: number;
    activeUsers: number;
    flaggedUsers: number;
    visitsToday: number;
    visitsYesterday: number;
    totalUniqueVisitors: number;
    totalTraffic: number;
    trafficToday: number;
    totalSessions: number;
}

interface TrafficDay {
    date: string;
    totalHits: number;
    uniqueVisitors: number;
    newUsers: number;
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
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [activeView, setActiveView] = useState<AdminView>('OVERVIEW')

    // Sidebar links from other admin pages arrive as /admin#library etc.
    useEffect(() => {
        const sync = () => setActiveView(viewFromHash(window.location.hash))
        sync()
        window.addEventListener('hashchange', sync)
        return () => window.removeEventListener('hashchange', sync)
    }, [])
    const [isNavCollapsed, setIsNavCollapsed] = useState(false)
    const [isAdvancedAnalyticsOpen, setIsAnalyticsOpen] = useState(false)

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

    const { data: trafficHistory = [] } = useQuery({
        queryKey: ["admin", "traffic"],
        queryFn: () => apiClient<TrafficDay[]>('/admin/traffic?days=30'),
        refetchInterval: 60000 // 1 min refresh
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

    const selectView = (view: AdminView) => {
        setActiveView(view)
        const hash = view === 'OVERVIEW' ? '' : view === 'LIBRARY' ? '#library' : view === 'REGISTRY' ? '#registry' : '#upload'
        window.history.replaceState(null, '', `/admin${hash}`)
    }

    if (statsLoading || materialsLoading) {
        return <div className="page-container"><DashboardSkeleton /></div>
    }

    // Shared bits for the 30-day chart
    const days = trafficHistory as TrafficDay[]
    const maxHits = Math.max(...days.map(d => d.totalHits), 1)
    // Power scale so quiet days stay visible next to big peaks
    const scaleVal = (val: number) => Math.pow(val / maxHits, 0.45) * 100
    const sum = (k: keyof TrafficDay) => days.reduce((s, d) => s + (d[k] as number), 0)
    const shortDate = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(d).toLocaleDateString('en-IN', opts)

    const CATEGORY_LABEL: Record<string, string> = { notes: 'Notes', pyqs: 'End-term', midterm: 'Mid-term', ca: 'CA', ppt: 'Slides', syllabus: 'Syllabus', other: 'Other' }

    return (
        <AdminShell
            active={activeView as AdminView}
            onSelect={selectView}
            collapsed={isNavCollapsed}
            onToggleCollapsed={() => setIsNavCollapsed(!isNavCollapsed)}
        >
            {activeView === 'OVERVIEW' && (
                <div>
                    <PageHead
                        title={<>Overview</>}
                        sub="How the site is doing. These numbers refresh every 15 seconds."
                        actions={days.length > 0 ? (
                            <button type="button" onClick={() => setIsAnalyticsOpen(true)} className="app-btn-quiet">
                                Day-by-day table
                            </button>
                        ) : undefined}
                    />

                    <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 border-b border-border -mt-4">
                        <Stat label="Materials live" value={(stats?.totalMaterials || 0).toLocaleString('en-IN')} />
                        <Stat label="Visits, all time" value={(stats?.totalSessions || 0).toLocaleString('en-IN')} />
                        <Stat label="Visits today" value={(stats?.trafficToday || 0).toLocaleString('en-IN')} note={`${stats?.visitsToday || 0} unique`} />
                        <Stat label="Unique visitors" value={(stats?.totalUniqueVisitors || 0).toLocaleString('en-IN')} />
                        <Stat
                            label="Flagged accounts"
                            value={<span className={(stats?.flaggedUsers || 0) > 0 ? 'text-ink-red' : ''}>{stats?.flaggedUsers || 0}</span>}
                        />
                    </dl>

                    {days.length > 0 && (
                        <section className="mt-12" aria-label="Last 30 days">
                            <SectionHead
                                n="01"
                                title="Last 30 days"
                                aside={
                                    <span className="flex flex-wrap items-center gap-4 text-[13px]">
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-foreground" /> Visits</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-ink-blue" /> Unique</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-ink-red" /> Sign-ups</span>
                                    </span>
                                }
                            />

                            <div className="app-card p-5 sm:p-7">
                                <div className="relative flex items-end gap-[3px] sm:gap-1.5 h-60">
                                    <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                                        {[1, 0.5, 0].map((tick) => (
                                            <div key={tick} className="w-full border-t border-dashed border-border" />
                                        ))}
                                    </div>
                                    {days.map((day, i) => {
                                        const isToday = i === days.length - 1
                                        return (
                                            <div key={i} className="flex-1 h-full flex flex-col items-center group relative">
                                                <div className="w-full flex items-end justify-center gap-px h-full pb-6 z-10">
                                                    <div className={`w-1/3 rounded-t-[2px] ${isToday ? 'bg-foreground' : 'bg-foreground/70 group-hover:bg-foreground'}`} style={{ height: `${Math.max(scaleVal(day.totalHits), 3)}%` }} />
                                                    <div className={`w-1/3 rounded-t-[2px] ${isToday ? 'bg-ink-blue' : 'bg-ink-blue/60 group-hover:bg-ink-blue'}`} style={{ height: `${Math.max(scaleVal(day.uniqueVisitors), 3)}%` }} />
                                                    <div className={`w-1/3 rounded-t-[2px] ${isToday ? 'bg-ink-red' : 'bg-ink-red/60 group-hover:bg-ink-red'}`} style={{ height: `${day.newUsers > 0 ? Math.max(scaleVal(day.newUsers), 3) : 0}%` }} />
                                                </div>
                                                {(i % 5 === 0 || isToday) && (
                                                    <span className={`absolute bottom-0 font-mono text-[10px] whitespace-nowrap ${isToday ? 'text-ink-red' : 'text-muted-foreground'}`}>
                                                        {isToday ? 'today' : shortDate(day.date, { day: 'numeric', month: 'short' })}
                                                    </span>
                                                )}
                                                <div className="absolute bottom-full mb-2 hidden group-hover:block z-30 app-card px-3 py-2 text-[12px] whitespace-nowrap shadow-lg">
                                                    <div className="font-mono text-[11px] text-muted-foreground mb-1">{shortDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                                    <div>{day.totalHits.toLocaleString('en-IN')} visits</div>
                                                    <div className="text-ink-blue">{day.uniqueVisitors.toLocaleString('en-IN')} unique</div>
                                                    <div className="text-ink-red">{day.newUsers} sign-ups</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <dl className="mt-6 pt-5 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-y-4">
                                    <div><dt className="text-[13px] text-muted-foreground">Visits</dt><dd className="font-heading text-[28px] leading-tight">{sum('totalHits').toLocaleString('en-IN')}</dd></div>
                                    <div><dt className="text-[13px] text-muted-foreground">Unique visitors</dt><dd className="font-heading text-[28px] leading-tight text-ink-blue">{sum('uniqueVisitors').toLocaleString('en-IN')}</dd></div>
                                    <div><dt className="text-[13px] text-muted-foreground">New sign-ups</dt><dd className="font-heading text-[28px] leading-tight text-ink-red">{sum('newUsers').toLocaleString('en-IN')}</dd></div>
                                    <div><dt className="text-[13px] text-muted-foreground">Busiest day</dt><dd className="font-heading text-[28px] leading-tight">{maxHits.toLocaleString('en-IN')} <span className="font-sans text-[13px] text-muted-foreground">visits</span></dd></div>
                                </dl>
                            </div>
                        </section>
                    )}
                </div>
            )}

            {activeView === 'LIBRARY' && (
                <div>
                    <PageHead
                        title={<>Library</>}
                        sub={`Showing the latest ${materialsArray.length} material${materialsArray.length === 1 ? '' : 's'}, grouped by semester and subject.`}
                        actions={<button type="button" onClick={() => selectView('DEPLOYMENT')} className="app-btn">Upload material</button>}
                    />

                    {Object.keys(groupedMaterials).length === 0 ? (
                        <EmptyNote
                            title="The library is empty"
                            action={<button type="button" onClick={() => selectView('DEPLOYMENT')} className="app-btn">Upload the first one</button>}
                        >
                            Uploaded notes and papers will be listed here.
                        </EmptyNote>
                    ) : (
                        <div className="space-y-14">
                            {Object.keys(groupedMaterials).sort().map(sem => (
                                <section key={sem} aria-label={`Semester ${sem}`}>
                                    <div className="flex items-baseline gap-4 mb-4">
                                        <span className="font-heading text-[44px] leading-none tracking-[-0.03em]">{sem}</span>
                                        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Semester</span>
                                        <span className="flex-1 h-px bg-border" />
                                    </div>

                                    <div className="space-y-8">
                                        {Object.keys(groupedMaterials[sem]).sort().map(subject => {
                                            const rows: Material[] = Object.values(groupedMaterials[sem][subject] as Record<string, Material[]>).flat()
                                            return (
                                                <div key={subject}>
                                                    <p className="flex items-baseline gap-3 mb-2 px-2">
                                                        <span className="font-mono text-[13px] text-ink-red uppercase">{subject}</span>
                                                        <span className="text-[12px] text-muted-foreground">{rows.length} item{rows.length === 1 ? '' : 's'}</span>
                                                    </p>
                                                    <ul className="border-t border-foreground/80">
                                                        {rows.map((mat: Material) => (
                                                            <li key={mat.id} className="group grid grid-cols-[1fr_auto] md:grid-cols-[110px_1fr_80px_110px_auto] items-center gap-x-4 gap-y-1 py-3 px-2 border-b border-border text-[14px] hover:bg-muted/40 transition-colors">
                                                                <span className="flex items-center gap-1.5 col-span-2 md:col-span-1">
                                                                    <Tag tone={mat.category === 'notes' ? 'blue' : mat.category === 'pyqs' || mat.category === 'midterm' || mat.category === 'ca' ? 'red' : 'plain'}>
                                                                        {CATEGORY_LABEL[mat.category || 'other'] || mat.category}
                                                                    </Tag>
                                                                    {mat.unit && <Tag>{mat.unit === 'overview' ? 'Ovw' : `U${mat.unit}`}</Tag>}
                                                                </span>
                                                                <span className="font-medium truncate">{mat.title}</span>
                                                                <span className="hidden md:block font-mono text-[12px] text-muted-foreground text-right tabular-nums" title="Views">{Number(mat.total_views || 0).toLocaleString('en-IN')} views</span>
                                                                <span className="hidden md:block font-mono text-[12px] text-muted-foreground text-right">
                                                                    {mat.created_at || mat.createdAt ? shortDate(mat.created_at || mat.createdAt || '', { day: 'numeric', month: 'short', year: '2-digit' }) : 'recent'}
                                                                </span>
                                                                <span className="flex items-center gap-1 justify-end md:opacity-40 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Edit ${mat.title}`}
                                                                        onClick={() => {
                                                                            setEditingMaterial(mat);
                                                                            setEditData({ title: mat.title, description: mat.description || '' });
                                                                        }}
                                                                        className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Delete ${mat.title}`}
                                                                        onClick={() => setDeletingMaterial(mat)}
                                                                        className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-destructive/10 hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeView === 'REGISTRY' && (
                <div>
                    <PageHead
                        title={<>Subjects <em className="text-muted-foreground">&amp;</em> semesters</>}
                        sub="Open a semester to show it to students. Add the subjects it should list."
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <section className="lg:col-span-5" aria-label="Semesters">
                            <SectionHead n="01" title="Semesters" aside={semestersLoading ? 'loading…' : `${semesters.filter((s: Semester) => s.is_active).length} open`} />
                            <ul className="border-t border-foreground/80">
                                {semesters.map((s: Semester) => (
                                    <li key={s.number} className="border-b border-border">
                                        <label className="flex items-center justify-between gap-4 py-3 px-2 cursor-pointer hover:bg-muted/40">
                                            <span className="flex items-baseline gap-3">
                                                <span className="font-heading text-[24px] leading-none w-8">{s.number}</span>
                                                <span className="text-[14px] text-muted-foreground">{s.is_active ? 'Visible to students' : 'Hidden, shows “opening soon”'}</span>
                                            </span>
                                            <span className="relative inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={s.is_active}
                                                    disabled={toggleSemesterMutation.isPending}
                                                    onChange={() => toggleSemesterMutation.mutate({ number: s.number, isActive: !s.is_active })}
                                                    aria-label={`Semester ${s.number} visible`}
                                                />
                                                <span className="w-10 h-6 rounded-full border border-input bg-muted peer-checked:bg-foreground peer-checked:border-foreground transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-ring" />
                                                <span className="absolute left-1 w-4 h-4 rounded-full bg-surface shadow transition-transform peer-checked:translate-x-4" />
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="lg:col-span-7" aria-label="Subjects">
                            <SectionHead
                                n="02"
                                title="Subjects"
                                aside={
                                    <button type="button" onClick={() => setIsAddingSubject(!isAddingSubject)} className={isAddingSubject ? 'app-btn-quiet' : 'app-btn'}>
                                        {isAddingSubject ? 'Cancel' : 'Add subject'}
                                    </button>
                                }
                            />

                            {isAddingSubject && (
                                <div className="app-card p-5 mb-6 grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-3 items-end">
                                    <div>
                                        <Label htmlFor="new-sub-sem" className="text-[13px] mb-1.5 block">Semester</Label>
                                        <select id="new-sub-sem" value={newSubjectSem} onChange={e => setNewSubjectSem(e.target.value)} className="app-field">
                                            {semesters
                                                .filter((s: Semester) => s.is_active)
                                                .map((s: Semester) => <option key={s.number} value={s.number.toString()}>Semester {s.number}</option>)}
                                            {semesters.filter((s: Semester) => s.is_active).length === 0 && (
                                                <option value="" disabled>No open semesters</option>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="new-sub-name" className="text-[13px] mb-1.5 block">Subject name or code</Label>
                                        <input id="new-sub-name" placeholder="e.g. CSE316" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} className="app-field" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCreateSubject}
                                        disabled={!newSubjectName || !newSubjectSem || createSubjectMutation.isPending}
                                        className="app-btn h-11"
                                    >
                                        {createSubjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                                    </button>
                                </div>
                            )}

                            {subjectsLoading ? (
                                <p className="text-muted-foreground text-sm">Loading subjects…</p>
                            ) : subjects.length === 0 ? (
                                <EmptyNote title="No subjects yet">Add one above and it’ll show up under its semester.</EmptyNote>
                            ) : (
                                <ul className="border-t border-foreground/80 max-h-[520px] overflow-y-auto">
                                    {[...subjects]
                                        .sort((a, b) => a.semester_number - b.semester_number || a.name.localeCompare(b.name))
                                        .map((sub: Subject) => (
                                            <li key={sub.id} className="group grid grid-cols-[48px_1fr_auto] items-center gap-3 py-2.5 px-2 border-b border-border hover:bg-muted/40">
                                                <span className="font-mono text-[12px] text-muted-foreground">S{sub.semester_number}</span>
                                                <span className="min-w-0">
                                                    <span className="block font-medium truncate">{sub.name}</span>
                                                    <span className="block font-mono text-[11px] text-muted-foreground">/{sub.slug}</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    aria-label={`Remove ${sub.name}`}
                                                    onClick={() => deleteSubjectMutation.mutate(sub.id)}
                                                    className="w-8 h-8 rounded-md flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </section>
                    </div>
                </div>
            )}

            {activeView === 'DEPLOYMENT' && (
                <div className="max-w-3xl">
                    <PageHead
                        title={<>Upload <em className="text-muted-foreground">material</em></>}
                        sub="A PDF, a YouTube lecture, or both. Students see it as soon as you upload."
                    />

                    <form onSubmit={handleUploadSubmit} className="space-y-12">
                        <fieldset>
                            <legend className="mb-5"><Kicker n="01">Where it goes</Kicker></legend>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="up-sem" className="text-[13px] mb-1.5 block">Semester</Label>
                                    <select
                                        id="up-sem"
                                        value={uploadForm.semester}
                                        onChange={e => {
                                            const semester = e.target.value;
                                            setUploadForm({ ...uploadForm, semester, subject: '' });
                                        }}
                                        className="app-field"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s: number) => <option key={s} value={s.toString()}>Semester {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="up-cat" className="text-[13px] mb-1.5 block">Type</Label>
                                    <select id="up-cat" value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })} className="app-field">
                                        <option value="notes">Notes</option>
                                        <option value="pyqs">End-term PYQs</option>
                                        <option value="midterm">Mid-term papers</option>
                                        <option value="ca">CA papers</option>
                                    </select>
                                </div>
                                <div className={uploadForm.category === 'notes' ? '' : 'sm:col-span-2'}>
                                    <Label htmlFor="up-sub" className="text-[13px] mb-1.5 block">Subject</Label>
                                    <select id="up-sub" value={uploadForm.subject} onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })} className="app-field">
                                        <option value="">Choose a subject</option>
                                        {subjects
                                            .filter((s: Subject) => s.semester_number.toString() === uploadForm.semester)
                                            .map((sub: Subject) => <option key={sub.id} value={sub.slug}>{sub.name}</option>)
                                        }
                                    </select>
                                </div>
                                {uploadForm.category === 'notes' && (
                                    <div>
                                        <Label htmlFor="up-unit" className="text-[13px] mb-1.5 block">Unit <span className="text-muted-foreground">(optional)</span></Label>
                                        <select id="up-unit" value={uploadForm.unit} onChange={e => setUploadForm({ ...uploadForm, unit: e.target.value })} className="app-field">
                                            <option value="">No unit</option>
                                            <option value="overview">Overview (syllabus / general)</option>
                                            {[1, 2, 3, 4, 5, 6].map(u => <option key={u} value={String(u)}>Unit {u}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="mb-5"><Kicker n="02">What it is</Kicker></legend>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="up-title" className="text-[13px] mb-1.5 block">Title</Label>
                                    <input
                                        id="up-title"
                                        placeholder="e.g. CSE316 Unit 3 — Deadlocks"
                                        value={uploadForm.title}
                                        onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                        className="app-field"
                                    />
                                    <p className="mt-1.5 text-[12px] text-muted-foreground">At least 5 characters. This is what students see in the list.</p>
                                </div>
                                <div>
                                    <Label htmlFor="up-desc" className="text-[13px] mb-1.5 block">Description <span className="text-muted-foreground">(optional)</span></Label>
                                    <textarea
                                        id="up-desc"
                                        rows={4}
                                        placeholder="What's covered, which year's paper, anything worth knowing."
                                        value={uploadForm.description}
                                        onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                                        className="app-field"
                                    />
                                </div>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="mb-5"><Kicker n="03">The file</Kicker></legend>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[13px] mb-1.5 block">PDF</Label>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-24 rounded-lg border border-dashed border-input hover:border-foreground/60 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1 text-center px-4"
                                    >
                                        {file ? (
                                            <>
                                                <span className="flex items-center gap-1.5 text-[14px] font-medium"><Check className="w-4 h-4 text-emerald-600" /> <span className="truncate max-w-[200px]">{file.name}</span></span>
                                                <span className="text-[12px] text-muted-foreground">Click to choose another</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex items-center gap-1.5 text-[14px] font-medium"><FileUp className="w-4 h-4" /> Choose a PDF</span>
                                                <span className="text-[12px] text-muted-foreground">Stored on Cloudflare R2</span>
                                            </>
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
                                        onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="up-yt" className="text-[13px] mb-1.5 block">YouTube link</Label>
                                    <input
                                        id="up-yt"
                                        placeholder="https://youtube.com/watch?v=…"
                                        value={uploadForm.youtube_url}
                                        onChange={e => setUploadForm({ ...uploadForm, youtube_url: e.target.value })}
                                        className="app-field font-mono text-[13px]"
                                    />
                                    <p className="mt-1.5 text-[12px] text-muted-foreground">Add one, the other, or both.</p>
                                </div>
                            </div>
                        </fieldset>

                        <div className="flex items-center gap-4 pt-6 border-t border-border">
                            <button type="submit" disabled={uploadMutation.isPending} className="app-btn h-12 px-6">
                                {uploadMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : 'Upload material'}
                            </button>
                            <span className="text-[13px] text-muted-foreground">Goes live straight away.</span>
                        </div>
                    </form>
                </div>
            )}

            {/* Confirm new subject */}
            <Dialog open={showSubjectConfirm} onOpenChange={setShowSubjectConfirm}>
                <DialogContent className="app-card max-w-md p-7">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-normal text-[26px] tracking-[-0.02em]">Add this subject?</DialogTitle>
                        <DialogDescription className="text-[15px]">
                            <span className="text-foreground font-semibold">“{newSubjectName}”</span> will be listed under <span className="text-foreground font-semibold">Semester {newSubjectSem}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setShowSubjectConfirm(false)} className="app-btn-quiet">Cancel</button>
                        <button
                            type="button"
                            onClick={() => {
                                createSubjectMutation.mutate({ name: newSubjectName, semesterNumber: parseInt(newSubjectSem) });
                                setShowSubjectConfirm(false);
                            }}
                            className="app-btn"
                        >
                            Add subject
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit material */}
            <Dialog open={!!editingMaterial} onOpenChange={(open) => { if (!open) setEditingMaterial(null) }}>
                <DialogContent className="app-card max-w-xl p-7">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-normal text-[26px] tracking-[-0.02em]">Edit material</DialogTitle>
                        <DialogDescription className="font-mono text-[11px]">id {editingMaterial?.id.slice(0, 8)}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div>
                            <Label htmlFor="edit-title" className="text-[13px] mb-1.5 block">Title</Label>
                            <input id="edit-title" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} className="app-field" />
                        </div>
                        <div>
                            <Label htmlFor="edit-desc" className="text-[13px] mb-1.5 block">Description</Label>
                            <textarea id="edit-desc" rows={5} value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} className="app-field" />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setEditingMaterial(null)} className="app-btn-quiet">Cancel</button>
                            <button type="button" onClick={handleEditSave} disabled={updateMutation.isPending} className="app-btn">
                                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete material */}
            <Dialog open={!!deletingMaterial} onOpenChange={(open) => { if (!open) { setDeletingMaterial(null); setDeleteConfirmText('') } }}>
                <DialogContent className="app-card max-w-md p-7">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-normal text-[26px] tracking-[-0.02em]">Delete for good?</DialogTitle>
                        <DialogDescription className="text-[15px]">
                            <span className="text-foreground font-semibold">“{deletingMaterial?.title}”</span> will be removed from the site and its file deleted from storage. Type <span className="font-mono text-destructive">DELETE</span> to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <input
                        aria-label="Type DELETE to confirm"
                        placeholder="DELETE"
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                        className="app-field font-mono tracking-[0.2em] text-center mt-2"
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => { setDeletingMaterial(null); setDeleteConfirmText(''); }} className="app-btn-quiet">Keep it</button>
                        <button
                            type="button"
                            disabled={deleteConfirmText !== 'DELETE' || deleteMutation.isPending}
                            onClick={() => deletingMaterial && deleteMutation.mutate(deletingMaterial.id)}
                            className="app-btn app-btn-danger"
                        >
                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Day-by-day traffic */}
            <Dialog open={isAdvancedAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
                <DialogContent className="app-card max-w-3xl p-0 overflow-hidden">
                    <div className="flex flex-col max-h-[85vh]">
                        <DialogHeader className="p-7 pb-5 border-b border-border">
                            <DialogTitle className="font-heading font-normal text-[28px] tracking-[-0.02em]">Day by day</DialogTitle>
                            <DialogDescription>The last {days.length} days, newest first.</DialogDescription>
                        </DialogHeader>

                        {days.length > 0 && (
                            <dl className="grid grid-cols-3 px-7 border-b border-border">
                                <Stat label="Average visits a day" value={Math.round(sum('totalHits') / days.length).toLocaleString('en-IN')} />
                                <Stat label="Average unique a day" value={Math.round(sum('uniqueVisitors') / days.length).toLocaleString('en-IN')} />
                                <Stat label="Sign-up rate" value={`${sum('uniqueVisitors') ? ((sum('newUsers') / sum('uniqueVisitors')) * 100).toFixed(1) : '0.0'}%`} />
                            </dl>
                        )}

                        <div className="flex-1 overflow-y-auto px-7 pb-6">
                            <table className="w-full text-[14px] border-collapse">
                                <thead className="sticky top-0 bg-surface">
                                    <tr className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-foreground/80">
                                        <th className="py-3 text-left font-normal">Date</th>
                                        <th className="py-3 text-right font-normal">Visits</th>
                                        <th className="py-3 text-right font-normal">Unique</th>
                                        <th className="py-3 text-right font-normal">Sign-ups</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...days].reverse().map((day, i) => (
                                        <tr key={i} className="border-b border-border">
                                            <td className="py-2.5">{shortDate(day.date, { weekday: 'short', day: 'numeric', month: 'long' })}</td>
                                            <td className="py-2.5 text-right font-mono tabular-nums">{day.totalHits.toLocaleString('en-IN')}</td>
                                            <td className="py-2.5 text-right font-mono tabular-nums text-ink-blue">{day.uniqueVisitors.toLocaleString('en-IN')}</td>
                                            <td className={`py-2.5 text-right font-mono tabular-nums ${day.newUsers > 0 ? 'text-ink-red' : 'text-muted-foreground/50'}`}>{day.newUsers}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminShell>
    )
}
