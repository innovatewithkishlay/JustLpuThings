"use client"

import { Component, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error intercepted by Global Boundary:", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-8 max-w-md">
                        A critical error occurred while rendering this page or communicating with the backend.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="default"
                            onClick={() => window.location.reload()}
                            className="w-32 rounded-xl"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/dashboard'}
                            className="rounded-xl border-border"
                        >
                            Back to Safety
                        </Button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
