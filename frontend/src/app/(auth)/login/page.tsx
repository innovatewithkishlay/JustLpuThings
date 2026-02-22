"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { BookOpen } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ email: '', password: '' })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.email || !form.password) {
            toast.error('Please fill in all fields')
            return
        }

        setLoading(true)
        try {
            await apiFetch<{ token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(form)
            })

            toast.success('Authentication successful')
            router.push('/dashboard')
        } catch (err: any) {
            toast.error(err.message || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-[400px]"
            >
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2 text-xl font-heading font-bold">
                        <BookOpen className="w-6 h-6 text-primary" />
                        <span>JustLpuThings</span>
                    </Link>
                </div>

                <Card className="soft-shadow border-border/50">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-heading tracking-tight text-center">Welcome back</CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to access the vault
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m.henderson@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    disabled={loading}
                                    className="transition-all focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    disabled={loading}
                                    className="transition-all focus-visible:ring-primary/20"
                                />
                            </div>
                            <Button type="submit" className="w-full active:scale-[0.98] transition-all" disabled={loading}>
                                {loading ? 'Authenticating...' : 'Sign in'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <div className="text-sm text-center text-muted-foreground">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="text-primary hover:underline font-medium">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
