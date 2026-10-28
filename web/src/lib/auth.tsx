'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, setUnauthorizedHandler, tokenStore } from './api';
import type { AuthUser } from './types';

interface AuthState {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthUser>;
    logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const homeFor = (user: AuthUser) => (user.role === 'ADMIN' ? '/admin' : '/books');

export function AuthProvider({ children } : { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const restoreSession = async () => {
            let me: AuthUser | null = null;
            if (tokenStore.get()) {
                try {
                    me = await api.get<AuthUser>('/auth/me');
                } catch {
                    tokenStore.clear();
                }
            }
            if (!cancelled) {
                setUser(me);
                setLoading(false);
            }
        };
        void restoreSession();

        setUnauthorizedHandler(() => {
            setUser(null);
            router.replace('/login');
        });

        return () => {
            cancelled = true;
            setUnauthorizedHandler(null);
        };
    }, [router]);

    const login = useCallback(async (email: string, password: string) => {
        const result = await api.post<{ token: string, user: AuthUser }>('/auth/login', { email, password });
        tokenStore.set(result.token);
        setUser(result.user);
        return result.user;
    }, []);

    const logout = useCallback(() => {
        tokenStore.clear();
        setUser(null);
        router.replace('/login');
    }, [router]);

    const value = useMemo(() => ({
        user, loading, login, logout
    }), [user, loading, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
