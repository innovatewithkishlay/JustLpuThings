"use client"

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { API_BASE_URL, apiClient } from '@/lib/apiClient'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Maximize, Loader2, Info, X, ShieldCheck, EyeOff, Focus, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { Document, Page, pdfjs } from 'react-pdf'
import { InView } from 'react-intersection-observer'
import { useResizeDetector } from 'react-resize-detector'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface DocumentData {
    id: string
    title: string
    description: string
    subjectCode: string
    subject_name: string
    semester_number: number
    last_page?: number
    total_pages?: number
}

export default function ViewerPage() {
    const params = useParams()
    const router = useRouter()
    const viewerRef = useRef<HTMLDivElement>(null)
    const { checkAuth } = useAuth()

    const slug = params.slug as string

    // UI states
    const [showInfo, setShowInfo] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [distractionFree, setDistractionFree] = useState(false)

    // PDF specific states
    const [numPages, setNumPages] = useState<number | null>(null)
    const { width: containerWidth, ref: containerRef } = useResizeDetector()
    const containerElRef = useRef<HTMLDivElement>(null)

    // 1. Fetch only static non-secure metadata
    const { data: documentData, isLoading: metadataLoading, isError: metadataError } = useQuery({
        queryKey: ["material", slug],
        queryFn: async () => {
            return await apiClient<DocumentData>(`/materials/${slug}`)
        },
        retry: 1
    })

    // 2. Forever Fix: Secure Proxy URL
    const pdfProxyUrl = `${API_BASE_URL}/materials/${slug}/view`

    // 3. Fetch PDF as ArrayBuffer to ensure credentials and avoid CORS/SignedURL issues
    const { data: pdfData, isLoading: pdfLoading, isError: pdfFetchError } = useQuery({
        queryKey: ["pdf-stream", slug],
        queryFn: async () => {
            const res = await fetch(pdfProxyUrl, {
                credentials: 'include'
            })
            if (!res.ok) {
                const error = new Error(`HTTP Error: ${res.status}`)
                // @ts-ignore
                error.status = res.status
                throw error
            }
            return await res.arrayBuffer()
        },
        enabled: !!documentData,
        retry: 1
    })

    const { currentPage, handlePageChange } = useReadingProgress(slug, documentData?.last_page || 1, numPages || undefined)

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages)

        // Seamless Resume implementation
        if (documentData?.last_page && documentData.last_page > 1) {
            toast.success(`Resumed from Page ${documentData.last_page}`)

            // Allow DOM to insert pages
            setTimeout(() => {
                const element = document.getElementById(`pdf-page-${documentData.last_page}`)
                const scrollContainer = containerElRef.current;

                if (element && scrollContainer) {
                    const topOffset = element.offsetTop - 30; // padding offset
                    scrollContainer.scrollTo({ top: topOffset, behavior: 'smooth' })
                }
            }, 600)
        }
    }

    const calculatedProgress = numPages ? Math.min(100, Math.round((currentPage / numPages) * 100)) : 5

    // Security Mechanisms
    const handleContextMenu = (e: React.MouseEvent) => e.preventDefault()
    const handleDragStart = (e: React.DragEvent) => e.preventDefault()

    const toggleFullscreen = () => {
        if (!viewerRef.current) return;
        if (!document.fullscreenElement) {
            viewerRef.current.requestFullscreen().catch(err => {
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

    const isLoading = metadataLoading || pdfLoading;
    const isError = metadataError || pdfFetchError;

    if (isLoading) {
        return (
            <div className="flex flex-col h-screen bg-background">
                <div className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between">
                    <Skeleton className="h-6 w-32 shimmer-gradient rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-full shimmer-gradient" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm font-mono font-bold tracking-widest text-muted-foreground uppercase">Negotiating Secure Tunnel</span>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col h-screen bg-background items-center justify-center p-6">
                <div className="w-full max-w-md p-8 bg-surface border border-border/60 rounded-[24px] soft-shadow flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-500 border border-red-500/20">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-heading font-bold mb-2">Connection Failed</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        We could not securely load this document. It might be corrupted or you may need to log in again.
                    </p>
                    <div className="flex gap-4 w-full">
                        <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => router.back()}>Go Back</Button>
                        <Button variant="default" className="flex-1 h-11 rounded-xl" onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!documentData || !pdfData) return null

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
                                    {documentData.title}
                                </h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mr-3">Secure Stream</span>

                                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${calculatedProgress}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground font-bold">{calculatedProgress}%</span>
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
                        className="absolute top-0 inset-x-0 h-16 z-50 cursor-pointer group"
                        onClick={() => {
                            setDistractionFree(false)
                            router.back()
                        }}
                    >
                        <div className="absolute top-4 left-6 px-4 py-2 bg-surface border border-border rounded-xl soft-shadow opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-sm font-bold tracking-wide text-foreground hover:bg-muted/80">
                            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /> Go Back
                        </div>
                    </div>
                )}

                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className={`flex-1 h-full w-full relative z-10 selection:bg-transparent overflow-y-auto custom-scrollbar transition-colors duration-700 ${distractionFree ? 'bg-[#0A0A0A]' : 'bg-muted/30'}`}
                >
                    <div ref={containerElRef} className="max-w-4xl mx-auto pt-0 pb-8 px-4 flex flex-col items-center">
                        <Document
                            file={pdfData}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={(err) => {
                                console.error("PDF Render Error:", err);
                                toast.error(`Render Error: ${err.message || 'Failed to display PDF'}`);
                            }}
                            loading={
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <span className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Decrypting Stream...</span>
                                </div>
                            }
                            className="flex flex-col items-center gap-6"
                        >
                            {numPages && Array.from(new Array(numPages), (el, index) => (
                                <InView
                                    key={`page_${index + 1}`}
                                    as="div"
                                    threshold={0.5}
                                    onChange={(inView) => {
                                        if (inView) {
                                            handlePageChange(index + 1)
                                        }
                                    }}
                                    id={`pdf-page-${index + 1}`}
                                    className="w-full bg-background rounded-sm shadow-xl flex items-center justify-center min-h-[500px]"
                                >
                                    <Page
                                        pageNumber={index + 1}
                                        width={containerWidth ? Math.min(containerWidth - 32, 1000) : 800}
                                        renderAnnotationLayer={false}
                                        renderTextLayer={true}
                                        className="pdf-page-render"
                                        loading={<Skeleton className="w-full h-[800px] bg-muted/50" />}
                                    />
                                </InView>
                            ))}
                        </Document>
                    </div>
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
                                    <p className="font-mono text-sm bg-background inline-flex px-3 py-1.5 rounded-lg border border-border shadow-sm">{documentData.subjectCode}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Description</p>
                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">{documentData.description}</p>
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
