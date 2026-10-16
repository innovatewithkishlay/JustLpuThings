"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'
import { Loader2, X, Eye, EyeOff, KeyRound, Mail, User, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function AuthModal() {
    const router = useRouter()
    const pathname = usePathname()
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

    // Close on Escape
    useEffect(() => {
        if (!authModalOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuthModal() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [authModalOpen, closeAuthModal])

    const loginMutation = useMutation({
        mutationFn: async (credentials: typeof loginForm) => {
            return await apiClient<{ accessToken: string; refreshToken: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            })
        },
        onSuccess: async (data) => {
            // --- Universal Auth: Save for Header-based fallback ---
            if (data.accessToken && data.refreshToken) {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
            }
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

    const isLogin = authModalMode === 'login'
    const tokens = pathname === '/' ? 'lp-tokens' : ''

    return (
        <AnimatePresence>
            {authModalOpen && (
                <div className={tokens}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAuthModal}
                        className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none overflow-y-auto">
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="auth-modal-title"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 14 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-[420px] pointer-events-auto relative my-auto rounded-xl bg-[var(--chrome-card)] text-[var(--chrome-ink)] border border-[var(--chrome-line)] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.45)]"
                        >
                            <button
                                type="button"
                                onClick={closeAuthModal}
                                aria-label="Close"
                                className="chrome-icon-btn absolute right-3 top-3 z-10 !w-9 !h-9 text-[var(--chrome-mute)]"
                            >
                                <X className="h-[18px] w-[18px]" />
                            </button>

                            <div className="px-6 sm:px-8 pt-8 pb-7">
                                <h2 id="auth-modal-title" className="chrome-serif text-[30px] leading-[1.05] pr-8">
                                    {isLogin ? 'Welcome back.' : 'Make your account.'}
                                </h2>
                                <p className="mt-2 text-sm text-[var(--chrome-mute)]">
                                    {isLogin
                                        ? 'Sign in to pick up where you left off.'
                                        : 'Free. Notes, PYQs and your reading progress in one place.'}
                                </p>

                                <div className="mt-7">
                                    <AnimatePresence mode="wait">
                                        {isLogin ? (
                                            <motion.form
                                                key="login"
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 12 }}
                                                transition={{ duration: 0.18 }}
                                                onSubmit={handleLoginSubmit}
                                                className="space-y-4"
                                            >
                                                <div className="grid grid-cols-2 p-1 rounded-lg bg-[var(--chrome-soft)]" role="group" aria-label="Sign in as">
                                                    <button
                                                        type="button"
                                                        aria-pressed={loginForm.role === 'USER'}
                                                        onClick={() => setLoginForm({ ...loginForm, role: 'USER' })}
                                                        className={`flex items-center justify-center gap-2 py-2 text-[13px] font-semibold rounded-md transition-all ${loginForm.role === 'USER' ? 'bg-[var(--chrome-card)] text-[var(--chrome-ink)] shadow-sm' : 'text-[var(--chrome-mute)] hover:text-[var(--chrome-ink)]'}`}
                                                    >
                                                        <Users className="w-3.5 h-3.5" />
                                                        Student
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-pressed={loginForm.role === 'ADMIN'}
                                                        onClick={() => {
                                                            setLoginForm({ ...loginForm, role: 'ADMIN' });
                                                            // Force to login mode if clicking Admin
                                                            openAuthModal('login');
                                                        }}
                                                        className={`flex items-center justify-center gap-2 py-2 text-[13px] font-semibold rounded-md transition-all ${loginForm.role === 'ADMIN' ? 'bg-[var(--chrome-card)] text-[var(--chrome-ink)] shadow-sm' : 'text-[var(--chrome-mute)] hover:text-[var(--chrome-ink)]'}`}
                                                    >
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                        Admin
                                                    </button>
                                                </div>

                                                <Field id="login-email" label="Email" icon={Mail}>
                                                    <Input
                                                        id="login-email"
                                                        type="email"
                                                        autoComplete="email"
                                                        placeholder="you@example.com"
                                                        value={loginForm.email}
                                                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                                        disabled={loginMutation.isPending}
                                                        className={inputClass}
                                                    />
                                                </Field>
                                                <Field id="login-password" label="Password" icon={KeyRound}>
                                                    <Input
                                                        id="login-password"
                                                        type={showPassword ? "text" : "password"}
                                                        autoComplete="current-password"
                                                        placeholder="••••••••"
                                                        value={loginForm.password}
                                                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                                        disabled={loginMutation.isPending}
                                                        className={`${inputClass} pr-10`}
                                                    />
                                                    <RevealToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                                                </Field>

                                                <button type="submit" className="chrome-btn w-full !h-11 !mt-6" disabled={loginMutation.isPending}>
                                                    {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                    {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
                                                </button>
                                            </motion.form>
                                        ) : (
                                            <motion.form
                                                key="register"
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -12 }}
                                                transition={{ duration: 0.18 }}
                                                onSubmit={handleRegisterSubmit}
                                                className="space-y-4"
                                            >
                                                <Field id="reg-name" label="Full name" icon={User}>
                                                    <Input
                                                        id="reg-name"
                                                        type="text"
                                                        autoComplete="name"
                                                        placeholder="Your name"
                                                        value={registerForm.name}
                                                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                                                        disabled={registerMutation.isPending}
                                                        className={inputClass}
                                                    />
                                                </Field>
                                                <Field id="reg-email" label="Email" icon={Mail}>
                                                    <Input
                                                        id="reg-email"
                                                        type="email"
                                                        autoComplete="email"
                                                        placeholder="you@example.com"
                                                        value={registerForm.email}
                                                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                                        disabled={registerMutation.isPending}
                                                        className={inputClass}
                                                    />
                                                </Field>
                                                <Field id="reg-password" label="Password" icon={KeyRound}>
                                                    <Input
                                                        id="reg-password"
                                                        type={showPassword ? "text" : "password"}
                                                        autoComplete="new-password"
                                                        placeholder="••••••••"
                                                        value={registerForm.password}
                                                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                                        disabled={registerMutation.isPending}
                                                        className={`${inputClass} pr-10`}
                                                    />
                                                    <RevealToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                                                </Field>
                                                <Field id="reg-confirm" label="Confirm password" icon={KeyRound}>
                                                    <Input
                                                        id="reg-confirm"
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        autoComplete="new-password"
                                                        placeholder="••••••••"
                                                        value={registerForm.confirmPassword}
                                                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                                        disabled={registerMutation.isPending}
                                                        className={`${inputClass} pr-10`}
                                                    />
                                                    <RevealToggle shown={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                                                </Field>

                                                <button type="submit" className="chrome-btn w-full !h-11 !mt-6" disabled={registerMutation.isPending}>
                                                    {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                    {registerMutation.isPending ? 'Creating…' : 'Create account'}
                                                </button>
                                            </motion.form>
                                        )}
                                    </AnimatePresence>

                                    {/* ── Google OAuth ──────────────────────── */}
                                    <div className="flex items-center gap-3 my-5 text-xs text-[var(--chrome-mute)]">
                                        <span className="h-px flex-1 bg-[var(--chrome-line)]" />
                                        or
                                        <span className="h-px flex-1 bg-[var(--chrome-line)]" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/v1/auth/google` }}
                                        className="chrome-link w-full h-11 flex items-center justify-center gap-3 rounded-[0.55rem] border border-[var(--chrome-line)] bg-transparent hover:bg-[var(--chrome-soft)] transition-colors text-sm font-semibold"
                                    >
                                        {/* Google G logo */}
                                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden>
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                    </button>
                                </div>

                                <p className="mt-6 text-[13px] text-center text-[var(--chrome-mute)]">
                                    {isLogin ? (
                                        loginForm.role !== 'ADMIN' && (
                                            <>
                                                New here?{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => openAuthModal('register')}
                                                    className="chrome-link font-semibold text-[var(--chrome-ink)] underline underline-offset-4 decoration-[var(--chrome-line)] hover:decoration-[var(--chrome-accent)] rounded"
                                                >
                                                    Create a free account
                                                </button>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            Already have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => openAuthModal('login')}
                                                className="chrome-link font-semibold text-[var(--chrome-ink)] underline underline-offset-4 decoration-[var(--chrome-line)] hover:decoration-[var(--chrome-accent)] rounded"
                                            >
                                                Sign in
                                            </button>
                                        </>
                                    )}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    )
}

const inputClass = "h-11 pl-10 text-[15px] rounded-[0.55rem] bg-[var(--chrome-bg)] border-[var(--chrome-line)] text-[var(--chrome-ink)] placeholder:text-[var(--chrome-mute)]/70 shadow-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--chrome-accent)]/25 focus-visible:border-[var(--chrome-accent)]"

function Field({ id, label, icon: Icon, children }: { id: string; label: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-[13px] font-medium text-[var(--chrome-ink)]">{label}</Label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon className="h-4 w-4 text-[var(--chrome-mute)] group-focus-within:text-[var(--chrome-accent)] transition-colors" />
                </div>
                {children}
            </div>
        </div>
    )
}

function RevealToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={shown ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--chrome-mute)] hover:text-[var(--chrome-ink)] transition-colors"
        >
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
    )
}
