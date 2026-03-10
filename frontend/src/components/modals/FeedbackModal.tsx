"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/apiClient'
import { toast } from 'sonner'

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [rating, setRating] = useState(5)
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error("Please enter some feedback!")
            return
        }

        setIsSubmitting(true)
        try {
            await apiClient('/feedbacks', {
                method: 'POST',
                body: JSON.stringify({ content, rating })
            })
            toast.success("Feedback submitted! It will appear on the landing page after admin approval.")
            setContent('')
            setRating(5)
            onClose()
        } catch (error: any) {
            toast.error(error.message || "Failed to submit feedback")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-surface border border-border/60 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full hover:bg-muted"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2 text-center">
                            <h2 className="text-2xl font-heading font-bold">Share Your Experience</h2>
                            <p className="text-muted-foreground text-sm font-medium">
                                Your feedback helps us grow and inspires other students!
                            </p>
                        </div>

                        {/* Rating Stars */}
                        <div className="flex justify-center gap-2 py-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none group transition-transform active:scale-90"
                                >
                                    <Star
                                        className={`w-10 h-10 transition-colors ${star <= rating
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-muted-foreground/30 group-hover:text-muted-foreground/50'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Tell us what you like about Just LPU Things..."
                                className="w-full min-h-[150px] p-5 rounded-3xl bg-muted/5 border border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all resize-none font-medium placeholder:text-muted-foreground/40"
                            />

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full h-14 rounded-2xl text-sm font-bold shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Feedback
                                    </>
                                )}
                            </Button>
                        </div>

                        <p className="text-[10px] text-center text-muted-foreground/50 font-bold uppercase tracking-widest">
                            Submissions are moderated for community safety
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
