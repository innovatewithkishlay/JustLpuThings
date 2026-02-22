"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Search, ShieldCheck } from 'lucide-react'

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const stagger: any = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden selection:bg-primary/20">

      {/* Navbar Minimal */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-heading font-bold text-foreground tracking-tight">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>JustLpuThings</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button className="font-medium shadow-primary/25 shadow-lg active:scale-95 transition-transform">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-16">
        <section className="container mx-auto px-6 flex flex-col items-center text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl space-y-8">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v1.0 is now live in production
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-heading font-semibold tracking-tight text-foreground leading-[1.1]">
              The strictly hardened <br /><span className="text-primary">Academic Vault.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience seamless material discovery with lightning-fast full-text search, deep observation telemetry, and military-grade access limitations.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base shadow-primary/25 shadow-xl active:scale-95 transition-all">
                  Access Vault <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Abstract Hero Image/Graphic */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-5xl mt-24 aspect-[21/9] rounded-2xl bg-gradient-to-b from-card to-background border border-border shadow-2xl relative overflow-hidden flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="z-10 text-center space-y-4">
              <BookOpen className="w-16 h-16 mx-auto text-primary/40" />
              <p className="text-muted-foreground font-mono text-sm">[ Secure Cloudflare R2 Datastore Mounted ]</p>
            </div>
          </motion.div>
        </section>

        {/* Feature Highlights */}
        <section className="container mx-auto px-6 py-32">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeUp} className="p-8 rounded-2xl bg-card border border-border soft-shadow transition-transform hover:-translate-y-1">
              <Search className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-heading font-semibold mb-3">Postgres tsvector Search</h3>
              <p className="text-muted-foreground">Instantly index and discover complex academic structures without heavy scanning latencies.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="p-8 rounded-2xl bg-card border border-border soft-shadow transition-transform hover:-translate-y-1">
              <ShieldCheck className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-heading font-semibold mb-3">Abuse Defenses</h3>
              <p className="text-muted-foreground">Native Redis sliding-window limiters detecting anomalies and blocking hot-linking rips instantly.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="p-8 rounded-2xl bg-card border border-border soft-shadow transition-transform hover:-translate-y-1">
              <BookOpen className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-heading font-semibold mb-3">Edge Delivered</h3>
              <p className="text-muted-foreground">Static materials streamed globally via Cloudflare R2 decoupled completely from app nodes.</p>
            </motion.div>
          </motion.div>
        </section>
      </main>

    </div>
  )
}
