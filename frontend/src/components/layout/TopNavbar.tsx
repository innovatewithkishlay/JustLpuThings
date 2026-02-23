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
    { name: 'Analytics', path: '/analytics', disabled: true }
];

export function TopNavbar() {
    const { setTheme, theme } = useTheme()
    const pathname = usePathname()
    const { isAuthenticated, user, isAdmin, openAuthModal, checkAuth } = useAuth()
    const queryClient = useQueryClient()
    const router = require('next/navigation').useRouter() // Required locally as it's not imported at top

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
        <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-7xl flex h-16 items-center px-6">

                {/* Logo / Brand */}
                <Link href="/" className="flex items-center gap-2 mr-6 text-xl font-heading font-bold tracking-tight text-foreground transition-colors hover:text-primary">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span className="hidden sm:inline-block">JustLPUThings</span>
                </Link>

                {/* Global Search Input (Header) */}
                {pathname !== '/search' && !pathname?.startsWith('/login') && !pathname?.startsWith('/register') && (
                    <div className="flex-1 flex max-w-md mx-6">
                        <Link href="/search" className="w-full">
                            <div className="relative group w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="w-full h-10 bg-muted/50 hover:bg-muted/80 border border-transparent hover:border-border transition-all flex items-center pl-10 pr-4 rounded-full text-sm text-muted-foreground cursor-text">
                                    Search everything... <span className="ml-auto hidden sm:inline-block text-xs font-mono px-2 py-0.5 bg-background rounded-md border border-border/50">⌘K</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}
                <div className="flex-1" />

                <div className="flex flex-1 items-center justify-end space-x-2">

                    {/* Dark Mode Toggle */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-9 h-9 px-0 rounded-full hover:bg-muted">
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl soft-shadow font-medium">
                            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Profile / Avatar */}
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative rounded-full ml-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold text-sm uppercase focus-visible:ring-primary/50 transition-colors"
                                >
                                    {user?.name?.[0] || user?.email?.[0] || 'U'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl soft-shadow">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.name || 'Student'}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                        <div className="pt-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${isAdmin ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                                                {user?.role}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {isAdmin && (
                                    <>
                                        <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer font-medium text-primary">
                                            Admin Command Center
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}

                                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                                    My Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-muted ml-2"
                            onClick={() => openAuthModal('login')}
                        >
                            <User className="h-5 w-5 text-foreground" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Horizontal Modular Tabs (Shown only on Dashboard routing) */}
            {pathname?.startsWith('/dashboard') && (
                <div className="container mx-auto max-w-7xl px-6 h-12 flex items-center overflow-x-auto no-scrollbar border-t border-border/20">
                    <nav className="flex space-x-6 text-sm font-medium">
                        {MODULES.map((mod) => (
                            <div key={mod.name} className="relative flex items-center h-12">
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
                </div>
            )}
        </div>
    )
}
