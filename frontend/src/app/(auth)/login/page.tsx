"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'
import { BookOpen, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
    const router = useRouter()
    const { isAuthenticated, isAdmin, loading: authLoading, checkAuth } = useAuth()
    const [form, setForm] = useState({ email: '', password: '' })

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.replace(isAdmin ? '/admin' : '/dashboard')
        }
    }, [isAuthenticated, isAdmin, authLoading, router])

    const loginMutation = useMutation({
        mutationFn: async (credentials: typeof form) => {
            return await apiClient<{ token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            })
        },
        onSuccess: async () => {
            toast.success('Authentication successful')
            await checkAuth() // Synchronize global state
        }
        // onError uses global mutationCache now defined in queryClient.ts natively
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.email || !form.password) {
            toast.error('Please fill in all fields')
            return
        }
        loginMutation.mutate(form)
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[420px]"
            >
                <div className="flex justify-center mb-10">
                    <Link href="/" className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xl font-heading font-bold tracking-tight">JustLpuThings</span>
                    </Link>
                </div>

                <Card className="soft-shadow border-border overflow-hidden rounded-2xl bg-surface">
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-indigo-400 to-primary" />
                    <CardHeader className="space-y-2 pt-8 px-8">
                        <CardTitle className="text-2xl font-heading font-bold text-center">Welcome back</CardTitle>
                        <CardDescription className="text-center font-medium">
                            Enter your credentials to securely access the vault
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2.5">
                                <Label htmlFor="email" className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@university.edu"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    disabled={loginMutation.isPending}
                                    className="h-12 bg-background border-border transition-all focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    disabled={loginMutation.isPending}
                                    className="h-12 bg-background border-border transition-all focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl"
                                />
                            </div>
                            <Button type="submit" className="w-full h-12 rounded-xl font-semibold active:scale-[0.98] transition-all mt-4" disabled={loginMutation.isPending}>
                                <AnimatePresence mode="wait">
                                    {loginMutation.isPending ? (
                                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                                        </motion.div>
                                    ) : (
                                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            Sign In
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-0">
                        <div className="text-sm border-t border-border pt-6 w-full text-center text-muted-foreground font-medium">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="text-primary hover:text-primary/80 transition-colors font-bold">
                                Create one now
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
