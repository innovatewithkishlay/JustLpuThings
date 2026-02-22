import { ProtectedLayout } from "@/components/layout/ProtectedLayout"

export default function ViewerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>
}
