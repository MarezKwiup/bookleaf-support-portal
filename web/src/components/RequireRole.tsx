'use client';

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { Spinner } from "./ui";

// Client side route guard.

export function RequireRole({ role, children } : { role: Role; children: ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) router.replace('/login');
        else if (user.role !== role) router.replace(homeFor(user));
    }, [loading, user, role, router]);

    if (loading || !user || user.role !== role) return <Spinner/>
    return <>{children}</>;
}