import { ProtectedLayout } from "@/components/layout/ProtectedLayout"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <ProtectedLayout requireAdmin={true}>{children}</ProtectedLayout>
}
