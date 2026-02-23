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
import { BookOpen, Loader2, X, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function AuthModal() {
    const router = useRouter()
    const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, checkAuth, isAuthenticated, isAdmin, loading } = useAuth()

    const [loginForm, setLoginForm] = useState({ email: '', password: '' })
    const [registerForm, setRegisterForm] = useState({ email: '', password: '', confirmPassword: '' })
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
            setRegisterForm({ email: '', password: '', confirmPassword: '' })
            setShowPassword(false)
            setShowConfirmPassword(false)
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
        if (!registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
            toast.error('Please fill in all fields')
            return
        }
        if (registerForm.password !== registerForm.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        registerMutation.mutate({ email: registerForm.email, password: registerForm.password })
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

                            <Card className="soft-shadow border-border/50 overflow-hidden rounded-[24px] bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 relative">
                                {/* Subtle inner glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

                                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-400 to-primary" />

                                <CardHeader className="space-y-2 pt-8 px-8">
                                    <div className="flex justify-center mb-6">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                            <BookOpen className="w-6 h-6 text-primary" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-heading font-bold text-center">
                                        {authModalMode === 'login' ? 'Welcome back' : 'Join the Vault'}
                                    </CardTitle>
                                    <CardDescription className="text-center font-medium">
                                        {authModalMode === 'login'
                                            ? 'Enter your credentials to securely access your materials'
                                            : 'Create an account to securely store and track your academic progress'}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="px-8 pb-8">
                                    <AnimatePresence mode="wait">
                                        {authModalMode === 'login' ? (
                                            <motion.form
                                                key="login"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ duration: 0.2 }}
                                                onSubmit={handleLoginSubmit}
                                                className="space-y-5"
                                            >
                                                <div className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="login-email" className="text-xs font-semibold text-muted-foreground ml-1">Email Address</Label>
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
                                                                className="h-12 pl-10 bg-muted/30 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between ml-1">
                                                            <Label htmlFor="login-password" className="text-xs font-semibold text-muted-foreground">Password</Label>
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
                                                                className="h-12 pl-10 pr-10 bg-muted/30 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary rounded-xl"
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
                                                <Button type="submit" className="w-full h-12 rounded-xl font-semibold active:scale-[0.98] transition-all mt-8 group relative overflow-hidden" disabled={loginMutation.isPending}>
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
                                                className="space-y-5"
                                            >
                                                <div className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="reg-email" className="text-xs font-semibold text-muted-foreground ml-1">Email Address</Label>
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
                                                                className="h-12 pl-10 bg-muted/30 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="reg-password" className="text-xs font-semibold text-muted-foreground ml-1">Password</Label>
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
                                                                className="h-12 pl-10 pr-10 bg-muted/30 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary rounded-xl"
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
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="reg-confirm" className="text-xs font-semibold text-muted-foreground ml-1">Confirm Password</Label>
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
                                                                className="h-12 pl-10 pr-10 bg-muted/30 border-border/50 transition-all focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary rounded-xl"
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
                                                <Button type="submit" className="w-full h-12 rounded-xl font-semibold active:scale-[0.98] transition-all mt-8 group relative overflow-hidden" disabled={registerMutation.isPending}>
                                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                                    {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    {registerMutation.isPending ? 'Creating...' : 'Create Account'}
                                                </Button>
                                            </motion.form>
                                        )}
                                    </AnimatePresence>
                                </CardContent>

                                <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-0">
                                    <div className="text-sm border-t border-border pt-6 w-full text-center text-muted-foreground font-medium">
                                        {authModalMode === 'login' ? (
                                            <>
                                                Don't have an account?{' '}
                                                <button
                                                    onClick={() => openAuthModal('register')}
                                                    className="text-primary hover:text-primary/80 transition-colors font-bold"
                                                >
                                                    Create one now
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                Already have an account?{' '}
                                                <button
                                                    onClick={() => openAuthModal('login')}
                                                    className="text-primary hover:text-primary/80 transition-colors font-bold"
                                                >
                                                    Sign in instead
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
