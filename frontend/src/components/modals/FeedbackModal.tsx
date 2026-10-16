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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="app-card w-full max-w-lg shadow-[0_30px_60px_-24px_rgba(0,0,0,0.45)] p-7 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4">
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
                        <div className="space-y-2 pr-10">
                            <h2 className="font-heading font-normal text-[30px] leading-tight tracking-[-0.02em]">Leave a <em>review</em></h2>
                            <p className="text-muted-foreground text-[15px]">
                                If we approve it, it goes on the home page for the next batch to read.
                            </p>
                        </div>

                        {/* Rating Stars */}
                        <div className="flex gap-1 py-2" role="radiogroup" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none group transition-transform active:scale-90"
                                >
                                    <Star
                                        className={`w-8 h-8 transition-colors ${star <= rating
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
                                placeholder="What helped? Which subject? Be honest."
                                aria-label="Your review"
                                rows={5}
                                className="app-field"
                            />

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="app-btn w-full h-12"
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

                        <p className="text-[12px] text-muted-foreground">
                            Every review is read by a person before it goes live.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
