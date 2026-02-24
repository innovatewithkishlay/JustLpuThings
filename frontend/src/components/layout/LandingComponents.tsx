"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
    ArrowRight,
    Play,
    ExternalLink,
    Clock,
    Layout,
    CloudOff,
    Heart
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8 } }
}

const slideUp = {
    hidden: { y: 100, opacity: 0 },
    visible: (custom: number) => ({
        y: 0,
        opacity: 1,
        transition: {
            duration: 1,
            delay: custom * 0.2,
            ease: [0.215, 0.61, 0.355, 1] as any
        }
    })
}

export function Hero() {
    return (
        <section className="pt-40 pb-24 px-6 text-center">
            <div className="container mx-auto max-w-6xl flex flex-col items-center">
                <div className="space-y-2 mb-10">
                    <div className="overflow-hidden py-1">
                        <motion.h1
                            custom={0}
                            initial="hidden"
                            animate="visible"
                            variants={slideUp}
                            className="text-4xl md:text-7xl font-heading font-semibold tracking-tight text-foreground leading-[1.1]"
                        >
                            Notes that actually help.
                        </motion.h1>
                    </div>
                    <div className="overflow-hidden py-1">
                        <motion.h2
                            custom={1}
                            initial="hidden"
                            animate="visible"
                            variants={slideUp}
                            className="text-4xl md:text-7xl font-heading font-semibold tracking-tight text-muted-foreground/60 italic leading-[1.1]"
                        >
                            Study without the chaos.
                        </motion.h2>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="flex flex-col items-center"
                >
                    <p className="text-lg md:text-xl text-muted-foreground font-medium mb-12 leading-relaxed max-w-xl mx-auto">
                        We built this because we struggled through the same semester as you. No drama, no scattered links, just your materials in one place.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/register">
                            <Button size="lg" className="h-16 px-10 text-sm font-semibold rounded-2xl shadow-none hover:bg-primary/90 transition-all">
                                Start Reading
                            </Button>
                        </Link>
                        <Link href="https://youtube.com/@JustLpuThings" target="_blank">
                            <Button variant="ghost" size="lg" className="h-16 px-10 text-sm font-semibold rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                                <Play className="mr-2 w-4 h-4 fill-current" /> Watch Videos
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-20 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                        Built for students by students
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export function AboutCreator() {
    const playlists = [
        {
            title: "Web Designing",
            link: "https://youtube.com/playlist?list=PLZKnAKf7S_gRYhS4PsN87h2kdNAZmjqSr",
            desc: "Clear explanations for INT306. No fluff."
        },
        {
            title: "Physics Fundamentals",
            link: "https://youtube.com/playlist?list=PLZKnAKf7S_gQB9lpojFRj2H89n4043nwD",
            desc: "The stuff that actually comes in exams."
        },
        {
            title: "Object Oriented Programming",
            link: "https://youtube.com/playlist?list=PLZKnAKf7S_gTHyybvYIa9zr6FfqsifXzs",
            desc: "CSE121 made surprisingly easy."
        }
    ]

    return (
        <section className="py-32 px-6 bg-muted/20">
            <div className="container mx-auto max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-24">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="lg:col-span-2 space-y-6"
                    >
                        <h2 className="text-3xl font-heading font-semibold tracking-tight">Why We Built This</h2>
                        <p className="text-base text-muted-foreground font-medium leading-relaxed">
                            We were tired of searching for notes everywhere. WhatsApp groups are a mess, and Drive links always seem to die right before submittals.
                        </p>
                        <p className="text-base text-muted-foreground font-medium leading-relaxed">
                            No boring lectures here. Just clear explanations, real talk, and notes that actually help you get through your units.
                        </p>
                    </motion.div>

                    <div className="lg:col-span-3 space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-8">Curated Playlists</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {playlists.map((pl, i) => (
                                <Link
                                    key={i}
                                    href={pl.link}
                                    target="_blank"
                                    className="group p-6 rounded-3xl bg-surface border border-border/50 hover:border-primary/30 transition-all flex flex-col justify-between"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-heading font-semibold text-lg">{pl.title}</h4>
                                            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all" />
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium leading-snug">{pl.desc}</p>
                                    </div>
                                    <div className="mt-8 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        Watch Playlist <ArrowRight className="ml-1 w-3 h-3" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export function Experience() {
    const items = [
        {
            title: "You won’t lose your place.",
            desc: "The reader syncs your page automatically. Open it on your phone late at night or your laptop in the morning. It just works.",
            icon: Clock
        },
        {
            title: "Everything’s sorted.",
            desc: "By semester, by subject, by unit. No more scrolling through random files to find that one specific diagram.",
            icon: Layout
        },
        {
            title: "No downloads flying around.",
            desc: "Read directly in the browser. It's clean, fast, and doesn't clutter your desktop with 'Unit1_Final_v2.pdf'.",
            icon: CloudOff
        }
    ]

    return (
        <section className="py-32 px-6">
            <div className="container mx-auto max-w-4xl space-y-32">
                <div className="max-w-2xl">
                    <h2 className="text-3xl font-heading font-semibold mb-8">What you'll notice</h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                        It's not about features. It's about less stress.
                    </p>
                </div>

                <div className="space-y-24">
                    {items.map((item, i) => (
                        <motion.div
                            key={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={fadeIn}
                            className={`flex flex-col md:flex-row gap-12 items-start ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                        >
                            <div className="flex-1 space-y-4">
                                <item.icon className="w-8 h-8 text-primary/40 mb-2" />
                                <h3 className="text-2xl font-heading font-semibold leading-tight">{item.title}</h3>
                                <p className="text-base text-muted-foreground font-medium leading-relaxed max-w-md">
                                    {item.desc}
                                </p>
                            </div>
                            <div className="flex-1 w-full aspect-video rounded-3xl bg-muted/30 border border-border/40 overflow-hidden relative flex items-center justify-center group">
                                <div className="p-8 w-full h-full border border-border/50 rounded-2xl bg-surface/50 scale-90 group-hover:scale-95 transition-transform duration-700 opacity-60">
                                    <div className="h-2 w-24 bg-muted rounded-full mb-4" />
                                    <div className="space-y-2">
                                        <div className="h-2 w-full bg-muted/40 rounded-full" />
                                        <div className="h-2 w-full bg-muted/40 rounded-full" />
                                        <div className="h-2 w-2/3 bg-muted/40 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export function ClosingCTA() {
    return (
        <section className="py-40 px-6 text-center border-t border-border/5">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="max-w-3xl mx-auto space-y-12"
            >
                <div className="space-y-4">
                    <h2 className="text-3xl md:text-5xl font-heading font-semibold italic leading-tight">Let’s make this semester lighter.</h2>
                    <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto">
                        No more chasing PDFs in group chats or worrying about outdated materials. We’ve kept it simple so you can just focus on learning.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-2xl mx-auto">
                    {[
                        { title: "Zero Noise", desc: "No ads, no spam, just notes." },
                        { title: "Always Syncing", desc: "Pick up where you left off." },
                        { title: "Properly Sorted", desc: "Everything in its right place." }
                    ].map((item, i) => (
                        <div key={i} className="space-y-2">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground/80">{item.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="pt-8 space-y-6">
                    <Link href="/register" className="inline-block">
                        <Button size="lg" className="h-16 px-12 text-sm font-semibold rounded-2xl shadow-xl shadow-primary/10 hover:translate-y-[-2px] transition-all">
                            Create Account
                        </Button>
                    </Link>
                    <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-[0.2em]">Because we've all been there.</p>
                </div>
            </motion.div>
        </section>
    )
}

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
                                <Link href="https://youtube.com/@JustLpuThings" target="_blank" className="text-xs font-semibold text-muted-foreground/60 hover:text-foreground transition-all">Watch Lectures</Link>
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
