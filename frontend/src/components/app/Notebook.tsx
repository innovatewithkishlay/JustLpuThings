import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Shared pieces for the signed-in pages. Same language as the home page:
// a mono label, a serif title, hairlines instead of glowing cards.

export function Kicker({ n, children, className = '' }: { n?: string; children: React.ReactNode; className?: string }) {
    return (
        <p className={`font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-2.5 ${className}`}>
            {n && <span className="text-ink-red">{n}</span>}
            {n && <span className="h-px w-6 bg-border" />}
            {children}
        </p>
    )
}

type Crumb = { label: string; href?: string }

export function PageHead({
    crumbs,
    back,
    title,
    sub,
    actions,
}: {
    crumbs?: Crumb[]
    back?: string
    title: React.ReactNode
    sub?: React.ReactNode
    actions?: React.ReactNode
}) {
    return (
        <header className="pb-8 mb-10 border-b border-foreground/80">
            {(crumbs || back) && (
                <nav aria-label="Breadcrumb" className="flex items-center gap-3 mb-6 font-mono text-[12px] text-muted-foreground">
                    {back && (
                        <Link href={back} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors" aria-label="Back">
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                    )}
                    {crumbs?.map((c, i) => (
                        <span key={i} className="flex items-center gap-3">
                            {i > 0 && <span className="opacity-40">/</span>}
                            {c.href ? (
                                <Link href={c.href} className="hover:text-foreground underline-offset-4 hover:underline">{c.label}</Link>
                            ) : (
                                <span className="text-foreground">{c.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="min-w-0">
                    <h1 className="font-heading font-normal text-[38px] md:text-[52px] leading-[1.02] tracking-[-0.03em]">{title}</h1>
                    {sub && <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground max-w-2xl">{sub}</p>}
                </div>
                {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
            </div>
        </header>
    )
}

export function SectionHead({ n, title, aside }: { n?: string; title: React.ReactNode; aside?: React.ReactNode }) {
    return (
        <div className="flex items-end justify-between gap-4 mb-5">
            <div>
                {n && <Kicker n={n} className="mb-2">{''}</Kicker>}
                <h2 className="font-heading font-normal text-[26px] leading-tight tracking-[-0.02em]">{title}</h2>
            </div>
            {aside && <div className="text-sm text-muted-foreground">{aside}</div>}
        </div>
    )
}

export function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
    return (
        <div className="py-5 pr-4">
            <dt className="text-[13px] text-muted-foreground">{label}</dt>
            <dd className="mt-2 font-heading text-[34px] leading-none tracking-[-0.02em] tabular-nums">{value}</dd>
            {note && <dd className="mt-2 font-mono text-[11px] text-muted-foreground">{note}</dd>}
        </div>
    )
}

export function Tag({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'red' | 'blue' | 'green' }) {
    const tones = {
        plain: 'text-muted-foreground border-border',
        red: 'text-ink-red border-ink-red/40',
        blue: 'text-ink-blue border-ink-blue/40',
        green: 'text-emerald-700 dark:text-emerald-400 border-emerald-600/40',
    }
    return (
        <span className={`inline-flex items-center h-5 px-1.5 rounded font-mono text-[10.5px] uppercase tracking-[0.04em] border ${tones[tone]}`}>
            {children}
        </span>
    )
}

export function EmptyNote({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="py-16 px-6 text-center border border-dashed border-border rounded-xl">
            <p className="font-heading text-[24px] tracking-[-0.02em]">{title}</p>
            {children && <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{children}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    )
}

export function ProgressLine({ value }: { value: number }) {
    const pct = Math.max(0, Math.min(100, Math.round(value)))
    return (
        <div className="h-[3px] w-full bg-border rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
        </div>
    )
}
