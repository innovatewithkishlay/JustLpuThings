"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Search as SearchIcon, BookOpen, Loader2, ArrowRight } from 'lucide-react'

// Custom debounce hook natively built
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface Material {
    id: string
    title: string
    description: string
    subjectCode: string
    year: number
    rank?: number // ts_rank output
}

const listVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

export default function SearchPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get('q') || ''

    const [query, setQuery] = useState(initialQuery)
    const debouncedQuery = useDebounce(query, 400) // 400ms delay on keystrokes

    const { data: results = [], isFetching: loading } = useQuery({
        queryKey: ["materials", "search", debouncedQuery],
        queryFn: () => apiClient<Material[]>(`/materials/search?q=${encodeURIComponent(debouncedQuery)}`),
        enabled: debouncedQuery.trim().length > 0,
    })

    const hasSearched = debouncedQuery.trim().length > 0

    useEffect(() => {
        if (!debouncedQuery.trim()) return

        // Update URL safely without triggering reload via Next.js 14 shallow route
        const params = new URLSearchParams(searchParams.toString())
        params.set('q', debouncedQuery)
        window.history.replaceState(null, '', `?${params.toString()}`)
    }, [debouncedQuery, searchParams])

    return (
        <div className="min-h-screen bg-background pb-20 pt-8 page-container max-w-4xl mx-auto">

            {/* Massive Search Input Structure */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative mb-12 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-indigo-400 rounded-[28px] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative flex items-center bg-surface rounded-[24px] border border-border p-2 soft-shadow">
                    <div className="pl-4 pr-2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <SearchIcon className="w-6 h-6" />
                    </div>
                    <Input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search strict ts_vector indexes..."
                        className="text-lg bg-transparent border-none shadow-none h-14 focus-visible:ring-0 placeholder:text-muted-foreground/60 w-full font-medium"
                    />
                    <div className="pr-4 flex items-center">
                        <AnimatePresence>
                            {loading && (
                                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Results Engine */}
            <div className="min-h-[400px]">
                {loading && results.length === 0 ? (
                    // Skeleton Loaders
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-2xl bg-surface border border-border" />
                        ))}
                    </div>
                ) : hasSearched && results.length === 0 ? (
                    // Empty State
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6">
                            <SearchIcon className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-heading font-bold mb-2">No indexing matched</h3>
                        <p className="text-muted-foreground">Adjust your query. Advanced text-search covers document blocks securely.</p>
                    </motion.div>
                ) : (
                    // Render Ranked Results
                    <motion.div variants={listVariant} initial="hidden" animate="visible" className="space-y-4">
                        {results.map((mat) => (
                            <motion.div key={mat.id} variants={itemVariant} whileHover={{ y: -2 }} className="group">
                                <Link href={`/viewer/${mat.id}`}>
                                    <Card className="flex items-center gap-5 p-5 rounded-2xl bg-surface border border-border/50 hover:border-primary/50 soft-shadow hover:shadow-primary/5 transition-all">
                                        <div className="w-16 h-20 rounded-xl bg-muted/30 flex items-center justify-center border border-border flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                                            <BookOpen className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-heading font-bold text-lg truncate group-hover:text-primary transition-colors">
                                                    {mat.title}
                                                </h3>
                                                {mat.rank && (
                                                    <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded-full border border-border text-muted-foreground ml-2">
                                                        Rank: {mat.rank.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-mono text-primary/80 mb-2">{mat.subjectCode}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-2 truncate">
                                                {mat.description}
                                            </p>
                                        </div>
                                        <div className="pl-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                            <ArrowRight className="w-5 h-5 text-primary" />
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

        </div>
    )
}
