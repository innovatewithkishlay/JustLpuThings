"use client"

import * as React from "react"
import Link from 'next/link'
import Image from 'next/image'
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { Moon, Sun, Monitor, Check, Trophy, TrendingUp, MessageSquare, LayoutGrid, LogOut, Shield, Inbox } from "lucide-react"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

const THEMES = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
] as const

const menuItem = "cursor-pointer rounded-md px-3 py-2.5 text-sm flex items-center gap-2.5 focus:bg-[var(--chrome-soft)] focus:text-[var(--chrome-ink)]"

export function TopNavbar() {
    const { setTheme, theme } = useTheme()
    const pathname = usePathname()
    const router = useRouter()
    const { isAuthenticated, user, isAdmin, openAuthModal, logout } = useAuth()

    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(true)
    const lastScrollY = React.useRef(0)
    const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null)

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            setIsScrolled(currentScrollY > 20)

            // Hide while scrolling down, show while scrolling up
            setIsVisible(!(currentScrollY > lastScrollY.current && currentScrollY > 100))
            lastScrollY.current = currentScrollY

            // Bring it back once scrolling stops
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
            scrollTimeout.current = setTimeout(() => setIsVisible(true), 1000)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
        }
    }, [])

    const handleLogout = async () => {
        await logout()
        toast.success("Logged out successfully")
    }

    // Hide navbar on the distraction-free viewer pages
    if (pathname?.startsWith('/viewer/')) return null;

    // On the home page the chrome picks up the notebook palette
    const tokens = pathname === '/' ? 'lp-tokens' : ''
    const initial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()

    return (
        <motion.header
            initial={{ y: 0 }}
            animate={{ y: isVisible ? 0 : -100 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`${tokens} fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 border-b ${isScrolled
                ? 'bg-[color-mix(in_srgb,var(--chrome-bg)_88%,transparent)] backdrop-blur-md border-[var(--chrome-line)]'
                : 'bg-transparent border-transparent'
                }`}
        >
            <nav className="mx-auto max-w-[1180px] h-16 md:h-[72px] px-4 sm:px-8 flex items-center gap-3 text-[var(--chrome-ink)]">
                {/* Brand */}
                <Link href="/" className="chrome-link flex items-center gap-2.5 rounded-md -ml-1 pl-1 pr-2 py-1 group">
                    <Image
                        src="/logo.png"
                        alt=""
                        width={36}
                        height={36}
                        priority
                        className="w-9 h-9 object-contain transition-transform duration-300 group-hover:-rotate-6"
                    />
                    <span className="chrome-serif text-[21px] leading-none font-[460]">
                        Just LPU <em className="italic" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>Things</em>
                    </span>
                </Link>

                <div className="flex-1" />

                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Theme */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className="chrome-icon-btn" aria-label="Change theme">
                                <Sun className="h-[18px] w-[18px] dark:hidden" />
                                <Moon className="h-[18px] w-[18px] hidden dark:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={`${tokens} chrome-menu w-40 rounded-lg p-1`}>
                            {THEMES.map(({ value, label, icon: Icon }) => (
                                <DropdownMenuItem key={value} onClick={() => setTheme(value)} className={menuItem}>
                                    <Icon className="w-4 h-4 opacity-70" />
                                    {label}
                                    {theme === value && <Check className="w-4 h-4 ml-auto text-[var(--chrome-accent)]" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {isAuthenticated && <NotificationBell />}

                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Account menu"
                                    className="chrome-icon-btn ml-1 !bg-[var(--chrome-btn)] !text-[var(--chrome-btn-ink)] chrome-serif text-[17px] font-medium hover:opacity-90"
                                >
                                    {initial}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className={`${tokens} chrome-menu w-64 rounded-lg p-1.5`}>
                                <DropdownMenuLabel className="font-normal px-3 pt-3 pb-3">
                                    <p className="text-sm font-semibold leading-tight truncate">{user?.name || 'Student'}</p>
                                    <p className="mt-1 text-xs text-[var(--chrome-mute)] truncate">{user?.email}</p>
                                    <span className={`mt-3 inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider border ${isAdmin
                                        ? 'border-rose-500/30 text-rose-500'
                                        : 'border-[var(--chrome-line)] text-[var(--chrome-mute)]'
                                        }`}>
                                        {user?.role}
                                    </span>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[var(--chrome-line)]" />

                                {isAdmin && (
                                    <>
                                        <DropdownMenuItem onClick={() => router.push('/admin')} className={`${menuItem} font-semibold`}>
                                            <Shield className="w-4 h-4 opacity-70" /> Admin Panel
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/admin/inbox')} className={menuItem}>
                                            <Inbox className="w-4 h-4 opacity-70" /> Inbox & Notifications
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-[var(--chrome-line)]" />
                                    </>
                                )}

                                <DropdownMenuItem onClick={() => router.push('/dashboard')} className={menuItem}>
                                    <LayoutGrid className="w-4 h-4 opacity-70" /> Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/dashboard/analytics')} className={menuItem}>
                                    <TrendingUp className="w-4 h-4 opacity-70" /> Analytics
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/dashboard/leaderboard')} className={menuItem}>
                                    <Trophy className="w-4 h-4 opacity-70" /> Leaderboard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/dashboard/requests')} className={menuItem}>
                                    <MessageSquare className="w-4 h-4 opacity-70" /> My Requests
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[var(--chrome-line)]" />
                                <DropdownMenuItem onClick={handleLogout} className={`${menuItem} text-destructive focus:text-destructive focus:bg-destructive/10`}>
                                    <LogOut className="w-4 h-4" /> Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => openAuthModal('login')}
                                className="chrome-link hidden sm:inline-flex h-10 items-center px-3 rounded-md text-sm font-semibold hover:underline underline-offset-[6px] decoration-2 decoration-[var(--chrome-accent)]"
                            >
                                Sign in
                            </button>
                            <button
                                type="button"
                                onClick={() => openAuthModal('login')}
                                className="chrome-btn ml-1 sm:hidden"
                            >
                                Sign in
                            </button>
                            <button
                                type="button"
                                onClick={() => openAuthModal('register')}
                                className="chrome-btn hidden sm:inline-flex"
                            >
                                Join free
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </motion.header>
    )
}
