'use client';

import { Suspense, useState, type SubmitEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, errorMessage } from '@/lib/api';
import { useApi } from "@/lib/useApi";
import type { Book, TicketListItem } from "@/lib/types";
import { Spinner } from "@/components/ui";

export default function NewTicketPage() {
    return (
        <Suspense fallback={<Spinner />}>
            <NewTicketForm />
        </Suspense>
    );
}

const MIN_DESCRIPTION = 20;

function NewTicketForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: books, loading: booksLoading } = useApi('books', () => api.get<Book[]>('/books'));

    const [bookId, setBookId] = useState(searchParams.get('book') ?? '');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [attachmentName, setAttachmentName] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFieldErrors({});
        setFormError(null);
        setSubmitting(true);

        try {
            const ticekt = await api.post<TicketListItem>('/tickets', {
                bookId: bookId || null,
                subject,
                description,
                ...(attachmentName ? { attachmentName } : {}),
            });
            router.push(`/tickets/${ticekt.id}?created=1`);
        } catch (err) {
            if (err instanceof ApiError && Object.keys(err.fieldErrors()).length > 0) setFieldErrors(err.fieldErrors());
            else setFormError(errorMessage(err));
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-semibold">Raise a query</h1>
            <p className="text-sm text-stone-600">
                Tell us what&apos;s going on and our support team will reply here.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-stone-200 bg-white p-6">
                <label className="block text-sm">
                    <span className="font-medium text-stone-700">Which book is this about?</span>
                    <select
                        value={bookId}
                        onChange={(e) => setBookId(e.target.value)}
                        disabled={booksLoading}
                        className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2"
                    >
                        <option value="">General / Account level</option>
                        {books?.map((book) => (
                            <option key={book.id} value={book.id}>
                                {book.title}
                            </option>
                        ))}
                    </select>
                    <FieldError message={fieldErrors.bookId} />
                </label>

                <label className="block text-sm">
                    <span className="font-medium text-stone-700">Subject</span>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        maxLength={200}
                        placeholder="e.g. Royalty for last quarter not received"
                        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
                    />
                    <FieldError message={fieldErrors.subject} />
                </label>

                <label className="block text-sm">
                    <span className="font-medium text-stone-700">Details</span>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={7}
                        maxLength={5000}
                        placeholder="Include anything that helps: dates, order numbers, what you expected."
                        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
                    />
                    <span className={`text-xs ${description.trim().length < MIN_DESCRIPTION ? 'text-stone-400' : 'text-emerald-700'}`}>
                        {description.trim().length < MIN_DESCRIPTION
                            ? `At least ${MIN_DESCRIPTION} characters (${description.trim().length}/${MIN_DESCRIPTION})`
                            : `${description.length/5000}`
                        }
                    </span>
                    <FieldError message={fieldErrors.description} />
                </label>

                <label className="block text-sm">
                    <span className="font-medium text-stone-700">Attachment (optional)</span>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? null)}
                        className="mt-1 block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2"
                    />
                    <span className="text-xs text-stone-400">
                        Screenshots or photos of printed copies help us resolve issues further
                    </span>
                </label>

                {formError && <p className="text-sm text-red-700">{formError}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                    {submitting ? 'Submitting...' : 'Submit query'}
                </button>
            </form>
        </div>
    );
}

function FieldError({ message }: { message?: string}) {
    return message ? <span className="mt-1 block text-xs text-red-700">{message}</span> : null;
}