"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, Play } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/apiClient'
import { WHATSAPP_COMMUNITY_LINK } from '@/lib/constants'

const YOUTUBE_CHANNEL = 'https://www.youtube.com/@JustLPUThings2.0'

const SUBJECT_CODES = [
    'CSE316', 'INT315', 'CSE325', 'MTH165', 'MTH166', 'CHE110', 'PHY110', 'ECE249',
    'CSE101', 'CSE121', 'CSE320', 'INT306', 'MEC136', 'PEL121', 'PEL125', 'PEL130',
]

/* ── Small pieces ─────────────────────────────────────── */

function useOpenNotes(mode: 'login' | 'register' = 'login') {
    const { isAuthenticated, openAuthModal } = useAuth()
    const router = useRouter()
    return () => (isAuthenticated ? router.push('/dashboard') : openAuthModal(mode))
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const reduce = useReducedMotion()
    return (
        <motion.div
            className={className}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    )
}

/** Margin label in mono, like a section number in a notebook */
function Kicker({ n, children }: { n: string; children: React.ReactNode }) {
    return (
        <p className="lp-mono text-[12px] uppercase tracking-[0.08em] text-[var(--lp-mute)] flex items-center gap-3">
            <span className="text-[var(--lp-red)]">{n}</span>
            <span className="h-px w-8 bg-[var(--lp-line)]" />
            {children}
        </p>
    )
}

/** Hand-drawn red-pen loop around a word */
function PenCircle() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 220 90"
            preserveAspectRatio="none"
            className="absolute -left-[16%] -top-[8%] w-[132%] h-[122%] pointer-events-none overflow-visible"
        >
            <path
                pathLength={1}
                className="lp-draw"
                d="M150 8 C 100 2, 28 10, 12 38 C -2 66, 60 86, 120 82 C 182 78, 214 60, 206 36 C 198 14, 150 6, 96 10"
                fill="none"
                stroke="var(--lp-red)"
                strokeWidth="3.2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

function PenTick({ className = '' }: { className?: string }) {
    return (
        <svg aria-hidden viewBox="0 0 24 24" className={`w-5 h-5 shrink-0 ${className}`}>
            <path d="M3.5 13.5 C 6 15, 8 17.5, 9.5 20 C 12 13, 16 7.5, 21 3.5" fill="none" stroke="var(--lp-red)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/* ── 1. Hero ──────────────────────────────────────────── */

export function HomeHero() {
    const openNotes = useOpenNotes()

    const kit = [
        { label: 'Notes, Unit 1 → Unit 6', tag: 'NOTES' },
        { label: 'Previous year questions', tag: 'PYQ' },
        { label: 'CA papers', tag: 'CA' },
        { label: 'Mid-term papers', tag: 'MTE' },
        { label: 'Full lecture playlist', tag: 'VIDEO' },
    ]

    return (
        <section className="relative pt-32 md:pt-40 pb-20 md:pb-28">
            <div className="lp-wrap grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
                <div className="lg:col-span-7">
                    <p className="lp-hand text-[26px] md:text-[30px] text-[var(--lp-red)] -rotate-[3deg] origin-left mb-5">
                        Jai Hind doston!
                    </p>

                    <h1 className="lp-serif font-[420] text-[46px] sm:text-[68px] md:text-[80px] xl:text-[92px] leading-[0.95]">
                        Every LPU exam,
                        <br />
                        <em className="lp-italic">
                            <span className="relative inline-block">
                                one
                                <PenCircle />
                            </span>{' '}
                            place.
                        </em>
                    </h1>

                    <p className="mt-8 text-[17px] md:text-[19px] leading-[1.6] text-[var(--lp-ink-2)] max-w-[34rem]">
                        Unit-wise notes, PYQs, CA and mid-term papers, and video lectures for your semester.
                        Put together by seniors who sat the same papers, so you can stop digging
                        through WhatsApp groups at <span className="lp-hl text-[var(--lp-ink)]">2 AM the night before</span>.
                    </p>

                    <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
                        <button type="button" onClick={openNotes} className="lp-btn">
                            Open my semester <ArrowRight className="w-4 h-4" />
                        </button>
                        <Link href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer" className="lp-link">
                            <Play className="w-3.5 h-3.5 fill-current" /> Free lectures on YouTube
                        </Link>
                    </div>

                    <dl className="mt-14 pt-6 border-t border-[var(--lp-line)] grid grid-cols-3 gap-4 max-w-[34rem]">
                        {[
                            ['5,000+', 'LPU students'],
                            ['₹0', 'free, no ads'],
                            ['4-in-1', 'notes · PYQ · CA · MTE'],
                        ].map(([big, small]) => (
                            <div key={small}>
                                <dt className="sr-only">{small}</dt>
                                <dd className="lp-serif text-[28px] md:text-[34px] leading-none">{big}</dd>
                                <dd className="mt-2 text-[13px] text-[var(--lp-mute)] leading-snug">{small}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Exam kit card */}
                <div className="lg:col-span-5 relative max-w-[440px] w-full mx-auto lg:mr-0 mb-16 lg:mb-0">
                    <div className="lp-card relative rotate-[1.5deg] rounded-[4px] px-6 pt-9 pb-10 sm:px-8">
                        <span className="lp-tape -top-3 left-1/2 -translate-x-1/2 -rotate-2" />
                        <div className="flex items-center justify-between lp-mono text-[11px] uppercase tracking-[0.08em] text-[var(--lp-mute)]">
                            <span>Exam kit</span>
                            <span className="hidden sm:inline">what opens when you tap a subject</span>
                        </div>
                        <p className="mt-5 lp-mono text-[13px] text-[var(--lp-red)]">CSE316</p>
                        <p className="lp-serif text-[30px] leading-tight">Operating Systems</p>

                        <ul className="mt-6">
                            {kit.map((row) => (
                                <li key={row.tag} className="flex items-center gap-3 py-3 border-t border-dashed border-[var(--lp-line)]">
                                    <PenTick />
                                    <span className="text-[15px]">{row.label}</span>
                                    <span className="lp-leader" />
                                    <span className="lp-mono text-[11px] text-[var(--lp-mute)]">{row.tag}</span>
                                </li>
                            ))}
                        </ul>

                    </div>

                    {/* Sticky note — a real message from a student */}
                    <figure className="absolute -bottom-20 -left-2 sm:-left-10 w-[200px] rotate-[-5deg] bg-[var(--lp-sticky)] text-[#2a2418] px-5 pt-4 pb-5 shadow-[0_14px_24px_-14px_rgba(0,0,0,0.45)]">
                        <blockquote className="lp-hand text-[22px] font-medium leading-[1.05]">
                            “first semister me 8 cgpa bana ❤️”
                        </blockquote>
                        <figcaption className="mt-2 text-[11px] opacity-70">— a student, on WhatsApp</figcaption>
                    </figure>
                </div>
            </div>
        </section>
    )
}

/* ── 2. Subject code ticker ───────────────────────────── */

export function CodeTicker() {
    const codes = [...SUBJECT_CODES, ...SUBJECT_CODES]
    return (
        <div className="bg-[var(--lp-ink)] text-[var(--lp-paper)] py-4 overflow-hidden" aria-label="Subjects covered include CSE316, INT315, MTH165 and more">
            <div className="lp-ticker flex w-max lp-mono text-[14px]" aria-hidden>
                {codes.map((c, i) => (
                    <span key={i} className="flex items-center">
                        <span className="px-6">{c}</span>
                        <span className="opacity-30">/</span>
                    </span>
                ))}
            </div>
        </div>
    )
}

/* ── 3. What's inside a subject ───────────────────────── */

export function InsideASubject() {
    const index = [
        { n: '01', title: 'Notes, unit by unit', note: 'Unit 1 – 6', hint: 'the syllabus order, not random PDFs' },
        { n: '02', title: 'Previous year questions', note: 'PYQ', hint: 'what keeps coming back every year' },
        { n: '03', title: 'CA papers', note: 'CA', hint: 'so CA stops being a surprise' },
        { n: '04', title: 'Mid-term papers', note: 'MTE', hint: 'for the week everyone panics' },
        { n: '05', title: 'Video lectures', note: 'YouTube', hint: 'for when notes aren’t enough' },
    ]

    return (
        <section className="py-24 md:py-32">
            <div className="lp-wrap grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                <Reveal className="lg:col-span-5 lg:sticky lg:top-28 self-start">
                    <Kicker n="01">Inside every subject</Kicker>
                    <h2 className="mt-6 lp-serif text-[38px] md:text-[52px] leading-[1.02]">
                        Tap a subject. Everything for the exam is <em className="lp-italic">already there.</em>
                    </h2>
                    <p className="mt-6 text-[17px] leading-[1.65] text-[var(--lp-ink-2)] max-w-[30rem]">
                        Semester → subject → unit. Three taps, and no more opening
                        <span className="lp-mono text-[14px] mx-1 px-1.5 py-0.5 rounded bg-[var(--lp-paper-2)]">New Folder (4)</span>
                        hoping it’s the right one.
                    </p>
                </Reveal>

                <Reveal delay={0.1} className="lg:col-span-7">
                    <div className="lp-ruled lp-card rounded-[4px] pl-16 pr-6 sm:pr-10 pt-[47px] pb-12 relative">
                        <p className="absolute top-3 left-16 lp-hand text-[22px] text-[var(--lp-blue)]">index —</p>
                        <ol>
                            {index.map((row) => (
                                <li key={row.n} className="relative">
                                    <span className="absolute -left-12 top-0 h-12 flex items-center lp-mono text-[12px] text-[var(--lp-red)]">{row.n}</span>
                                    <div className="h-12 flex items-center gap-3">
                                        <span className="lp-serif text-[19px] sm:text-[24px] whitespace-nowrap">{row.title}</span>
                                        <span className="lp-leader" />
                                        <span className="lp-mono text-[12px] sm:text-[13px] whitespace-nowrap">{row.note}</span>
                                    </div>
                                    <p className="h-12 flex items-center lp-hand text-[17px] sm:text-[21px] text-[var(--lp-blue)] leading-none whitespace-nowrap">
                                        {row.hint}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </Reveal>
            </div>
        </section>
    )
}

/* ── 4. Exam week ─────────────────────────────────────── */

export function ExamWeek() {
    const days = [
        {
            when: 'T – 7 days',
            title: 'Finally, some actual order.',
            body: 'Sorted by semester, subject and unit. No scrolling through 500-message Telegram chats to find one diagram.',
            aside: 'CA and mid-term PYQs included.',
        },
        {
            when: 'T – 1 night',
            title: 'It remembers where you stopped.',
            body: 'Started on your laptop at 8 PM, finishing on your phone at 2 AM? The reader keeps your page, so you never hunt for Unit 3, slide 42 again.',
            aside: 'Works on patchy hostel Wi-Fi.',
        },
        {
            when: 'Exam morning',
            title: 'Nothing to download.',
            body: 'Everything opens right in the browser. Fast, clean, and no Unit1_Final_v3_REAL.pdf cluttering your downloads.',
            aside: 'Zero ads. Zero distractions.',
        },
    ]

    return (
        <section className="py-24 md:py-32 bg-[var(--lp-paper-2)]">
            <div className="lp-wrap">
                <Reveal className="max-w-[44rem]">
                    <Kicker n="02">How exam week actually goes</Kicker>
                    <h2 className="mt-6 lp-serif text-[38px] md:text-[52px] leading-[1.02]">
                        Not more features. <em className="lp-italic">Less panic.</em>
                    </h2>
                </Reveal>

                <ol className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
                    <span aria-hidden className="hidden md:block absolute top-[7px] left-0 right-0 h-px bg-[var(--lp-ink)] opacity-20" />
                    {days.map((d, i) => (
                        <Reveal key={d.when} delay={i * 0.08}>
                            <li className="relative list-none">
                                <span aria-hidden className="block w-[15px] h-[15px] rounded-full border-2 border-[var(--lp-ink)] bg-[var(--lp-paper-2)] relative z-10" />
                                <p className="mt-6 lp-mono text-[13px] text-[var(--lp-red)]">{d.when}</p>
                                <h3 className="mt-3 lp-serif text-[26px] leading-[1.15]">{d.title}</h3>
                                <p className="mt-4 text-[16px] leading-[1.65] text-[var(--lp-ink-2)]">{d.body}</p>
                                <p className="mt-5 lp-hand text-[21px] text-[var(--lp-blue)]">{d.aside}</p>
                            </li>
                        </Reveal>
                    ))}
                </ol>
            </div>
        </section>
    )
}

/* ── 5. YouTube playlists ─────────────────────────────── */

const PLAYLISTS = [
    { code: 'CSE316', title: 'Operating Systems', desc: 'Processes, scheduling, deadlocks — the things that actually show up in exams.', link: 'https://youtube.com/playlist?list=PLZKnAKf7S_gQhcGUkd4DuA3cS51FIn7vt&si=MM9H5XWU1eQ4sSJN' },
    { code: 'INT315', title: 'Internet Programming Lab', desc: 'HTML, CSS, JS, PHP walkthroughs built for the lab practicals.', link: 'https://youtube.com/playlist?list=PLZKnAKf7S_gRVC4nnhPewqm_3MkPOzyE4&si=wOhRACMS5uTdJMJC' },
    { code: 'CSE325', title: 'Design & Analysis of Algorithms', desc: 'Greedy, DP, divide & conquer — without the jargon.', link: 'https://youtube.com/playlist?list=PLZKnAKf7S_gQB9lpojFRj2H89n4043nwD&si=g_Dr-CGQrh15-cPm' },
    { code: 'ECE201', title: 'Electronics', desc: 'Diodes, transistors, op-amps — explained from scratch for CS students.', link: 'https://youtube.com/playlist?list=PLZKnAKf7S_gTHyybvYIa9zr6FfqsifXzs&si=5_9nLBFQQra7VBNj' },
    { code: 'CHE110', title: 'Chemistry', desc: 'Chemical bonding, thermodynamics, and everything the syllabus asks for.', link: 'https://youtube.com/playlist?list=PLZKnAKf7S_gQYYygobq6619WBZmpq_zZe&si=BsltHDUuWcUErOb9' },
    { code: 'MTH165/166', title: 'Mathematics', desc: 'Matrices, integration, Fourier series — no skipping the hard parts.', link: 'https://youtube.com/playlist?list=PLZKnAKf7S_gSUTCVWPyRNgjWCJIUjzsbs&si=KPX4iDbugV568SQi' },
]

export function Playlists() {
    return (
        <section className="py-24 md:py-32">
            <div className="lp-wrap">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <Reveal className="max-w-[40rem]">
                        <Kicker n="03">Free on YouTube</Kicker>
                        <h2 className="mt-6 lp-serif text-[38px] md:text-[52px] leading-[1.02]">
                            Lectures for when the notes <em className="lp-italic">aren’t enough.</em>
                        </h2>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <Link href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer" className="lp-link text-[15px]">
                            See the whole channel <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </Reveal>
                </div>

                <ul className="mt-14 border-t border-[var(--lp-ink)]">
                    {PLAYLISTS.map((pl) => (
                        <li key={pl.code}>
                            <Link
                                href={pl.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group grid grid-cols-[1fr_auto] md:grid-cols-[150px_1.1fr_1.6fr_auto] items-center gap-x-6 gap-y-1 py-6 border-b border-[var(--lp-line)] transition-colors hover:bg-[var(--lp-card)] md:px-3 md:-mx-3"
                            >
                                <span className="lp-mono text-[13px] text-[var(--lp-red)] col-span-2 md:col-span-1">{pl.code}</span>
                                <span className="lp-serif text-[24px] md:text-[26px] leading-tight">{pl.title}</span>
                                <span className="hidden md:block text-[15px] text-[var(--lp-ink-2)] leading-relaxed">{pl.desc}</span>
                                <span className="row-start-2 col-start-2 md:row-auto md:col-auto flex items-center gap-2 text-[14px] font-semibold">
                                    <span className="hidden sm:inline">Watch</span>
                                    <span className="w-9 h-9 rounded-full border border-[var(--lp-line)] flex items-center justify-center transition-colors group-hover:bg-[var(--lp-ink)] group-hover:text-[var(--lp-paper)] group-hover:border-[var(--lp-ink)]">
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                    </span>
                                </span>
                                <span className="md:hidden col-span-2 text-[15px] text-[var(--lp-ink-2)] leading-relaxed">{pl.desc}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

/* ── 6. Who made this ─────────────────────────────────── */

function Polaroid({ src, alt, caption, className = '', tape = 'left' }: { src: string; alt: string; caption: string; className?: string; tape?: 'left' | 'right' }) {
    return (
        <figure className={`absolute bg-[#fdfbf6] p-3 pb-0 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] ${className}`}>
            <span className={`lp-tape -top-3 ${tape === 'left' ? '-left-4 -rotate-[30deg]' : '-right-4 rotate-[30deg]'}`} />
            <div className="relative aspect-square w-full overflow-hidden bg-[#e9e4d8]">
                <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 300px, 60vw" className="object-cover" />
            </div>
            <figcaption className="lp-hand text-[20px] text-[#2a2418] text-center py-3">{caption}</figcaption>
        </figure>
    )
}

export function WhoMadeThis() {
    return (
        <section className="py-24 md:py-32 border-t border-[var(--lp-line)]">
            <div className="lp-wrap grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center">
                <Reveal className="lg:col-span-6 order-2 lg:order-1">
                    <div className="relative h-[470px] sm:h-[620px] max-w-[520px] mx-auto">
                        <Polaroid
                            src="/assets/peer-tutor.jpg"
                            alt="Our admin receiving the Peer Tutor certificate at LPU"
                            caption="certificate day ✌️"
                            className="w-[58%] left-0 top-0 -rotate-[5deg] z-20"
                        />
                        <Polaroid
                            src="/assets/classroom.jpg"
                            alt="Peer tutoring sessions in an LPU classroom"
                            caption="tutoring, Sep–Dec ’25"
                            className="w-[54%] right-0 top-[18%] rotate-[4deg] z-30"
                            tape="right"
                        />
                        <Polaroid
                            src="/assets/certificate.jpg"
                            alt="Certificate of Excellence from the Division of Student Relationship"
                            caption="yes, it’s real"
                            className="w-[46%] left-[6%] bottom-0 rotate-[3deg] z-10"
                        />
                    </div>
                </Reveal>

                <Reveal delay={0.1} className="lg:col-span-6 order-1 lg:order-2">
                    <Kicker n="04">Who’s behind this</Kicker>
                    <h2 className="mt-6 lp-serif text-[38px] md:text-[52px] leading-[1.02]">
                        We were the ones searching WhatsApp groups <em className="lp-italic">at 2 AM.</em>
                    </h2>
                    <div className="mt-8 space-y-5 text-[17px] leading-[1.7] text-[var(--lp-ink-2)] max-w-[34rem]">
                        <p>
                            Notes were scattered across a hundred groups. Drive links died the night before
                            the paper. Half the PDFs were scanned sideways.
                        </p>
                        <p>
                            So we started putting everything for each subject in one place, and recording the
                            lectures we wished we’d had in first year.
                        </p>
                        <p>
                            Our admin was later picked as a <span className="lp-hl text-[var(--lp-ink)]">Peer Tutor at LPU</span> and
                            got a Certificate of Excellence from the Division of Student Relationship for it.
                            Every unit here is written the same way: like we’re explaining it to a junior the
                            night before the exam.
                        </p>
                    </div>
                    <p className="mt-8 lp-hand text-[30px] text-[var(--lp-ink)] -rotate-2 origin-left">
                        — the Just LPU Things team
                    </p>
                </Reveal>
            </div>
        </section>
    )
}

/* ── 7. Student messages ──────────────────────────────── */

type Line = { text: string; hidden?: string }
type Note = { lines: Line[]; name?: string; source: 'whatsapp' | 'site' }

const STATIC_NOTES: Note[] = [
    { source: 'whatsapp', lines: [{ text: 'Bhaiya aap hi hai na youtube pe jo padhate hai' }, { text: 'Agar ha to thank you aap ki wajah se mujhe sab shamaj aa raha hai math aur cse110 ka baas aab ece249 ka bhi video jaldi bana do 🙏' }] },
    { source: 'whatsapp', lines: [{ text: 'Bhai video mai sai kafi questions same aye ❤️' }, { text: 'Paper acha gaya 🔥🔥🔥🔥' }] },
    { source: 'whatsapp', lines: [{ text: 'Thank you aapki wajah se mera first semister me 8 cgpa bana ❤️' }, { text: 'Bhaiya abb please 🥺 second semister me bhi aise hi video daliye ga hath mat choriye ga 4th year tak 🤧' }] },
    { source: 'whatsapp', lines: [{ text: 'OST exam mein exact wahi questions the jo video mein explain kiye the! CGPA ', hidden: '8.7' }, { text: '🎉 Thank you bhaiya!' }] },
    { source: 'whatsapp', lines: [{ text: 'Hello bhaiya, today was my midterm exam for Math. Concepts were clear to me through your videos. Thank you for your time and support ❤️' }] },
    { source: 'whatsapp', lines: [{ text: 'Aapke notes se exam crack kiya! Reg: ', hidden: '12XXXXX' }, { text: 'First time full A grade 🎉🎉' }] },
]

interface PublicFeedback {
    user_name?: string
    content: string
}

function MessageCard({ note, tilt }: { note: Note; tilt: number }) {
    return (
        <figure
            className="lp-card rounded-[6px] p-5 mb-6 break-inside-avoid"
            style={{ transform: `rotate(${tilt}deg)` }}
        >
            <div className="space-y-2">
                {note.lines.map((l, i) => (
                    <p
                        key={i}
                        className="w-fit max-w-full bg-[var(--lp-paper)] rounded-[14px] rounded-tl-[4px] px-3.5 py-2.5 text-[15px] leading-[1.5]"
                    >
                        {l.text}
                        {l.hidden && (
                            <span className="lp-mono blur-[4px] select-none" aria-label="hidden for privacy">{l.hidden}</span>
                        )}
                    </p>
                ))}
            </div>
            <figcaption className="mt-4 flex items-center justify-between text-[12px] text-[var(--lp-mute)]">
                <span>{note.name ? `— ${note.name}` : '— name hidden'}</span>
                <span className="lp-mono uppercase tracking-[0.06em]">{note.source === 'site' ? 'left on site' : 'whatsapp dm'}</span>
            </figcaption>
        </figure>
    )
}

export function StudentMessages() {
    const { data: feedbacks = [] } = useQuery({
        queryKey: ['public-feedbacks'],
        queryFn: () => apiClient<PublicFeedback[]>('/feedbacks/public').then((res) => res || []),
    })

    const siteNotes: Note[] = feedbacks
        .filter((f) => f?.content)
        .slice(0, 6)
        .map((f) => ({ source: 'site', name: f.user_name, lines: [{ text: f.content }] }))

    // Interleave site reviews with the WhatsApp messages so neither clumps together
    const notes: Note[] = []
    for (let i = 0; i < Math.max(siteNotes.length, STATIC_NOTES.length); i++) {
        if (STATIC_NOTES[i]) notes.push(STATIC_NOTES[i])
        if (siteNotes[i]) notes.push(siteNotes[i])
    }
    const tilts = [-1.2, 0.8, -0.4, 1.1, -0.8, 0.5]

    return (
        <section className="py-24 md:py-32 bg-[var(--lp-paper-2)]">
            <div className="lp-wrap">
                <Reveal className="max-w-[44rem]">
                    <Kicker n="05">From our inbox</Kicker>
                    <h2 className="mt-6 lp-serif text-[38px] md:text-[52px] leading-[1.02]">
                        We didn’t write <em className="lp-italic">these.</em>
                    </h2>
                    <p className="mt-6 text-[17px] leading-[1.65] text-[var(--lp-ink-2)]">
                        Messages from students after their papers, typos and all. Names and grades are hidden
                        unless they signed it themselves.
                    </p>
                </Reveal>

                <div className="mt-14 columns-1 sm:columns-2 lg:columns-3 gap-6">
                    {notes.map((note, i) => (
                        <MessageCard key={i} note={note} tilt={tilts[i % tilts.length]} />
                    ))}
                </div>
            </div>
        </section>
    )
}

/* ── 8. Last page ─────────────────────────────────────── */

export function LastPage() {
    const openNotes = useOpenNotes('register')
    const { isAuthenticated } = useAuth()

    return (
        <section className="bg-[var(--lp-ink)] text-[var(--lp-paper)] py-24 md:py-36 relative overflow-hidden">
            <div className="lp-wrap grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
                <div className="lg:col-span-8">
                    <p className="lp-hand text-[28px] text-[var(--lp-sticky)] -rotate-2 origin-left">we’ve been there.</p>
                    <h2 className="mt-4 lp-serif text-[56px] sm:text-[80px] md:text-[104px] leading-[0.92]">
                        Exam tomorrow?
                        <br />
                        <em className="lp-italic opacity-60">Start here.</em>
                    </h2>
                </div>
                <div className="lg:col-span-4 flex flex-col items-start gap-6 lg:pb-4">
                    <button
                        type="button"
                        onClick={openNotes}
                        className="lp-btn !bg-[var(--lp-paper)] !text-[var(--lp-ink)]"
                    >
                        {isAuthenticated ? 'Go to my dashboard' : 'Create a free account'} <ArrowRight className="w-4 h-4" />
                    </button>
                    <Link href={WHATSAPP_COMMUNITY_LINK} target="_blank" rel="noopener noreferrer" className="lp-link !decoration-white/25 hover:!decoration-[var(--lp-sticky)]">
                        Follow the WhatsApp channel for updates <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    )
}

export function HomeFooter() {
    const links: [string, string, boolean?][] = [
        ['About', '/about'],
        ['Say hello', '/contact'],
        ['YouTube', YOUTUBE_CHANNEL, true],
        ['WhatsApp channel', WHATSAPP_COMMUNITY_LINK, true],
        ['Privacy', '/privacy'],
        ['Terms', '/terms'],
    ]
    return (
        <footer className="py-14 border-t border-[var(--lp-line)]">
            <div className="lp-wrap flex flex-col md:flex-row md:items-start md:justify-between gap-10">
                <div className="max-w-sm">
                    <p className="lp-serif text-[24px]">Just LPU Things</p>
                    <p className="mt-3 text-[14px] leading-relaxed text-[var(--lp-mute)]">
                        Made by LPU students, for LPU students. Not affiliated with Lovely Professional University.
                    </p>
                </div>
                <nav aria-label="Footer" className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-3 text-[14px]">
                    {links.map(([label, href, external]) => (
                        <Link
                            key={label}
                            href={href}
                            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            className="text-[var(--lp-ink-2)] hover:text-[var(--lp-red)] transition-colors"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
            </div>
            <p className="lp-wrap mt-12 lp-mono text-[12px] text-[var(--lp-mute)]">
                © {new Date().getFullYear()} Just LPU Things
            </p>
        </footer>
    )
}
