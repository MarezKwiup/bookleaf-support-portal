'use client';

import Link from "next/link";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { timeAgo } from "@/lib/format";
import type { TicketListItem } from "@/lib/types";
import { StatusBadge } from "@/components/badges";
import { EmptyState, ErrorBox, Spinner } from "@/components/ui";

const POLL_MS = 15_000;

export default function MyTicketsPage() {
    const { data, error, loading, reload } = useApi(
        'my-tickets',
        () => api.list<TicketListItem>('/tickets', { sort: 'updated', pageSize: 100 }),
        POLL_MS,
    );

    if (loading) return <Spinner label="Loading your tickets..." />;
    if (error) return <ErrorBox message={error} onRetry={reload} />;

    const tickets = data?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">My Tickets</h1>
                    <p className="text-sm text-stone-600">Updates appear here automatically.</p>
                </div>
                <Link
                    href="/tickets/new"
                    className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                    Raise a query
                </Link>
            </div>

            { tickets.length === 0 ? (
                <EmptyState title="You haven't raised any queries yet">
                    Questions about royalties, ISBNs, printing or your book&apos;s progress? We&apos;re here to help.
                </EmptyState>
            ) : (
                <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
                    {tickets.map((ticket) => (
                        <li key={ticket.id}>
                            <Link href={`/tickets/${ticket.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-stone-50">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{ticket.subject}</p>
                                    <p className="text-xs text-stone-500">
                                        {ticket.reference} · {ticket.book?.title ?? 'General / Account'} · {ticket.messageCount}{' '}
                                        {ticket.messageCount === 1 ? 'reply' : 'replies'}
                                    </p>
                                </div>
                                <span className="text-xs text-stone-500">Updated {timeAgo(ticket.updatedAt)}</span>
                                <StatusBadge status={ticket.status} />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}