import { ProtectedLayout } from "@/components/layout/ProtectedLayout"

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>
}
