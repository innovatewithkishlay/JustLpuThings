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

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', password: '' })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Basic frontend validation
        if (!form.name || !form.email || !form.password) {
            toast.error('All fields are required')
            return
        }
        if (form.password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        setLoading(true)
        try {
            await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify(form)
            })

            toast.success('Account created successfully')
            router.push('/dashboard')
        } catch (err: any) {
            toast.error(err.message || 'Registration failed')
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
                        <CardTitle className="text-2xl font-heading tracking-tight text-center">Create Account</CardTitle>
                        <CardDescription className="text-center">
                            Join the vault to explore materials
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@university.edu"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <Button type="submit" className="w-full active:scale-[0.98] transition-all" disabled={loading}>
                                {loading ? 'Creating account...' : 'Create Account'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <div className="text-sm text-center text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
