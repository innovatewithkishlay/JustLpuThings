import { Footer } from '@/components/layout/LandingComponents'
import { Mail, MessageCircle, Youtube } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/10 transition-colors duration-500">
            <div className="pt-32 pb-24 px-6 text-center">
                <div className="container mx-auto max-w-3xl space-y-8">
                    <h1 className="text-4xl md:text-6xl font-heading font-semibold tracking-tight">Say Hello</h1>
                    <p className="text-xl text-muted-foreground font-medium leading-relaxed italic">
                        "We're usually in class, but we always check our mail."
                    </p>
                </div>
            </div>

            <section className="py-24 px-6">
                <div className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-heading font-semibold">Get in Touch</h2>
                            <p className="text-base text-muted-foreground font-medium leading-relaxed">
                                Whether you found a broken link, want to suggest a new subject, or just want to say thanks—we'd love to hear from you.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <Link href="mailto:bhavishyakumar4344@gmail.com" className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Email Us</p>
                                    <p className="text-sm font-semibold">bhavishyakumar4344@gmail.com</p>
                                </div>
                            </Link>

                            <Link href="https://youtube.com/@JustLpuThings" target="_blank" className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                    <Youtube className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Watch Us</p>
                                    <p className="text-sm font-semibold">@JustLpuThings</p>
                                </div>
                            </Link>

                            <Link href="https://whatsapp.com/channel/0029Vartrkr2P59gGzeM7E1B" target="_blank" className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Community</p>
                                    <p className="text-sm font-semibold">Join the WhatsApp Channel</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 rounded-[40px] bg-muted/20 border border-border/40 space-y-8 relative overflow-hidden">
                        <div className="space-y-4 relative z-10">
                            <h3 className="text-xl font-heading font-semibold italic">"The best notes are the ones we share."</h3>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                This platform is a collective effort. If you have high-quality notes or materials that could help others, reach out. We'll make sure they get a proper place in the academic graph.
                            </p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
