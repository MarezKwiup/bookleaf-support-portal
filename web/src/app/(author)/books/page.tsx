'use client';

import Link from "next/link";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { BOOK_STATUS_LABEL, formatDate, inr, PLATFORM_LABEL, PRINT_PARTNER_LABEL, PRODUCTION_STAGES } from "@/lib/format";
import type { Book } from "@/lib/types";
import { Badge, EmptyState, ErrorBox, Spinner } from "@/components/ui";

const MIN_PAYOUT = 1000;

export default function BooksPage() {
    const { data: books, error, loading, reload } = useApi('books', () => api.get<Book[]>('/books'));

    if (loading) return <Spinner label="Loading your books..."/>;
    if (error) return <ErrorBox message={error} onRetry={reload}/>;
    if (!books || books.length === 0) {
        return (
            <EmptyState title="No books yet">
                Once your manuscript is received, your book will appear here with its production status.
            </EmptyState>
        );
    }

    const totals = books.reduce(
        (sum, b) => ({
            earned: sum.earned + b.royaltyEarned,
            paid: sum.paid + b.royaltyPaid,
            pending: sum.pending + b.royaltyPending,
            copies: sum.copies + b.copiesSold,
        }),
        { earned: 0, paid: 0, pending: 0, copies: 0 },
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">My Books</h1>
                <p className="text-sm text-stone-600">Sales and royalties across all your titles.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Copies sold" value={totals.copies.toLocaleString('en-IN')} />
                <Stat label="Royalty earned" value={inr(totals.earned)} />
                <Stat label="Royalty paid" value={inr(totals.paid)} />
                <Stat label="Royalty pending" value={inr(totals.pending)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {books.map((book) => (
                    <BookCard key={book.id} book={book} />
                ))}
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
            <p className="text-xs text-stone-500">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    );
}

function BookCard({ book }: { book: Book }) {
    const published = book.status === 'PUBLISHED';

    return (
        <article className="flex flex-col rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="font-semibold">{book.title}</h2>
                    <p className="text-sm text-stone-500">
                        {book.genre ?? 'Genre not set'} , ISBN {book.isbn ?? 'not assigned yet'}
                    </p>
                </div>
                <Badge className={published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                    {published ? 'Published' : 'In production'}
                </Badge>
            </div>

            {published ? <PublishedDetails book={book} /> : <ProductionProgress book={book} /> }

            <div className="mt-auto pt-4">
                <Link href={`/tickets/new?book=${book.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
                    Ask a question about this book →
                </Link>
            </div>
        </article>
    );
}

function PublishedDetails({ book }: { book: Book}) {
    return (
        <>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <Field label="Published" value={formatDate(book.publicationDate)} />
                <Field label="MRP" value={inr(book.mrp)} />
                <Field label="Copies sold" value={book.copiesSold.toLocaleString('en-IN')} />
                <Field label="Royalty earned" value={inr(book.royaltyEarned)} />
                <Field label="Royalty paid" value={inr(book.royaltyPaid)} />
                <Field label="Royalty pending" value={inr(book.royaltyPending)} />
            </dl>

            <RoyaltyNote book={book} />

            <p className="mt-3 text-xs text-stone-500">
                Available on {book.platforms.map((p) => PLATFORM_LABEL[p]).join(', ') || 'no platforms yet'}
                {book.printPartner && ` * Printed by ${PRINT_PARTNER_LABEL[book.printPartner]}`}
            </p>
        </>
    );
}

function Field({ label, value }: { label: string; value: string}) {
    return (
        <div>
            <dt className="text-xs text-stone-500">{label}</dt>
            <dd className="font-medium">{value}</dd>
        </div>
    );
}

function RoyaltyNote({ book }: { book: Book }) {
    let message: string;
    if (book.copiesSold === 0) {
        message = 'No sales yet. Royalties will appear here once copies start selling.';
    } else if (book.royaltyPending === 0) {
        message = `All royalties paid up. Last payout : ${formatDate(book.lastRoyaltyPayoutAt)}.`;
    } else if (book.royaltyPending < MIN_PAYOUT) {
        message = `${inr(book.royaltyPending)} pending is below Rs.${MIN_PAYOUT} minimum payout, so it rolls over to the next quarter.`;
    } else {
        message = `Last payout: ${book.lastRoyaltyPayoutAt ? formatDate(book.lastRoyaltyPayoutAt) : 'none yet'}. Royalties are paid quarterly, withing 45 days of the quarter ending.`;
    }
    return <p className="mt-3 rounded-md bg-stone-50 px-3 py-2 text-xs text-stone-600">{message}</p>;
}

function ProductionProgress({ book }: { book: Book }) {
    const stageIndex = PRODUCTION_STAGES.indexOf(book.status);
    const percent = Math.round(((stageIndex + 1) / PRODUCTION_STAGES.length) * 100);

    return (
        <div className="mt-4 text-sm">
            <p>
                Current stage: <span className="font-medium">{BOOK_STATUS_LABEL[book.status]}</span>
                <span className="text-stone-500">
                    {' '}
                    (step {stageIndex + 1} of {PRODUCTION_STAGES.length})
                </span>
            </p>
            <div className="mt-2 h-2 rounded-full bg-stone-100">
                <div className="h-2 rounded-full bg-amber-500" style={{ width: `${percent}&` }} />
            </div>
            <p className="mt-3 text-xs text-stone-500">
                Sales and royalties will appear here once book is published. You&apos;ll get an email at each stage.
            </p>
        </div>
    );
}