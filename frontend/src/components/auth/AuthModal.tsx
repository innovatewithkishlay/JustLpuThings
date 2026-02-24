"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'
import { BookOpen, Loader2, X, Eye, EyeOff, KeyRound, Mail, User, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function AuthModal() {
    const router = useRouter()
    const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, checkAuth, isAuthenticated, isAdmin, loading } = useAuth()

    const [loginForm, setLoginForm] = useState({ email: '', password: '', role: 'USER' as 'USER' | 'ADMIN' })
    const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Auto-close if already authenticated
    useEffect(() => {
        if (!loading && isAuthenticated && authModalOpen) {
            closeAuthModal()
            router.replace(isAdmin ? '/admin' : '/dashboard')
        }
    }, [isAuthenticated, isAdmin, loading, authModalOpen, router, closeAuthModal])

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (authModalOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [authModalOpen])

    const loginMutation = useMutation({
        mutationFn: async (credentials: typeof loginForm) => {
            return await apiClient<{ token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            })
        },
        onSuccess: async () => {
            toast.success('Authentication successful')
            await checkAuth()
            closeAuthModal()
        },
        onError: (err: any) => {
            toast.error(err.message || 'Authentication failed. Please check your credentials.')
        }
    })

    const registerMutation = useMutation({
        mutationFn: async (credentials: Omit<typeof registerForm, 'confirmPassword'>) => {
            return await apiClient<{ message: string }>('/auth/register', {
                method: 'POST',
                body: JSON.stringify(credentials)
            })
        },
        onSuccess: () => {
            toast.success('Account created successfully! Please sign in.')
            openAuthModal('login')
            setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' })
            setShowPassword(false)
            setShowConfirmPassword(false)
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to create account. Please try again.')
        }
    })

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!loginForm.email || !loginForm.password) {
            toast.error('Please fill in all fields')
            return
        }
        loginMutation.mutate(loginForm)
    }

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
            toast.error('Please fill in all fields')
            return
        }
        if (registerForm.password !== registerForm.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        registerMutation.mutate({ name: registerForm.name, email: registerForm.email, password: registerForm.password })
    }

    return (
        <AnimatePresence>
            {authModalOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAuthModal}
                        className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-[420px] pointer-events-auto relative"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closeAuthModal}
                                className="absolute right-4 top-4 z-10 rounded-full hover:bg-muted/50"
                            >
                                <X className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                            </Button>

                            <Card className="soft-shadow border-[0.5px] border-border/80 overflow-hidden rounded-[20px] bg-background/95 backdrop-blur-2xl relative">
                                <CardHeader className="space-y-1.5 pt-6 px-6">
                                    <CardTitle className="text-xl font-heading font-bold text-center tracking-tight">
                                        {authModalMode === 'login' ? 'Sign In' : 'Create Account'}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="px-6 pb-6">
                                    <AnimatePresence mode="wait">
                                        {authModalMode === 'login' ? (
                                            <motion.form
                                                key="login"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ duration: 0.2 }}
                                                onSubmit={handleLoginSubmit}
                                                className="space-y-4"
                                            >
                                                <div className="flex p-1 bg-muted/30 rounded-xl mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLoginForm({ ...loginForm, role: 'USER' })}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${loginForm.role === 'USER' ? 'bg-background text-primary soft-shadow' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        <Users className="w-3.5 h-3.5" />
                                                        Student
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setLoginForm({ ...loginForm, role: 'ADMIN' });
                                                            // Force to login mode if clicking Admin
                                                            openAuthModal('login');
                                                        }}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${loginForm.role === 'ADMIN' ? 'bg-background text-primary soft-shadow' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                        Admin
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="login-email" className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground ml-1">Email</Label>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                                <Mail className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                            </div>
                                                            <Input
                                                                id="login-email"
                                                                type="email"
                                                                placeholder="name@university.edu"
                                                                value={loginForm.email}
                                                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                                                disabled={loginMutation.isPending}
                                                                className="h-11 pl-10 text-sm bg-muted/20 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/30 focus-visible:border-primary rounded-[10px]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between ml-1">
                                                            <Label htmlFor="login-password" className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">Password</Label>
                                                        </div>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                                <KeyRound className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                            </div>
                                                            <Input
                                                                id="login-password"
                                                                type={showPassword ? "text" : "password"}
                                                                value={loginForm.password}
                                                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                                                disabled={loginMutation.isPending}
                                                                className="h-11 pl-10 pr-10 text-sm bg-muted/20 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/30 focus-visible:border-primary rounded-[10px]"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button type="submit" className="w-full h-11 rounded-[10px] text-sm font-semibold active:scale-[0.98] transition-all mt-6 group relative overflow-hidden" disabled={loginMutation.isPending}>
                                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                                    {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    {loginMutation.isPending ? 'Authenticating...' : 'Sign In'}
                                                </Button>
                                            </motion.form>
                                        ) : (
                                            <motion.form
                                                key="register"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                                onSubmit={handleRegisterSubmit}
                                                className="space-y-4"
                                            >
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="reg-name" className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground ml-1">Full Name</Label>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                                <User className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                            </div>
                                                            <Input
                                                                id="reg-name"
                                                                type="text"
                                                                placeholder="Alice Doe"
                                                                value={registerForm.name}
                                                                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                                                                disabled={registerMutation.isPending}
                                                                className="h-11 pl-10 text-sm bg-muted/20 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/30 focus-visible:border-primary rounded-[10px]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="reg-email" className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground ml-1">Email</Label>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                                <Mail className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                            </div>
                                                            <Input
                                                                id="reg-email"
                                                                type="email"
                                                                placeholder="name@university.edu"
                                                                value={registerForm.email}
                                                                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                                                disabled={registerMutation.isPending}
                                                                className="h-11 pl-10 text-sm bg-muted/20 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/30 focus-visible:border-primary rounded-[10px]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="reg-password" className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground ml-1">Password</Label>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                                <KeyRound className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                            </div>
                                                            <Input
                                                                id="reg-password"
                                                                type={showPassword ? "text" : "password"}
                                                                value={registerForm.password}
                                                                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                                                disabled={registerMutation.isPending}
                                                                className="h-11 pl-10 pr-10 text-sm bg-muted/20 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/30 focus-visible:border-primary rounded-[10px]"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="reg-confirm" className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground ml-1">Confirm Password</Label>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                                <KeyRound className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                            </div>
                                                            <Input
                                                                id="reg-confirm"
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                value={registerForm.confirmPassword}
                                                                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                                                disabled={registerMutation.isPending}
                                                                className="h-11 pl-10 pr-10 text-sm bg-muted/20 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/30 focus-visible:border-primary rounded-[10px]"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button type="submit" className="w-full h-11 rounded-[10px] text-sm font-semibold active:scale-[0.98] transition-all mt-6 group relative overflow-hidden" disabled={registerMutation.isPending}>
                                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                                    {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    {registerMutation.isPending ? 'Creating...' : 'Create Account'}
                                                </Button>
                                            </motion.form>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                                <CardFooter className="flex flex-col px-6 pb-6 pt-0 mt-2">
                                    <div className="text-xs w-full text-center text-muted-foreground font-medium">
                                        {authModalMode === 'login' ? (
                                            <>
                                                {loginForm.role !== 'ADMIN' && (
                                                    <>
                                                        Don't have an account?{' '}
                                                        <button
                                                            onClick={() => openAuthModal('register')}
                                                            className="text-primary hover:underline underline-offset-4 focus-visible:underline focus-visible:outline-none transition-colors font-semibold"
                                                        >
                                                            Sign up
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                Already have an account?{' '}
                                                <button
                                                    onClick={() => openAuthModal('login')}
                                                    className="text-primary hover:underline underline-offset-4 focus-visible:underline focus-visible:outline-none transition-colors font-semibold"
                                                >
                                                    Sign in
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
