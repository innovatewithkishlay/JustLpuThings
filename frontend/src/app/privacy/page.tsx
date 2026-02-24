import { Footer } from '@/components/layout/LandingComponents'
import { ShieldCheck } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/10 transition-colors duration-500">
            <div className="pt-32 pb-24 px-6 text-center">
                <div className="container mx-auto max-w-3xl space-y-8">
                    <h1 className="text-4xl md:text-6xl font-heading font-semibold tracking-tight">Privacy & Principles</h1>
                    <p className="text-xl text-muted-foreground font-medium leading-relaxed italic">
                        "Your progress is yours. Your focus is ours."
                    </p>
                </div>
            </div>

            <section className="py-24 px-6">
                <div className="container mx-auto max-w-2xl space-y-16">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-heading font-semibold">Strict No-Download Policy</h2>
                        <p className="text-base text-muted-foreground font-medium leading-relaxed">
                            We value the materials provided here as much as you do. To maintain the integrity of our structured curriculum and ensure everyone uses the most up-to-date versions, **we do not permit downloading of any notes or materials.**
                        </p>
                        <p className="text-base text-muted-foreground font-medium leading-relaxed">
                            The platform is designed for reading, not hoarding. By syncing your progress and bookmarks, we make sure you can access your studies anywhere without cluttering your desktop with outdated PDFs.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-heading font-semibold">What We Track (and Why)</h2>
                        <ul className="space-y-4 text-base text-muted-foreground font-medium">
                            <li className="flex items-start gap-3">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                <span><strong>Reading Progress</strong>: Just so we can put you back exactly where you left off.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                <span><strong>Study Momentum</strong>: We visualize your time spent per subject to help you see your own growth.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                <span><strong>No Data Selling</strong>: We’re students, not data brokers. We have zero interest in your personal data beyond what makes this tool work.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="pt-16 border-t border-border/10 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/30">
                        <ShieldCheck className="w-4 h-4 text-primary/20" />
                        A safe place for scholars
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
