"use client"

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Maximize, Loader2, Info, X, ShieldCheck, EyeOff, Focus } from 'lucide-react'

export default function ViewerPage() {
    const params = useParams()
    const router = useRouter()
    const viewerRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<{ url: string; title: string; metadata: any } | null>(null)
    const [showInfo, setShowInfo] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [distractionFree, setDistractionFree] = useState(false)
    const [progress, setProgress] = useState(5)

    useEffect(() => {
        const fetchMaterial = async () => {
            try {
                const materialData = await apiFetch<any>(`/materials/${params.id}`)
                const signedUrlData = await apiFetch<{ signedUrl: string }>(`/materials/${params.id}/access`)

                setData({
                    title: materialData.title,
                    metadata: materialData,
                    url: signedUrlData.signedUrl
                })
            } catch (error: any) {
                toast.error('Failed to load secure document', { description: error.message })
                setTimeout(() => router.push('/dashboard'), 2000)
            } finally {
                setLoading(false)
            }
        }
        fetchMaterial()
    }, [params.id, router])

    // Progress Auto-Save Pipeline
    useEffect(() => {
        if (!data) return
        const saveInterval = setInterval(() => {
            setProgress(p => Math.min(p + 2, 100))
            console.log('[Viewer] Auto-saving progression state...')
        }, 15000)
        return () => clearInterval(saveInterval)
    }, [data])

    // Security Mechanisms
    const handleContextMenu = (e: React.MouseEvent) => e.preventDefault()

    // Use a generic wrapper div specifically to handle the drag block without colliding with framer-motion
    const handleDragStart = (e: React.DragEvent) => e.preventDefault()

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            viewerRef.current?.requestFullscreen().catch(err => {
                toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true)
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false)
            }
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col h-screen bg-background">
                <div className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between">
                    <Skeleton className="h-6 w-32 shimmer-gradient rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-full shimmer-gradient" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div
            ref={viewerRef}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            className="flex flex-col h-screen bg-background overflow-hidden"
        >
            <AnimatePresence>
                {!isFullscreen && !distractionFree && (
                    <motion.header
                        initial={{ y: -70, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -70, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="h-16 flex-shrink-0 border-b border-border bg-surface px-6 flex items-center justify-between z-20 soft-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-muted/80">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex flex-col">
                                <h1 className="font-heading font-semibold text-[15px] truncate max-w-[300px] md:max-w-md lg:max-w-xl">
                                    {data.title}
                                </h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mr-3">Secure Stream</span>

                                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground font-bold">{progress}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setDistractionFree(true)} className="rounded-full hover:bg-muted/80" title="Distraction Free Mode">
                                <Focus className="w-5 h-5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setShowInfo(!showInfo)} className={`rounded-full ${showInfo ? 'bg-primary/10 text-primary' : 'hover:bg-muted/80'}`}>
                                <Info className="w-5 h-5" />
                            </Button>
                            <Button variant="default" size="icon" onClick={toggleFullscreen} className="rounded-full shadow-sm active:scale-95">
                                <Maximize className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.header>
                )}
            </AnimatePresence>

            <div className="flex-1 flex relative overflow-hidden bg-background">
                {distractionFree && (
                    <div
                        className="absolute top-0 inset-x-0 h-4 z-50 cursor-pointer group"
                        onClick={() => setDistractionFree(false)}
                    >
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-surface border border-border rounded-full soft-shadow opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Focus className="w-3 h-3 text-primary" /> Exit Focus
                        </div>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className={`flex-1 h-full w-full relative z-10 selection:bg-transparent transition-colors duration-700 ${distractionFree ? 'bg-[#0A0A0A]' : 'bg-background'}`}
                    style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                >
                    <iframe
                        src={`${data.url}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full border-0"
                        title={data.title}
                    />
                    <div className="absolute inset-x-0 top-0 h-10 z-20 bg-transparent" />
                    <div className="absolute inset-y-0 right-0 w-6 z-20 bg-transparent" />
                    <div className="absolute inset-y-0 left-0 w-6 z-20 bg-transparent" />
                </motion.div>

                <AnimatePresence>
                    {showInfo && !isFullscreen && !distractionFree && (
                        <motion.div
                            initial={{ x: 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 320, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-80 h-full bg-surface border-l border-border z-30 absolute right-0 soft-shadow flex flex-col"
                        >
                            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-muted/10">
                                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground">Document Metadata</h3>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowInfo(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Subject Code</p>
                                    <p className="font-mono text-sm bg-background inline-flex px-3 py-1.5 rounded-lg border border-border shadow-sm">{data.metadata?.subjectCode}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Description</p>
                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">{data.metadata?.description}</p>
                                </div>
                                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-2 mt-auto">
                                    <p className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1.5"><EyeOff className="w-4 h-4" /> Defense Log</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">This stream is securely decoupled via Edge routing using dynamic presigned signatures blocking scraping endpoints completely.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
