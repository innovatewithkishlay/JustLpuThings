import { Metadata } from 'next'
import {
  HomeHero,
  CodeTicker,
  InsideASubject,
  ExamWeek,
  Playlists,
  WhoMadeThis,
  StudentMessages,
  LastPage,
  HomeFooter
} from '@/components/home/HomeSections'

export const metadata: Metadata = {
  title: 'Just LPU Things — Every LPU exam, one place.',
  description: 'Unit-wise notes, PYQs, CA and mid-term papers, and video lectures for every LPU semester. Free, no ads, made by seniors who sat the same papers.',
  openGraph: {
    title: 'Just LPU Things — Every LPU exam, one place.',
    description: 'Notes, PYQs, CA and mid-term papers, and lectures for your semester. Built by LPU students, for LPU students.',
    type: 'website',
    url: 'https://justlputhings.com',
  }
}

export default function LandingPage() {
  return (
    <div className="lp lp-tokens min-h-screen antialiased">
      <HomeHero />
      <CodeTicker />
      <InsideASubject />
      <ExamWeek />
      <Playlists />
      <WhoMadeThis />
      <StudentMessages />
      <LastPage />
      <HomeFooter />
    </div>
  )
}
