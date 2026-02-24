import { Footer } from '@/components/layout/LandingComponents'
import { Heart } from 'lucide-react'

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/10 transition-colors duration-500">
            <div className="pt-32 pb-24 px-6 text-center">
                <div className="container mx-auto max-w-3xl space-y-8">
                    <h1 className="text-4xl md:text-6xl font-heading font-semibold tracking-tight">Our Story</h1>
                    <p className="text-xl text-muted-foreground font-medium leading-relaxed italic">
                        "We built what we wish we had in our first year."
                    </p>
                </div>
            </div>

            <section className="py-24 px-6">
                <div className="container mx-auto max-w-2xl space-y-12 text-lg text-muted-foreground font-medium underline-offset-4 decoration-primary/20 leading-relaxed">
                    <p>
                        We’re just two third-year students who were tired of the same old cycle: exams approaching, WhatsApp groups exploding with random PDFs, and Drive links that inevitably expired right when you needed them most.
                    </p>

                    <p>
                        Just LPU Things didn't start as a "startup" or a "product." It started as a folder on our laptops where we tried to make sense of the syllabus. We realized that if we were struggling, thousands of others probably were too.
                    </p>

                    <p>
                        So, we spent our weekends building this. A place where notes are actually organized, videos are clear, and the interface doesn't scream at you with ads or generic stock photos.
                    </p>

                    <div className="pt-8 space-y-4 text-foreground">
                        <h2 className="text-2xl font-heading font-semibold">Our Mission</h2>
                        <p>
                            To make the semester a little lighter for everyone. No corporate fluff, no generic advice—just the materials you need to get through your units with calm confidence.
                        </p>
                    </div>

                    <div className="pt-16 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                        <Heart className="w-4 h-4 text-rose-500/30 fill-current" />
                        Built with love in the library
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
