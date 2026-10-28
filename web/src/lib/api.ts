import type { Pagination } from "./types";

// Wrapper around api

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'bookleaf.token';

export class ApiError extends Error {
    constructor (
        public readonly status: number,
        public readonly code: string,
        message: string,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
    }

    fieldErrors(): Record<string, string> {
        if (!Array.isArray(this.details)) return {};
        return Object.fromEntries(
            (this.details as { field?: string; message: string}[])
                .filter((d) => d.field && d.message)
                .map((d) => [d.field as string, d.message as string]),
        );
    };
}

export const tokenStore = {
    get: (): string | null => {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    },
    set: (token: string) => {
        try {
            localStorage.setItem(TOKEN_KEY, token);
        } catch {
            // Ignore
        } 
    },
    clear: () => {
        try {
            localStorage.removeItem(TOKEN_KEY);
        } catch {
            // ignore
        }
    },
};

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler:(() => void) | null) => {
    onUnauthorized = handler;
};

type Query = Record<string, string | number | undefined | null>;

interface Envelope<T> {
    data: T;
    pagination?: Pagination;
}

async function request<T>(method: string, path: string, opts: { body?: unknown; query?: Query} = {}) {
    const url = new URL(API_URL + path);
    for (const [key, value] of Object.entries(opts.query ?? {})) {
        if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }

    const token = tokenStore.get();
    let response: Response;
    try {
        response = await fetch(url, {
            method,
            headers: {
                ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        });
    } catch {
        throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Please check your connection and try again.');
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
        if (response.status === 401 && token) {
            tokenStore.clear();
            onUnauthorized?.();
        }
        const err = json?.error;
        throw new ApiError(
            response.status,
            err?.code ?? 'UNKNOWN_ERROR',
            err?.message ?? `Request failed (${response.status})`,
            err?.details,
        );
    }

    return json as Envelope<T>;
}

export const api = {
    get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }).then((r) => r.data),
    list: <T>(path: string, query?: Query) =>
        request<T[]>('GET', path, { query }).then((r) => ({ data: r.data, pagination: r.pagination! })),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {}}).then((r) => r.data),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }).then((r) => r.data),
};

export const errorMessage = (err: unknown) =>
    err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';