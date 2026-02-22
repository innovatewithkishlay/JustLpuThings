import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">

            {/* Continue Reading - Horizontal Scroll Skeleton */}
            <section>
                <Skeleton className="h-8 w-48 mb-6 bg-muted/60 shimmer-gradient rounded-xl" />
                <div className="flex space-x-6 overflow-hidden">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="min-w-[300px] flex gap-4 p-5 rounded-3xl border border-border bg-surface soft-shadow">
                            <Skeleton className="h-24 w-20 rounded-2xl bg-muted/60 shimmer-gradient" />
                            <div className="flex-1 space-y-3 py-2">
                                <Skeleton className="h-4 w-full rounded-md bg-muted/60 shimmer-gradient" />
                                <Skeleton className="h-4 w-2/3 rounded-md bg-muted/60 shimmer-gradient" />
                                <div className="pt-4"><Skeleton className="h-2 w-full rounded-full bg-muted/60 shimmer-gradient" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Trending Grid Skeleton */}
            <section>
                <Skeleton className="h-8 w-40 mb-6 bg-muted/60 shimmer-gradient rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col space-y-4 p-5 rounded-3xl border border-border bg-surface soft-shadow">
                            <Skeleton className="h-40 w-full rounded-2xl bg-muted/60 shimmer-gradient" />
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-full rounded-md bg-muted/60 shimmer-gradient" />
                                <Skeleton className="h-4 w-3/4 rounded-md bg-muted/60 shimmer-gradient" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recommendations Grid Skeleton */}
            <section>
                <Skeleton className="h-8 w-56 mb-6 bg-muted/60 shimmer-gradient rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col space-y-4 p-5 rounded-3xl border border-border bg-surface soft-shadow">
                            <Skeleton className="h-40 w-full rounded-2xl bg-muted/60 shimmer-gradient" />
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-full rounded-md bg-muted/60 shimmer-gradient" />
                                <Skeleton className="h-4 w-3/4 rounded-md bg-muted/60 shimmer-gradient" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
