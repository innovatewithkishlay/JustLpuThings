"use client"

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api'
import { Search as SearchIcon, FileText, Filter } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'

type Material = {
    id: string;
    title: string;
    subject_code: string;
    description: string;
    material_type: string;
    rank?: number;
}

function SearchInterface() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''

    const [searchInput, setSearchInput] = useState(query)
    const [results, setResults] = useState<Material[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    useEffect(() => {
        async function performSearch() {
            if (!query.trim()) {
                setResults([])
                return
            }
            setLoading(true)
            try {
                const data = await apiFetch<Material[]>(`/search?q=${encodeURIComponent(query)}`)
                setResults(data || [])
                setSearched(true)
            } catch (err) {
                setResults([])
            } finally {
                setLoading(false)
            }
        }
        performSearch()
    }, [query])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchInput.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchInput)}`)
        }
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="container mx-auto px-6 max-w-4xl">

                {/* Search Header */}
                <form onSubmit={handleSearch} className="relative mb-12">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-primary/60" />
                    <Input
                        autoFocus
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search structural subjects, assignments, PYQs..."
                        className="w-full pl-20 pr-8 h-20 text-2xl md:text-3xl rounded-3xl soft-shadow border-none bg-card focus-visible:ring-primary/20 transition-all font-heading tracking-tight"
                    />
                </form>

                {/* Results Area */}
                <div className="space-y-6">
                    {loading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-card rounded-2xl animate-pulse"></div>
                            ))}
                        </div>
                    )}

                    {!loading && searched && results.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-20 px-4"
                        >
                            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-2xl font-heading mb-2">No definitive matches found</h3>
                            <p className="text-muted-foreground">Try adjusting your query. The system searches strictly over titles, subjects, and descriptions using TSVector processing natively.</p>
                        </motion.div>
                    )}

                    {!loading && results.length > 0 && (
                        <motion.div
                            initial="hidden" animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground pl-2 pb-2 border-b border-border/50">
                                <span>{results.length} native results mapped</span>
                                <span className="flex items-center gap-1"><Filter className="w-4 h-4" /> Relevance</span>
                            </div>

                            {results.map((mat) => (
                                <motion.div
                                    key={mat.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                >
                                    <Link href={`/viewer/${mat.id}`}>
                                        <Card className="hover:-translate-y-0.5 transition-transform cursor-pointer soft-shadow border-border/50 hover:border-primary/30 group">
                                            <CardHeader className="py-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <div className="text-xs font-mono text-primary/80 mb-1.5">{mat.subject_code} • {mat.material_type}</div>
                                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{mat.title}</CardTitle>
                                                        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-relaxed">{mat.description}</p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <SearchInterface />
        </Suspense>
    )
}
