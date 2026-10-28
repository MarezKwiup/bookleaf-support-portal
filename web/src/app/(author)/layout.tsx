import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/components/RequireRole";

const AUTHOR_NAV = [
    { href: '/books', label: 'My Books' },
    { href: '/tickets', label: 'My Tickets' },
    { href: '/tickets/new', label: 'Raise a query' },
];

export default function AuthorLayout({ children } : { children: React.ReactNode }) {
    return (
        <RequireRole role="AUTHOR">
            <AppShell nav={AUTHOR_NAV}>{children}</AppShell>
        </RequireRole>
    )
}