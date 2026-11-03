"use client"

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/contexts/AuthContext'
import { EmptyNote, PageHead, Stat } from '@/components/app/Notebook'

interface Streak {
    count: number;
    label: string;
    tier: string;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    totalTimeSpent: number;
    materialsOpened: number;
    currentStreak: Streak;
    lastActive: string;
    isCurrentUser: boolean;
}

interface UserRank {
    rank: number;
    totalTimeSpent: number;
    percentile: number;
}

interface LeaderboardData {
    leaderboard: LeaderboardEntry[];
    currentUserRank: UserRank | null;
    totalParticipants: number;
}

function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        return `${days}d ${remHours}h`;
    }
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function formatTimeAgo(dateStr: string): string {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`)

function Streak({ streak }: { streak: Streak }) {
    if (streak.count === 0) return <span className="text-muted-foreground/50">–</span>;
    return (
        <span className="whitespace-nowrap" title={`${streak.count}-day streak`}>
            🔥 <span className={streak.tier === 'legendary' || streak.tier === 'epic' ? 'text-ink-red font-semibold' : ''}>{streak.count}d</span>
        </span>
    );
}

function Avatar({ entry, size = 36 }: { entry: LeaderboardEntry; size?: number }) {
    return (
        <span
            style={{ width: size, height: size }}
            className={`shrink-0 rounded-full overflow-hidden flex items-center justify-center font-mono text-[12px] border ${entry.isCurrentUser ? 'border-ink-red text-ink-red' : 'border-foreground/30'}`}
        >
            {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" /> : getInitials(entry.name)}
        </span>
    );
}

export default function LeaderboardPage() {
    const { isAuthenticated, openAuthModal } = useAuth();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["leaderboard"],
        queryFn: () => apiClient<LeaderboardData>('/leaderboard'),
        staleTime: 2 * 60 * 1000,
        enabled: isAuthenticated,
        retry: 1
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-[calc(100vh-4rem)] page-container max-w-3xl mx-auto flex items-center">
                <EmptyNote
                    title="Study champions"
                    action={<button type="button" onClick={() => openAuthModal('login')} className="app-btn">Sign in to view</button>}
                >
                    Sign in to see who’s putting in the hours and where you stand.
                </EmptyNote>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="page-container max-w-5xl mx-auto space-y-4 pb-24">
                <div className="h-28 rounded-lg bg-muted/50 animate-pulse" />
                <div className="h-48 rounded-lg bg-muted/40 animate-pulse" />
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 rounded bg-muted/30 animate-pulse" />)}
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-[calc(100vh-4rem)] page-container max-w-3xl mx-auto flex items-center">
                <EmptyNote
                    title="Couldn’t load the leaderboard"
                    action={<button type="button" onClick={() => window.location.reload()} className="app-btn-quiet">Try again</button>}
                >
                    Something went wrong on our side.
                </EmptyNote>
            </div>
        );
    }

    const { leaderboard, currentUserRank, totalParticipants } = data;
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);
    const isInTop20 = leaderboard.some(e => e.isCurrentUser);

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-28 page-container max-w-5xl mx-auto">
            <PageHead
                back="/dashboard"
                crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leaderboard' }]}
                title={<>Study <em>champions</em></>}
                sub="Ranked by time actually spent reading. Updated every couple of minutes."
            />

            {currentUserRank && (
                <dl className="grid grid-cols-2 md:grid-cols-4 border-b border-border mb-12 -mt-4">
                    <Stat label="Your rank" value={<>#{currentUserRank.rank}</>} />
                    <Stat label="Your reading time" value={formatTime(currentUserRank.totalTimeSpent)} />
                    <Stat label="Standing" value={<>Top {100 - currentUserRank.percentile + 1}%</>} />
                    <Stat label="Students on the board" value={totalParticipants} />
                </dl>
            )}

            {/* Podium */}
            {top3.length >= 3 && (
                <section aria-label="Top three" className="grid grid-cols-3 gap-3 sm:gap-6 items-end mb-14">
                    {[top3[1], top3[0], top3[2]].map((entry) => {
                        const first = entry.rank === 1
                        return (
                            <div key={entry.rank} className={`relative flex flex-col items-center text-center ${first ? '' : 'pt-8'}`}>
                                <span className={`font-heading leading-none tracking-[-0.04em] ${first ? 'text-[64px] sm:text-[88px]' : 'text-[48px] sm:text-[64px] text-muted-foreground'}`}>
                                    {ordinal(entry.rank)}
                                </span>
                                <div className="mt-4 flex flex-col items-center gap-2">
                                    <Avatar entry={entry} size={first ? 52 : 42} />
                                    <p className="font-semibold text-[15px] truncate max-w-[150px]">{entry.name}</p>
                                    <p className="font-mono text-[10px] text-muted-foreground blur-[2px] hover:blur-none transition-all select-none max-w-[150px] truncate">{entry.email}</p>
                                </div>
                                <div className={`mt-4 w-full border-t-2 ${first ? 'border-ink-red' : 'border-foreground/70'} pt-3 flex items-center justify-center gap-3 text-[13px]`}>
                                    <span className="font-mono tabular-nums">{formatTime(entry.totalTimeSpent)}</span>
                                    <Streak streak={entry.currentStreak} />
                                </div>
                            </div>
                        )
                    })}
                </section>
            )}

            {/* Everyone else */}
            {rest.length > 0 && (
                <section aria-label="Rankings">
                    <div className="hidden sm:grid grid-cols-[56px_1fr_90px_80px_100px_90px] gap-4 px-2 pb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-foreground/80">
                        <span>Rank</span><span>Student</span><span className="text-right">Opened</span><span className="text-right">Streak</span><span className="text-right">Time</span><span className="text-right">Last seen</span>
                    </div>
                    <ol>
                        {rest.map((entry) => (
                            <li
                                key={entry.rank}
                                className={`grid grid-cols-[44px_1fr_auto] sm:grid-cols-[56px_1fr_90px_80px_100px_90px] items-center gap-4 px-2 py-3.5 border-b border-border text-[14px] ${entry.isCurrentUser ? 'bg-highlight/40' : ''}`}
                            >
                                <span className="font-mono tabular-nums text-muted-foreground">#{entry.rank}</span>
                                <span className="flex items-center gap-3 min-w-0">
                                    <Avatar entry={entry} size={32} />
                                    <span className="min-w-0">
                                        <span className="block font-medium truncate">
                                            {entry.name}{entry.isCurrentUser && <span className="ml-2 font-hand text-[18px] text-ink-red">that’s you</span>}
                                        </span>
                                        <span className="block font-mono text-[10px] text-muted-foreground blur-[1.5px] hover:blur-none transition-all select-none truncate">{entry.email}</span>
                                    </span>
                                </span>
                                <span className="hidden sm:block text-right font-mono tabular-nums text-muted-foreground">{entry.materialsOpened}</span>
                                <span className="hidden sm:block text-right"><Streak streak={entry.currentStreak} /></span>
                                <span className="text-right font-mono tabular-nums font-semibold">{formatTime(entry.totalTimeSpent)}</span>
                                <span className="hidden sm:block text-right text-[12px] text-muted-foreground">{formatTimeAgo(entry.lastActive)}</span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {leaderboard.length === 0 && (
                <EmptyNote title="No champions yet">Open any notes and start reading. The first hour puts you on the board.</EmptyNote>
            )}

            {/* Your position when you're outside the top 20 */}
            {!isInTop20 && currentUserRank && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 app-card shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)] px-5 py-3 flex items-center gap-4 text-[14px]">
                    <span className="font-heading text-[22px] leading-none">#{currentUserRank.rank}</span>
                    <span className="text-muted-foreground">your position</span>
                    <span className="w-px h-6 bg-border" />
                    <span className="font-mono">{formatTime(currentUserRank.totalTimeSpent)}</span>
                    <span className="font-hand text-[19px] text-ink-red">keep going</span>
                </div>
            )}
        </div>
    );
}
