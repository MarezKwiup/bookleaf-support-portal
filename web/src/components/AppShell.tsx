'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

interface NavItem {
    href: string;
    label: string;
}

export function AppShell({ nav, children} : { nav: NavItem[]; children: ReactNode}) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const active = nav
        .filter((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href;

    return (
        <div className="min-h-full bg-stone-500">
            <header className="border-b border-stone-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
                    <Link href={nav[0]?.href ?? '/'} className="text-lg font-semibold text-emerald-800">
                        BookLeaf <span className="font-normal text-stone-500">{user?.role === 'ADMIN' ? 'Support Desk' : 'Author Portal'}</span>
                    </Link>
                    <nav className="flex gap-1 text-sm">
                        {nav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rounded-md px-3 py-1.5 ${
                                    active === item.href ? 'bg-emerald-50 font-medium text-emerald-800' : 'text-stone-600 hover:bg-stone-100'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-3 text-sm">
                        <span className="text-stone-600">{user?.name}</span>
                        <button onClick={logout} className="rounded-md border border-stone-300 px-3 py-1.5 hover:bg-stone-100">
                            Log out
                        </button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </div>
    );
}