import { Metadata } from 'next'
import {
  Hero,
  AboutCreator,
  Experience,
  TeachingImpact,
  ClosingCTA,
  Footer
} from '@/components/layout/LandingComponents'

export const metadata: Metadata = {
  title: 'Just LPU Things — Notes that actually help.',
  description: 'Built by a senior who survived the same exams you’re preparing for. Structured notes, clear videos, and zero drama.',
  openGraph: {
    title: 'Just LPU Things — Study Smart. Laugh a Little.',
    description: 'No more searching for notes. One place for everything, built for students by a student.',
    type: 'website',
    url: 'https://justlputhings.com',
  }
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/10 transition-colors duration-500">
      <Hero />
      <AboutCreator />
      <Experience />
      <TeachingImpact />
      <ClosingCTA />
      <Footer />
    </main>
  )
}
