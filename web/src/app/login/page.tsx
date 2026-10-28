'use client';

import { useEffect, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/api";

const DEMO_ACCOUNTS = [
    { label: 'Author: Priya Sharma', email: 'priya.sharma@email.com', password: 'author123' },
    { label: 'Author: Sneha Kulkarni', email: 'sneha.kulkarni@email.com', password: 'author123' },
    { label: 'Admin: Support team', email: 'admin@bookleaf.com', password: 'admin123' },
];

export default function LoginPage() {
    const { user, loading, login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) router.replace(homeFor(user));
    }, [loading, user, router]);

    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const loggedIn = await login(email, password);
            router.replace(homeFor(loggedIn));
        } catch (err) {
            setError(errorMessage(err));
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-full items-center justify-center bg-stone-50 px-4 py-12">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl font-semibold text-emerald-800">BookLeaf</h1>
                <p className="mt-1 text-sm text-stone-600">Sign in to the author portal or support desk.</p>

                <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                    <label className="block text-sm">
                        <span className="font-medium text-stone-700">Email</span>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-emerald-600 focus:outline-none"
                        />
                    </label>
                    <label className="block text-sm">
                        <span className="font-medium text-stone-700">Password</span>
                        <input
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-emerald-600 focus:outline-none"
                        />
                    </label>

                    { error && <p className="text-sm text-red-700">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-md bg-emerald-700 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                        {submitting ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="mt-6 text-sm">
                    <p className="text-stone-500">Demo accounts (click to fill):</p>
                    <div className="mt-2 flex flex-col gap-2">
                        {DEMO_ACCOUNTS.map((account) => (
                            <button
                                key={account.email}
                                type="button"
                                onClick={() => {
                                    setEmail(account.email)
                                    setPassword(account.password)
                                }}
                                className="rounded-md border border-stone-200 bg-white px-3 py-2 text-left hover:border-emerald-600"
                            >
                                {account.label}
                                <span className="block text-xs text-stone-500">{account.email}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}