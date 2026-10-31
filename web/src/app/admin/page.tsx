'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { useNow } from "@/lib/useNow";
import { CATEGORY_LABEL, PRIORITY_LABEL, timeAgo } from "@/lib/format";
import type { TicketListItem } from "@/lib/types";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { Badge, EmptyState, ErrorBox, Spinner } from "@/components/ui";

const POLL_MS = 15_000;
const PAGE_SIZE = 20;

const STATUS_TABS = [
    { label: 'Active', value: 'OPEN,IN_PROGRESS' },
    { label: 'Open', value: 'OPEN' },
    { label: 'In progress', value: 'IN_PROGRESS' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'All', value: '' },
];

const SORTS = [
    { label: 'Most urgent first', value: 'urgency' },
    { label: 'Oldest first', value: 'oldest' },
    { label: 'Newest first', value: 'newest' },
    { label: 'Recently updated', value: 'updated' },
];

export default function AdminQueuePage() {
    const router = useRouter();
    const now = useNow();
    const [status, setStatus] = useState('OPEN,IN_PROGRESS');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('');
    const [assignee, setAssignee] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [sort, setSort] = useState('urgency');
    const [page, setPage] = useState(1);

    const search = useDebounced(searchInput.trim());

    const query = { status, category, priority, assignee, from, to, search, sort, page, pageSize: PAGE_SIZE };
    const { data, error , loading, reload } = useApi(
        JSON.stringify(query),
        () => api.list<TicketListItem>('/tickets', query),
        POLL_MS
    );

    const update = <T, >(setter: (v: T) => void) => (value: T) => {
        setter(value);
        setPage(1);
    };

    const hasFilters = Boolean(category || priority || assignee || from || to || searchInput);
    const clearFilters = () => {
        setCategory('');
        setPriority('');
        setAssignee('');
        setFrom('');
        setTo('');
        setSearchInput('');
        setPage(1);
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Ticket queue</h1>
                <p className="text-sm text-stone-600">Most urgent and oldest unresolved tickets first. Updates automatically.</p>
            </div>

            <QueueSummary />

            <div className="flex flex-wrap gap-1 border-b border-stone-200">
                {STATUS_TABS.map((tab) => (
                    <button 
                        key={tab.label}
                        onClick={() => update(setStatus)(tab.value)}
                        className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                            status === tab.value
                                ? 'border-emerald-700 font-medium text-emerald-800'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 text-sm">
                <input
                    value={searchInput}
                    onChange={(e) => update(setSearchInput)(e.target.value)}
                    placeholder="Search subject, details or author..."
                    className="w-64 rounded-md border border-stone-300 px-3 py-2"
                />
                <Select label="Category" value={category} onChange={update(setCategory)} options={CATEGORY_LABEL} />
                <Select label="Priority" value={priority} onChange={update(setPriority)} options={PRIORITY_LABEL} />
                <Select
                    label="Assignee"
                    value={assignee}
                    onChange={update(setAssignee)}
                    options={{ me: 'Assigned to me', unassigned: 'Unassigned' }}
                />
                <label className="flex flex-col text-xs text-stone-500">
                    From 
                    <input type="date" value={from} onChange={(e) => update(setFrom)(e.target.value)} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-800" />
                </label>
                <label className="flex flex-col text-xs text-stone-500">
                    To 
                    <input type="date" value={to} onChange={(e) => update(setTo)(e.target.value)} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-800" />
                </label>
                <label className="ml-auto flex flex-col text-xs text-stone-500">
                    Sort 
                    <select value={sort} onChange={(e) => update(setSort)(e.target.value)} className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800">
                        {SORTS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </label>
                {hasFilters && (
                    <button onClick={clearFilters} className="text-sm text-emerald-700 underline">
                        Clear filters
                    </button>
                )}
            </div>

            {loading ? (
                <Spinner label="Loading tickets..." />
            ) : error ? (
                <ErrorBox message={error} onRetry={reload} />
            ) : !data || data.data.length === 0 ? (
                <EmptyState title={hasFilters ? 'No tickets match these filters' : 'No tickets here'}>
                    {hasFilters ? 'Try clearing a filter.' : 'Not waiting in this view. Nice work.'}
                </EmptyState>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                                <tr>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Ticket</th>
                                    <th className="px-4 py-3">Author</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Age</th>
                                    <th className="px-4 py-3">Assignee</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {data.data.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                                        className="cursor-pointer hover:bg-stone-50"
                                    >
                                        <td className="px-4 py-4">
                                            <Link href={`/admin/tickets/${ticket.id}`} className="block truncate font-medium hover:underline">
                                                {ticket.subject}
                                            </Link>
                                            <span className="text-xs text-stone-500">
                                                {ticket.reference} * {ticket.book?.title ?? 'General / Account'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{ticket.author?.name}</td>
                                        <td className="px-4 py-3">
                                            {ticket.category ? CATEGORY_LABEL[ticket.category] : <span className="text-stone-400">Pending</span>}
                                            <AiStatusHint status={ticket.aiStatus} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={ticket.status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <AgeBadge ticket={ticket} now={now} />
                                        </td>
                                        <td className="px-4 py-3 text-stone-600">
                                            {ticket.assignee?.name ?? <span className="text-stone-400">Unassigned</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between text-sm text-stone-600">
                        <span>
                            {data.pagination.total} ticket{data.pagination.total === 1 ? '' : 's'}
                        </span>
                        {data.pagination.totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button disabled={page <=1} onClick={() => setPage(page - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">
                                    Previous
                                </button>
                                <span>
                                    Page {page} of {data.pagination.totalPages}
                                </span>
                                <button
                                    disabled={page >= data.pagination.totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="rounded-md border px-3 py-1 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function QueueSummary() {
    const count = (query: Record<string, string>) =>
        api.list<TicketListItem>('/tickets', { ...query, pageSize: 1}).then((r) => r.pagination.total);

    const { data } = useApi(
        'queue-summary',
        async () => {
            const [active, critical, unassigned, mine ] = await Promise.all([
                count({ status: 'OPEN,IN_PROGRESS' }),
                count({ status: 'OPEN,IN_PROGRESS', priority: 'CRITICAL,HIGH'}),
                count({ status: 'OPEN,IN_PROGRESS', assignee: 'unassigned' }),
                count({ status: 'OPEN,IN_PROGRESS', assignee: 'me' }),
            ]);
            return { active, critical, unassigned, mine };
        },
        POLL_MS,
    );

    const items = [
        { label: 'Active tickets', value: data?.active },
        { label: 'Critical or high', value: data?.critical, alert: (data?.critical ?? 0) > 0 },
        { label: 'Unassigned', value: data?.unassigned },
        { label: 'Assigned to me', value: data?.mine },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {items.map((item) => (
                <div 
                    key={item.label}
                    className={`rounded-xl border px-4 py-3 ${item.alert ? 'border-red-200 bg-red-50' : 'border-stone-200 bg-white'}`}
                >
                    <p className="text-xs text-stone-500">{item.label}</p>
                    <p className={`mt-1 text-xl font-semibold ${item.alert ? 'text-red-700' : ''}`}>{item.value ?? '-'}</p>
                </div>
            ))}
        </div>
    );
}

function Select({
    label,
    value,
    onChange,
    options
}: {
    label: string;
    value: string;
    onChange: (value: string) => void,
    options: Record<string, string>;
}) {
    return (
        <label className="flex-flex-col text-xd text-stone-500">
            {label}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800"
            >
                <option value="">All</option>
                {Object.entries(options).map(([key, text]) => (
                    <option key={key} value={key}>
                        {text}
                    </option>
                ))}
            </select>
        </label>
    );
}

function AiStatusHint({ status }: { status?: TicketListItem['aiStatus'] }) {
    if (status === 'FALLBACK') return <span className="block text-xs text-amber-700">Rule-based (AI unavialable)</span>;
    if (status === 'PENDING') return <span className="block text-xs text-stone-400">AI classifying...</span>;
    if (status === 'FAILED') return <span className="block text-xs text-red-700">Needs manual triage</span>;
    return null;
}

function AgeBadge({ ticket, now }: { ticket: TicketListItem; now: number }) {
    const resolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
    const hours = (now - new Date(ticket.createdAt).getTime()) / 3_600_000.
    const style = resolved
        ? 'bg-stone text-stone-500'
        : hours > 48
            ? 'bg-red-100 text-red-800'
            : hours > 24
                ? 'bg-amber-100 text-amber-800'
                : 'bg-stone-100-text-stone-700';
                
    return (
        <div className="flex flex-col items-start gap-1">
            <Badge className={style}>{timeAgo(ticket.createdAt, now)}</Badge>
            {!resolved && !ticket.firstResponseAt && <span className="text-xs text-red-700">No reply yet</span>}
        </div>
    );
}