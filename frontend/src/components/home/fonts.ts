import { Caveat, Fraunces, Geist, Geist_Mono } from 'next/font/google'

// Home page type: an editorial serif for headlines, a plain grotesk for
// reading, a mono for course codes, and a handwriting face for margin notes.
export const homeSerif = Fraunces({
    variable: '--font-lp-serif',
    subsets: ['latin'],
    style: ['normal', 'italic'],
    axes: ['SOFT', 'WONK', 'opsz'],
})

export const homeSans = Geist({
    variable: '--font-lp-sans',
    subsets: ['latin'],
})

export const homeMono = Geist_Mono({
    variable: '--font-lp-mono',
    subsets: ['latin'],
})

export const homeHand = Caveat({
    variable: '--font-lp-hand',
    subsets: ['latin'],
    weight: ['500', '700'],
})

export const homeFontVars = [homeSerif, homeSans, homeMono, homeHand].map(f => f.variable).join(' ')
