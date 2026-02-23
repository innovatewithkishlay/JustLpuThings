"use client"

import { motion, Variants } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Layers, ShieldCheck, Zap } from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
}

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0,transparent_50%)] opacity-[0.03] dark:opacity-[0.06] pointer-events-none" />

        <section className="container mx-auto px-6 flex flex-col items-center text-center z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl space-y-8">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v2.0 Premium Platform Live
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tighter text-foreground leading-[1.05]">
              The strictly hardened <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">Academic Vault.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
              Experience seamless material discovery with lightning-fast full-text search, deep observation telemetry, and military-grade access limitations.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-base shadow-primary/20 shadow-2xl active:scale-[0.98] transition-all rounded-full font-semibold">
                  Access Vault <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Abstract Hero Image/Graphic */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl mt-24 aspect-[21/9] rounded-3xl bg-surface border border-border soft-shadow relative overflow-hidden flex items-center justify-center group"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent" />

            <div className="z-10 text-center space-y-6 transform group-hover:scale-105 transition-transform duration-700 ease-out">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 soft-shadow">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <p className="text-primary font-mono text-sm font-semibold tracking-widest uppercase">[ Secure Datastore Mounted ]</p>
            </div>
          </motion.div>
        </section>

        {/* Feature Highlights */}
        <section className="container mx-auto px-6 py-32 z-10">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-surface border border-border soft-shadow transition-transform hover:-translate-y-2 duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3">TSVector Search Query</h3>
              <p className="text-muted-foreground font-medium">Instantly index and discover complex academic structures without heavy scanning latencies natively.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-surface border border-border soft-shadow transition-transform hover:-translate-y-2 duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3">Abuse Defenses</h3>
              <p className="text-muted-foreground font-medium">Native Redis sliding-window limiters detecting anomalies and blocking hot-linking rips instantly.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-surface border border-border soft-shadow transition-transform hover:-translate-y-2 duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3">Edge Delivered</h3>
              <p className="text-muted-foreground font-medium">Static materials streamed globally via Cloudflare R2 decoupled completely from app nodes dynamically.</p>
            </motion.div>
          </motion.div>
        </section>
      </main>

    </div>
  )
}
