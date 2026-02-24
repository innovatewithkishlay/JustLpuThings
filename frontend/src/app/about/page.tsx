import { Footer } from '@/components/layout/LandingComponents'
import { Heart, Award } from 'lucide-react'
import Image from 'next/image'

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
                <div className="container mx-auto max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-12 text-lg text-muted-foreground font-medium underline-offset-4 decoration-primary/20 leading-relaxed">
                        <p>
                            We’re just two third-year students who were tired of the same old cycle: exams approaching, WhatsApp groups exploding with random PDFs, and Drive links that inevitably expired right when you needed them most.
                        </p>

                        <p>
                            Just LPU Things started as a folder on our laptops where we tried to make sense of the syllabus. We realized that if we were struggling, thousands of others probably were too.
                        </p>

                        <div className="p-8 rounded-[2.5rem] bg-surface border border-border/50 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                                <Award className="w-5 h-5" /> Recent Milestone
                            </div>
                            <h2 className="text-2xl font-heading font-semibold text-foreground italic">"Being a Peer Tutor changed my perspective."</h2>
                            <p className="text-base leading-relaxed">
                                Recently, I was selected as a **Peer Tutor at Lovely Professional University**. Teaching fellow students in person taught us one thing: clarity is everything. That same teaching-first mindset is what drives every unit we upload here.
                            </p>
                        </div>
                    </div>

                    <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700">
                        <Image
                            src="/assets/peer-tutor.jpg"
                            alt="Peer Tutor Recognition"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-xs font-bold uppercase tracking-widest opacity-80">Recognition Ceremony &bull; LPU</p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto max-w-2xl mt-32 space-y-12 text-lg text-muted-foreground font-medium leading-relaxed">
                    <div className="space-y-4 text-foreground">
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
