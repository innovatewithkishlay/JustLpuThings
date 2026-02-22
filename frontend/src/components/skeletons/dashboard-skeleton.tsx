import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Search Bar Skeleton */}
            <div className="flex justify-center mb-12 mt-4">
                <Skeleton className="h-16 w-full max-w-2xl rounded-full" />
            </div>

            <section>
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-40 w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <Skeleton className="h-8 w-64 mb-6 mt-12" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    )
}
