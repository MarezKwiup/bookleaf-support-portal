'use client';

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState, type SubmitEvent } from "react";
import { api, errorMessage } from '@/lib/api';
import { useApi } from "@/lib/useApi";
import { formatDate } from "@/lib/format";
import type { TicketDetail } from "@/lib/types";
import { StatusBadge } from "@/components/badges";
import { TicketThread } from "@/components/TicketThread";
import { ErrorBox, Spinner } from "@/components/ui";

const POLL_MS = 10_000;

export default function AuthorTicketPage() {
    return (
        <Suspense fallback={<Spinner />}>
            <AuthorTicket />
        </Suspense>
    );
}

function AuthorTicket() {
    const { id } = useParams<{ id: string }>();
    const justCreated = useSearchParams().get('created') === '1';
    // Polling
    const { data: ticket, error, loading, reload } = useApi(`ticket-${id}`, () => api.get<TicketDetail>(`/tickets/${id}`), POLL_MS);

    if (loading) return <Spinner label="Loading ticket..."/>;
    if (error || !ticket) return <ErrorBox message={error ?? 'Ticket not found'} onRetry={reload} />;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Link href="/tickets" className="text-sm text-stone-500 hover:underline">
                ← My Tickets
            </Link>

            {justCreated && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Your query has been submitted as <strong>{ticket.reference}</strong>. Our team will reply here, and you&apos;ll
                    see it without refreshing.
                </div>
            )}

            <header className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-semibold">{ticket.subject}</h1>
                    <StatusBadge status={ticket.status} />
                </div>
                <p className="text-sm text-stone-500">
                    {ticket.reference} * {ticket.book ? ticket.book.title : 'General / Account level'} * Raised{' '}
                    {formatDate(ticket.createdAt)}
                </p>
            </header>

            <TicketThread ticket={ticket} viewer="AUTHOR" />

            <ReplyBox ticket={ticket} onSent={reload} />
        </div>
    );
}

function ReplyBox({ ticket, onSent }: { ticket: TicketDetail; onSent: () => void}) {
    const [body, setBody] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    if (ticket.status === 'CLOSED') {
        return (
            <p className="rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-600">
                This ticket is closed. If you need more help, please{' '}
                <Link href="/tickets/new" className="font-medium text-emerald-700 underline">
                    raise a new query
                </Link>
                .
            </p>
        );
    }

    const send = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!body.trim()) return;
        setError(null);
        setSending(true);

        try {
            await api.post(`/tickets/${ticket.id}/messages`, { body });
            setBody('');
            onSent();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSending(false);
        }
    };

    return (
        <form onSubmit={send} className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
            {ticket.status === 'RESOLVED' && (
                <p className="text-xs text-stone-500">
                    This ticket is marked resolved. Replying will reopen it for our team.
                </p>
            )}
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="Add a reply..."
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
                type="submit"
                disabled={sending || !body.trim()}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
                {sending ? 'Sending...' : 'Send reply'}
            </button>
        </form>
    );
}