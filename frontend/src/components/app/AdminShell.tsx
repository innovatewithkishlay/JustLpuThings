"use client"

import Link from 'next/link'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export type AdminView = 'OVERVIEW' | 'LIBRARY' | 'REGISTRY' | 'DEPLOYMENT'
export type AdminSection = AdminView | 'USERS' | 'FEEDBACKS' | 'INBOX'

const VIEWS: { id: AdminView; label: string; hash: string }[] = [
    { id: 'OVERVIEW', label: 'Overview', hash: '' },
    { id: 'LIBRARY', label: 'Library', hash: '#library' },
    { id: 'REGISTRY', label: 'Subjects & semesters', hash: '#registry' },
    { id: 'DEPLOYMENT', label: 'Upload material', hash: '#upload' },
]

const PAGES: { id: AdminSection; label: string; href: string }[] = [
    { id: 'USERS', label: 'Students', href: '/admin/users' },
    { id: 'FEEDBACKS', label: 'Reviews', href: '/admin/feedbacks' },
    { id: 'INBOX', label: 'Inbox', href: '/admin/inbox' },
]

export const viewFromHash = (hash: string): AdminView =>
    VIEWS.find(v => v.hash && v.hash === hash)?.id ?? 'OVERVIEW'

// Sidebar for every admin screen. On the main admin page the four views
// switch in place (onSelect); from the other admin pages they link back.
export function AdminShell({
    active,
    onSelect,
    collapsed = false,
    onToggleCollapsed,
    children,
}: {
    active: AdminSection
    onSelect?: (view: AdminView) => void
    collapsed?: boolean
    onToggleCollapsed?: () => void
    children: React.ReactNode
}) {
    const item = (on: boolean) =>
        `w-full flex items-center gap-3 rounded-md px-3 py-2 text-left text-[14px] transition-colors ${on
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`

    const viewEl = (v: typeof VIEWS[number], i: number, mobile = false) => {
        const on = active === v.id
        const content = (
            <>
                <span className={`font-mono text-[11px] tabular-nums ${on ? 'opacity-70' : 'text-ink-red'}`}>{String(i + 1).padStart(2, '0')}</span>
                {(!collapsed || mobile) && <span className="truncate">{v.label}</span>}
            </>
        )
        const cls = mobile
            ? `shrink-0 h-9 px-3 rounded-full border text-[13px] flex items-center gap-2 ${on ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`
            : item(on)
        return onSelect ? (
            <button key={v.id} type="button" onClick={() => onSelect(v.id)} className={cls} aria-current={on ? 'page' : undefined} title={v.label}>{content}</button>
        ) : (
            <Link key={v.id} href={`/admin${v.hash}`} className={cls} title={v.label}>{content}</Link>
        )
    }

    const pageEl = (p: typeof PAGES[number], mobile = false) => {
        const on = active === p.id
        const cls = mobile
            ? `shrink-0 h-9 px-3 rounded-full border text-[13px] flex items-center ${on ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`
            : item(on)
        return (
            <Link key={p.id} href={p.href} className={cls} aria-current={on ? 'page' : undefined} title={p.label}>
                {(!collapsed || mobile) ? p.label : p.label[0]}
            </Link>
        )
    }

    return (
        <div className="flex min-h-[calc(100vh-112px)]">
            <aside
                className={`hidden lg:flex flex-col shrink-0 border-r border-border sticky top-[112px] h-[calc(100vh-112px)] transition-[width] duration-300 ${collapsed ? 'w-[76px]' : 'w-[248px]'}`}
            >
                <div className="flex items-center justify-between px-5 pt-2 pb-6">
                    {!collapsed && (
                        <p className="font-heading text-[26px] leading-none tracking-[-0.02em]">Admin <em className="text-muted-foreground">desk</em></p>
                    )}
                    {onToggleCollapsed && (
                        <button
                            type="button"
                            onClick={onToggleCollapsed}
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        </button>
                    )}
                </div>

                <nav aria-label="Admin" className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {!collapsed && <p className="px-3 pb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Content</p>}
                    {VIEWS.map((v, i) => viewEl(v, i))}
                    <div className="h-6" />
                    {!collapsed && <p className="px-3 pb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">People</p>}
                    {PAGES.map(p => pageEl(p))}
                </nav>

                {!collapsed && (
                    <p className="px-6 py-5 border-t border-border font-hand text-[19px] leading-tight text-muted-foreground">
                        upload carefully, someone is reading this the night before.
                    </p>
                )}
            </aside>

            <div className="flex-1 min-w-0">
                {/* Phones and tablets: the same sections as a scrollable row */}
                <nav aria-label="Admin sections" className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-8 pb-4">
                    {VIEWS.map((v, i) => viewEl(v, i, true))}
                    {PAGES.map(p => pageEl(p, true))}
                </nav>
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 lg:px-12 pb-24 pt-2">
                    {children}
                </div>
            </div>
        </div>
    )
}
