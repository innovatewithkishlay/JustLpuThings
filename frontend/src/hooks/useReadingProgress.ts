import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface ProgressPayload {
    last_page: number;
    total_pages?: number;
    time_spent_increment: number;
}

export function useReadingProgress(slug: string, initialPage: number = 1, totalPages?: number) {
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const sessionStartTime = useRef<number>(Date.now());
    const lastSyncedPage = useRef<number>(initialPage);

    // We keep track of total time spent in this session just for local debugging/UI if needed
    const accumulatedTime = useRef<number>(0);

    const queryClient = useQueryClient();

    const progressMutation = useMutation({
        mutationFn: async (payload: ProgressPayload) => {
            return await apiClient(`/materials/${slug}/progress`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["material", slug] });
            queryClient.invalidateQueries({ queryKey: ["user", "analytics"] });
        }
    });

    const syncProgress = useCallback(async (forcedPage?: number) => {
        const now = Date.now();
        const timeSpentIncrement = Math.floor((now - sessionStartTime.current) / 1000);

        const pageToSync = forcedPage || currentPage;

        // Prevent empty syncs if no time passed and page hasn't changed (unless it's the first load sync)
        if (timeSpentIncrement < 5 && pageToSync === lastSyncedPage.current) return;

        try {
            await progressMutation.mutateAsync({
                last_page: pageToSync,
                ...(totalPages ? { total_pages: totalPages } : {}),
                time_spent_increment: timeSpentIncrement
            });

            // Reset increment window
            sessionStartTime.current = Date.now();
            accumulatedTime.current += timeSpentIncrement;
            lastSyncedPage.current = pageToSync;
        } catch (error) {
            console.error("Failed to sync reading progress", error);
        }
    }, [currentPage, totalPages, slug, progressMutation]);

    // Expose a method to change page that triggers a debounced sync
    const handlePageChange = useCallback((newPage: number) => {
        setCurrentPage(newPage);
    }, []);

    // Debounce watcher for page changes
    useEffect(() => {
        if (currentPage === lastSyncedPage.current) return;

        const timeoutId = setTimeout(() => {
            syncProgress(currentPage);
        }, 15000); // 15s pulse as per architectural requirement

        return () => clearTimeout(timeoutId);
    }, [currentPage, syncProgress]);

    // Sync on unmount
    useEffect(() => {
        return () => {
            // Using a standard fetch or beacon for unmount is safer, but mutateAsync works if component isn't hard-unmounted instantly
            // Next.js fast refresh sometimes drops this, but for SPA navigation it works.
            syncProgress();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        currentPage,
        handlePageChange,
        syncProgress
    };
}
