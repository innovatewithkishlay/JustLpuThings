"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/contexts/AuthContext'
import { Trophy, Flame, Clock, BookOpen, Crown, Medal, ChevronLeft, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

function StreakBadge({ streak }: { streak: Streak }) {
    if (streak.count === 0) return null;
    const fires = streak.tier === 'legendary' ? '🔥🔥🔥' : streak.tier === 'epic' ? '🔥🔥' : '🔥';
    return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
            <span>{fires}</span>
            <span className={streak.tier === 'legendary' ? 'text-amber-500' : streak.tier === 'epic' ? 'text-orange-500' : 'text-red-400'}>
                {streak.count}d
            </span>
        </span>
    );
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400 fill-amber-400/30" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-[13px] font-black text-muted-foreground tabular-nums">#{rank}</span>;
}

function AvatarCircle({ entry, size = 'md' }: { entry: LeaderboardEntry; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-9 h-9 text-xs',
        md: 'w-11 h-11 text-sm',
        lg: 'w-16 h-16 text-lg'
    };
    const ringColors: Record<number, string> = {
        1: 'ring-amber-400/60 shadow-amber-400/20',
        2: 'ring-slate-400/50 shadow-slate-400/15',
        3: 'ring-amber-700/50 shadow-amber-700/15'
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-black tracking-tight ring-2 shadow-lg overflow-hidden
            ${entry.isCurrentUser ? 'ring-primary/60 shadow-primary/20' :
                ringColors[entry.rank] || 'ring-border/30 shadow-sm'}
            ${entry.avatarUrl ? '' : 'bg-primary/10 text-primary'}`}
        >
            {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
            ) : (
                getInitials(entry.name)
            )}
        </div>
    );
}

function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
    const configs = {
        1: { order: 'order-2', height: 'h-28', gradient: 'from-amber-500/20 to-amber-500/5', glow: 'shadow-amber-500/10', label: 'Champion', labelColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
        2: { order: 'order-1', height: 'h-20', gradient: 'from-slate-400/15 to-slate-400/5', glow: 'shadow-slate-400/10', label: 'Runner Up', labelColor: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
        3: { order: 'order-3', height: 'h-16', gradient: 'from-amber-700/15 to-amber-700/5', glow: 'shadow-amber-700/10', label: 'Third Place', labelColor: 'text-amber-700 bg-amber-700/10 border-amber-700/20' }
    };
    const config = configs[position];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: position * 0.15, duration: 0.5 }}
            className={`${config.order} flex-1 flex flex-col items-center`}
        >
            <div className={`relative mb-2 ${position === 1 ? 'scale-110' : ''}`}>
                {position === 1 && (
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-4 left-1/2 -translate-x-1/2"
                    >
                        <Crown className="w-6 h-6 text-amber-400 fill-amber-400/40" />
                    </motion.div>
                )}
                <AvatarCircle entry={entry} size={position === 1 ? 'lg' : 'md'} />
            </div>
            <h3 className="font-heading font-bold text-sm text-center truncate max-w-[120px]">{entry.name}</h3>
            <p className="text-[9px] font-mono text-muted-foreground/50 blur-[2px] hover:blur-none transition-all cursor-default select-none mt-0.5">{entry.email}</p>
            <div className="mt-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-black tracking-tight">{formatTime(entry.totalTimeSpent)}</span>
            </div>
            <StreakBadge streak={entry.currentStreak} />
            <div className={`mt-3 ${config.height} w-full rounded-t-2xl bg-gradient-to-t ${config.gradient} border-t border-x border-border/30 flex items-end justify-center pb-3 ${config.glow} shadow-lg`}>
                <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border ${config.labelColor}`}>
                    {config.label}
                </span>
            </div>
        </motion.div>
    );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.3 }}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group
                ${entry.isCurrentUser
                    ? 'bg-primary/5 border-2 border-primary/20 shadow-sm shadow-primary/5'
                    : 'bg-surface/50 border border-border/30 hover:border-primary/20 hover:bg-surface'}`}
        >
            <div className="w-8 flex items-center justify-center">
                <RankBadge rank={entry.rank} />
            </div>

            <AvatarCircle entry={entry} size="sm" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm truncate">
                        {entry.name}
                        {entry.isCurrentUser && <span className="ml-1.5 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">You</span>}
                    </h4>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/40 blur-[1.5px] hover:blur-none transition-all cursor-default select-none">{entry.email}</p>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{entry.materialsOpened}</span>
            </div>

            <StreakBadge streak={entry.currentStreak} />

            <div className="flex items-center gap-1.5 min-w-[70px] justify-end">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-black tracking-tight tabular-nums">{formatTime(entry.totalTimeSpent)}</span>
            </div>

            <div className="hidden md:block text-[9px] font-bold text-muted-foreground/50 min-w-[60px] text-right">
                {formatTimeAgo(entry.lastActive)}
            </div>
        </motion.div>
    );
}

export default function LeaderboardPage() {
    const router = useRouter();
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
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                    <Trophy className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-heading font-black mb-2">Study Champions</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">Sign in to see who's putting in the work and where you stand among your peers.</p>
                <Button onClick={() => openAuthModal('login')} className="rounded-2xl h-12 px-8 font-bold">Sign In to View</Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="page-container max-w-3xl mx-auto space-y-6 pb-24">
                <Skeleton className="h-12 w-64 rounded-2xl" />
                <div className="flex gap-4 justify-center">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-52 flex-1 rounded-3xl" />)}
                </div>
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-xl font-bold mb-2">Failed to load leaderboard</h2>
                <p className="text-muted-foreground mb-4">Something went wrong. Please try again.</p>
                <Button onClick={() => window.location.reload()} className="rounded-2xl">Retry</Button>
            </div>
        );
    }

    const { leaderboard, currentUserRank, totalParticipants } = data;
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);
    const isInTop20 = leaderboard.some(e => e.isCurrentUser);

    return (
        <div className="min-h-[calc(100vh-4rem)] pb-24 page-container max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

                {/* Header */}
                <div className="flex flex-col border-b border-border/50 pb-6">
                    <div className="flex items-center gap-4 mb-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="rounded-xl hover:bg-muted">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Link href="/dashboard" className="text-xs font-mono font-bold hover:text-primary transition-colors tracking-wider uppercase text-muted-foreground bg-muted hover:bg-primary/10 px-2 py-0.5 rounded-md">Dashboard</Link>
                                <span className="text-muted-foreground text-xs">/</span>
                                <span className="text-xs font-mono font-bold tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">Leaderboard</span>
                            </div>
                            <h1 className="text-3xl font-heading font-black tracking-tight flex items-center gap-3">
                                Study Champions
                                <Trophy className="w-7 h-7 text-amber-500" />
                            </h1>
                        </div>
                    </div>

                    {/* User Stats Bar */}
                    {currentUserRank && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 mt-2 ml-14 flex-wrap"
                        >
                            <div className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="text-xs font-black">Your Rank: <span className="text-primary">#{currentUserRank.rank}</span></span>
                            </div>
                            <div className="flex items-center gap-2 bg-muted/50 border border-border/30 rounded-2xl px-4 py-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-bold text-muted-foreground">{formatTime(currentUserRank.totalTimeSpent)}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl px-4 py-2">
                                <Sparkles className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-black text-emerald-600">Top {100 - currentUserRank.percentile + 1}%</span>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground/50">{totalParticipants} students active</span>
                        </motion.div>
                    )}
                </div>

                {/* Podium */}
                {top3.length >= 3 && (
                    <div className="flex items-end gap-3 px-4 md:px-12 pt-8">
                        <PodiumCard entry={top3[1]} position={2} />
                        <PodiumCard entry={top3[0]} position={1} />
                        <PodiumCard entry={top3[2]} position={3} />
                    </div>
                )}

                {/* Ranked List (4-20) */}
                {rest.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 mb-3">Leaderboard</h3>
                        {rest.map((entry, i) => (
                            <LeaderboardRow key={entry.rank} entry={entry} index={i} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {leaderboard.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/60 rounded-3xl bg-surface/50">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 border border-primary/20">
                            <Trophy className="w-8 h-8 text-primary opacity-50" />
                        </div>
                        <h3 className="font-heading font-bold text-lg mb-1">No champions yet</h3>
                        <p className="text-muted-foreground font-medium text-sm max-w-[280px]">Be the first to claim the throne! Start reading documents to appear here.</p>
                    </div>
                )}

                {/* Sticky footer for non-top-20 users */}
                {!isInTop20 && currentUserRank && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface/90 backdrop-blur-xl border border-primary/20 rounded-2xl px-6 py-3.5 shadow-2xl shadow-primary/10 flex items-center gap-4"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-primary">#{currentUserRank.rank}</span>
                            <span className="text-sm font-bold">Your position</span>
                        </div>
                        <div className="w-px h-8 bg-border/40" />
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-black">{formatTime(currentUserRank.totalTimeSpent)}</span>
                        </div>
                        <div className="w-px h-8 bg-border/40" />
                        <span className="text-xs font-bold text-emerald-500">Keep going!</span>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
