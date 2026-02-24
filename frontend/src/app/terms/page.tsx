import { Footer } from '@/components/layout/LandingComponents'
import { Scale } from 'lucide-react'

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/10 transition-colors duration-500">
            <div className="pt-32 pb-24 px-6 text-center">
                <div className="container mx-auto max-w-3xl space-y-8">
                    <h1 className="text-4xl md:text-6xl font-heading font-semibold tracking-tight">Terms of Use</h1>
                    <p className="text-xl text-muted-foreground font-medium leading-relaxed italic">
                        "Common sense rules for a better semester."
                    </p>
                </div>
            </div>

            <section className="py-24 px-6">
                <div className="container mx-auto max-w-2xl space-y-16">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-heading font-semibold">1. Academic Use Only</h2>
                        <p className="text-base text-muted-foreground font-medium leading-relaxed">
                            This platform is built for studying. Please use the materials for your personal academic growth. Sharing account access or attempting to scrape content is strictly against the spirit of what we're building.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-heading font-semibold">2. Respect the Material</h2>
                        <p className="text-base text-muted-foreground font-medium leading-relaxed">
                            While we curate these resources, we don't own the original academic rights to every document. Please respect the authors and creators. Redistribution of these materials outside of this platform is not permitted.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-heading font-semibold">3. Account Responsibility</h2>
                        <p className="text-base text-muted-foreground font-medium leading-relaxed">
                            Keep your login details safe. Since we sync your progress and reading history, your account is personal to your academic journey.
                        </p>
                    </div>

                    <div className="pt-16 border-t border-border/10 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/30">
                        <Scale className="w-4 h-4 text-primary/20" />
                        Play fair, study hard
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
