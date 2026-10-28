import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/components/RequireRole";

const ADMIN_NAV = [{ href: '/admin', label: 'Ticket queue' }];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <RequireRole role="ADMIN">
            <AppShell nav={ADMIN_NAV}>{children}</AppShell>
        </RequireRole>
    )
}