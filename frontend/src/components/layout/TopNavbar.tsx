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

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

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
        <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 py-4 ${isScrolled ? 'px-4' : 'px-0'}`}>
            <motion.div
                animate={{
                    width: isScrolled ? '85%' : '100%',
                    borderRadius: isScrolled ? '24px' : '0px',
                    maxWidth: isScrolled ? '1200px' : '100%'
                }}
                className={`flex items-center h-16 transition-all duration-500 border border-border/40 bg-background/70 backdrop-blur-2xl shadow-2xl shadow-black/5 dark:shadow-primary/5 ${isScrolled ? 'px-6 border-white/10' : 'px-10 border-transparent bg-transparent backdrop-blur-0 shadow-none'}`}
            >
                {/* Logo / Brand */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xl font-heading font-bold tracking-tight text-foreground bg-clip-text">
                        JustLPU<span className="text-primary">Things</span>
                    </span>
                </Link>

                {/* Global Search Input (Header) */}
                {pathname !== '/search' && !pathname?.startsWith('/login') && !pathname?.startsWith('/register') && (
                    <div className="flex-1 flex max-w-md mx-8">
                        <Link href="/search" className="w-full">
                            <div className="relative group w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="w-full h-9 bg-muted/30 hover:bg-muted/50 border border-border/20 transition-all flex items-center pl-10 pr-4 rounded-xl text-[13px] text-muted-foreground cursor-text">
                                    Search... <span className="ml-auto hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 bg-background/50 rounded border border-border/50">⌘K</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                <div className="flex-1" />

                <div className="flex items-center gap-4">
                    {/* Dark Mode Toggle */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-9 h-9 px-0 rounded-xl hover:bg-muted/50">
                                <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                                <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl soft-shadow font-medium border-border/40 backdrop-blur-xl">
                            <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg">Light</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg">Dark</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg">System</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Profile / Avatar */}
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative rounded-xl w-9 h-9 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold text-xs uppercase transition-all"
                                >
                                    {user?.name?.[0] || user?.email?.[0] || 'U'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl soft-shadow border-border/40 backdrop-blur-xl p-2">
                                <DropdownMenuLabel className="font-normal px-2 py-3">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold leading-none">{user?.name || 'Student'}</p>
                                        <p className="text-[11px] leading-none text-muted-foreground">{user?.email}</p>
                                        <div className="pt-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase ${isAdmin ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                                                {user?.role}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="opacity-50" />

                                {isAdmin && (
                                    <>
                                        <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer font-semibold text-primary rounded-lg">
                                            Admin Panel
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="opacity-50" />
                                    </>
                                )}

                                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer rounded-lg px-2 py-2 text-sm">
                                    Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/dashboard/analytics')} className="cursor-pointer rounded-lg px-2 py-2 text-sm">
                                    Analytics
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="opacity-50" />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg px-2 py-2 text-sm">
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="default"
                            className="rounded-xl h-9 px-5 text-xs font-bold shadow-lg shadow-primary/10 hover:scale-105 transition-all"
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
        </div>
    )
}
