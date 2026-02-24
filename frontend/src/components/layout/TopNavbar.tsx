"use client"

import * as React from "react"
import Link from 'next/link'
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { Moon, Sun, Search, User, BookOpen } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"

const MODULES = [
    { name: 'Materials', path: '/dashboard' },
    { name: 'MCQs', path: '/mcqs', disabled: true },
    { name: 'Practice', path: '/practice', disabled: true },
    { name: 'Analytics', path: '/dashboard/analytics' }
];

export function TopNavbar() {
    const { setTheme, theme } = useTheme()
    const pathname = usePathname()
    const { isAuthenticated, user, isAdmin, openAuthModal, checkAuth } = useAuth()
    const queryClient = useQueryClient()
    const router = require('next/navigation').useRouter() // Required locally as it's not imported at top

    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(true)
    const [lastScrollY, setLastScrollY] = React.useState(0)
    const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null)

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Transform to island
            setIsScrolled(currentScrollY > 20)

            // Dynamic visibility
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down - hide
                setIsVisible(false)
            } else {
                // Scrolling up - show
                setIsVisible(true)
            }

            setLastScrollY(currentScrollY)

            // Detect scroll stop to bring it back
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
            scrollTimeout.current = setTimeout(() => {
                setIsVisible(true)
            }, 1000) // Bring back after 1s of no scrolling
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
        }
    }, [lastScrollY])

    const handleLogout = async () => {
        try {
            await apiClient('/auth/logout', { method: 'POST' })
            queryClient.clear()
            await checkAuth()
            toast.success("Logged out successfully")
            router.push('/')
        } catch (e) {
            toast.error("Failed to logout securely")
        }
    }

    // Hide navbar heavily abstracted viewer pages
    if (pathname?.startsWith('/viewer/')) return null;

    return (
        <motion.div
            initial={{ y: 0 }}
            animate={{ y: isVisible ? 0 : -120 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-700 py-6 ${isScrolled ? 'px-4' : 'px-0'}`}
        >
            <motion.div
                animate={{
                    width: isScrolled ? '90%' : '100%',
                    borderRadius: isScrolled ? '32px' : '0px',
                    maxWidth: isScrolled ? '1100px' : '100%',
                    y: isScrolled ? 0 : -10
                }}
                className={`flex items-center h-16 transition-all duration-700 relative ${isScrolled
                    ? 'px-8 border border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] after:absolute after:inset-0 after:rounded-[32px] after:border after:border-white/20 after:pointer-events-none'
                    : 'px-12 border-transparent bg-transparent backdrop-blur-0'
                    }`}
            >
                {/* Logo / Brand */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xl font-heading font-bold tracking-tight text-foreground">
                        JustLPU<span className="text-primary/80">Things</span>
                    </span>
                </Link>

                <div className="flex-1" />

                <div className="flex items-center gap-6">
                    {/* Dark Mode Toggle */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-10 h-10 px-0 rounded-2xl hover:bg-white/10 transition-colors">
                                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground/70" />
                                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground/70" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl soft-shadow border-white/10 backdrop-blur-3xl bg-white/10 dark:bg-black/40">
                            <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-xl m-1">Light</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-xl m-1">Dark</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-xl m-1">System</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Profile / Avatar */}
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative rounded-2xl w-10 h-10 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-bold text-xs transition-all hover:scale-105"
                                >
                                    {user?.name?.[0] || user?.email?.[0] || 'U'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-3xl soft-shadow border-white/10 backdrop-blur-3xl bg-white/10 dark:bg-black/60 p-2">
                                <DropdownMenuLabel className="font-normal px-4 py-4">
                                    <div className="flex flex-col space-y-2">
                                        <p className="text-sm font-semibold leading-none">{user?.name || 'Student'}</p>
                                        <p className="text-[11px] leading-none text-muted-foreground/60">{user?.email}</p>
                                        <div className="pt-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase ${isAdmin ? 'bg-rose-500/20 text-rose-500' : 'bg-primary/20 text-primary'}`}>
                                                {user?.role}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />

                                {isAdmin && (
                                    <>
                                        <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer font-semibold text-primary rounded-xl px-4 py-3 m-1">
                                            Admin Panel
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/5" />
                                    </>
                                )}

                                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer rounded-xl px-4 py-3 m-1 text-sm">
                                    Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/dashboard/analytics')} className="cursor-pointer rounded-xl px-4 py-3 m-1 text-sm">
                                    Analytics
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-xl px-4 py-3 m-1 text-sm">
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="default"
                            className="rounded-2xl h-11 px-8 text-xs font-bold bg-primary hover:bg-primary/90 shadow-[0_10px_30px_rgba(var(--primary),0.2)] hover:scale-105 transition-all"
                            onClick={() => openAuthModal('login')}
                        >
                            Sign In
                        </Button>
                    )}
                </div>
            </motion.div>
            {/* Horizontal Modular Tabs (Shown only on Dashboard routing) */}
            {pathname?.startsWith('/dashboard') && isScrolled && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[85%] max-w-[1200px] bg-background/70 backdrop-blur-2xl border border-border/40 rounded-2xl p-2 shadow-2xl"
                >
                    <nav className="flex space-x-6 text-sm font-medium px-4 h-10 items-center">
                        {MODULES.map((mod) => (
                            <div key={mod.name} className="relative flex items-center h-full">
                                <Link
                                    href={mod.disabled ? '#' : mod.path}
                                    className={`transition-colors hover:text-foreground ${mod.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${pathname === mod.path ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
                                >
                                    {mod.name}
                                </Link>
                                {pathname === mod.path && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </div>
                        ))}
                    </nav>
                </motion.div>
            )}
        </motion.div>
    )
}
