import Link from 'next/link'
import { Heart } from 'lucide-react'
import { WHATSAPP_COMMUNITY_LINK } from '@/lib/constants'

// Shared footer for the static pages (about, contact, privacy, terms).
// The home page has its own footer in components/home.
export function Footer() {
    return (
        <footer className="py-24 px-6 border-t border-border/10">
            <div className="container mx-auto max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
                    <div className="md:col-span-12 lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-3 text-muted-foreground font-heading font-semibold text-xl italic">
                            Just LPU Things
                        </div>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs">
                            "We know that 2 AM feeling when the exam is tomorrow and you have zero notes. We made this so you don't have to feel that again."
                        </p>
                    </div>

                    <div className="md:col-span-6 lg:col-span-4 grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">Resources</h4>
                            <div className="flex flex-col gap-3">
                                <Link href="/about" className="text-xs font-semibold text-muted-foreground/60 hover:text-foreground transition-all">About Our Story</Link>
                                <Link href="https://www.youtube.com/@JustLPUThings2.0" target="_blank" className="text-xs font-semibold text-muted-foreground/60 hover:text-foreground transition-all">Watch Lectures</Link>
                                <Link href={WHATSAPP_COMMUNITY_LINK} target="_blank" className="text-xs font-semibold text-muted-foreground/60 hover:text-[#25D366] transition-all">WhatsApp Community</Link>
                                <Link href="/contact" className="text-xs font-semibold text-muted-foreground/60 hover:text-foreground transition-all">Say Hello</Link>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">Legal</h4>
                            <div className="flex flex-col gap-3">
                                <Link href="/privacy" className="text-xs font-semibold text-muted-foreground/60 hover:text-foreground transition-all">Privacy Policy</Link>
                                <Link href="/terms" className="text-xs font-semibold text-muted-foreground/60 hover:text-foreground transition-all">Terms of Use</Link>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-6 lg:col-span-4 space-y-6 lg:text-right">
                        <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center lg:justify-end gap-2">
                            <Heart className="w-3 h-3 fill-current text-rose-500/30" /> By third-year students
                        </div>
                        <p className="text-[10px] text-muted-foreground/30 font-medium">
                            &copy; {new Date().getFullYear()} Just LPU Things. All rights reserved. <br />
                            Not affiliated with Lovely Professional University.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
