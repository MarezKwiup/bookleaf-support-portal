import type { ReactNode } from "react";

export function Spinner({ label = 'Loading...' }: { label?: string}) {
    return (
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-stone-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-700"/>
            { label } 
        </div>
    );
}

export function ErrorBox({ message, onRetry }: { message: string, onRetry?: () => void}) {
    return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            { message }
            { onRetry && (
                <button onClick={onRetry} className="ml-3 font-medium underline">
                    Try again
                </button>
            )}
        </div>
    );
}

export function EmptyState({ title, children}: { title: string; children?: ReactNode }) {
    return (
        <div className="rounded-xl border border-dashed border-stone-300 px-6 py-14 text-center">
            <p className="font-medium text-stone-800">{title}</p>
            { children && <div className="mt-2 text-sm text-stone-500">{children}</div>}
        </div>
    );
}

export function Badge({ children, className = ''}: { children: ReactNode; className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
            { children }
        </span>
    );
}

