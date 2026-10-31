'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./api";

interface ApiState<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

/**
 * Loads data from the API, with optional polling.
 *
 * - `key` identifies what's being loaded. When it changes, data is refetched.
 *   Pass null to skip loading.
 * - `pollMs` refetches on an interval, but only while the tab is visible,
 *   so a forgotten background tab doesn't keep hitting the API.
 * - Polling failures are silent: the last good data stays on screen rather
 *   than flashing an error every time the network blips.
 */

export function useApi<T>(key: string | null, fetcher: () => Promise<T>, pollMs?: number) {
    const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: true});
    const [version, setVersion] = useState(0);

    const fetcherRef = useRef(fetcher);
    useEffect(() => {
        fetcherRef.current = fetcher;
    });

    useEffect(() => {
        if (key === null) return;
        let cancelled = false;

        const run = async(silent: boolean) => {
            try {
                const data = await fetcherRef.current();
                if (!cancelled) setState({ data, error: null, loading: false});
            } catch (err) {
                if (!cancelled && !silent) setState((s) => ({...s, error: errorMessage(err), loading: false }));
            }
        }

        void run(false);

        if (!pollMs) return () => void (cancelled = true);
        
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') void run(true);
        }, pollMs);
        
        const onVisible = () => {
            if (document.visibilityState === 'visible') void run(true);
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [key, version, pollMs]);

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    return { ...state, reload};
}
