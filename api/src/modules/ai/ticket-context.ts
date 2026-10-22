import type { Book, BookStatus, Platform, PrintPartner } from "@prisma/client";
import { title } from "node:process";

/**
 * Turns database rows into compact, human-readable context for prompts.
 * Only the ticket's own book is included, never the author's whole catalogue,
 * and only the fields that help answer support questions.
 */

const STATUS_LABELS: Record<BookStatus, string> = {
    MANUSCRIPT_RECEIVED: 'In production: Manuscript Received',
    EDITING: 'In production: Editing',
    COVER_DESIGN: 'In production: Cover Design',
    TYPESETTING: 'In production: Typesetting',
    PROOFREADING: 'In production: Proofreading',
    ISBN_ASSIGNMENT: 'In production: ISBN Assignment',
    PRINTING: 'In production: Printing',
    DISTRIBUTION_SETUP: 'In production: Distribution Setup',
    PUBLISHED: 'Published & Live',
}

const PLATFORM_LABELS: Record<Platform, string> = {
  AMAZON_INDIA: 'Amazon India',
  FLIPKART: 'Flipkart',
  AMAZON_US: 'Amazon US',
  AMAZON_UK: 'Amazon UK',
  BOOKLEAF_STORE: 'BookLeaf Store',
};

const PARTNER_LABELS: Record<PrintPartner, string> = {
  IN_HOUSE: 'In-House (Delhi)',
  REPRO_INDIA: 'Repro India',
  EPITOME_BOOKS: 'Epitome Books',
};

const day = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : 'none');
const inr = (value: { toNumber() : number } | null) => 
    value === null ? 'not set' : `₹${value.toNumber().toLocaleString('en-IN')}`;

export type BookForContext = Pick<
  Book,
  | 'id'
  | 'title'
  | 'isbn'
  | 'status'
  | 'publicationDate'
  | 'mrp'
  | 'royaltyPerCopy'
  | 'copiesSold'
  | 'royaltyEarned'
  | 'royaltyPaid'
  | 'lastRoyaltyPayoutAt'
  | 'printPartner'
  | 'platforms'
>;

export const bookContextSelect = {
    id: true,
    title: true,
    isbn: true,
    status: true,
    publicationDate: true,
    mrp: true,
    royaltyPerCopy: true,
    copiesSold: true,
    royaltyEarned: true,
    royaltyPaid: true,
    lastRoyaltyPayoutAt: true,
    printPartner: true,
    platforms: true,
} as const;

export function formatBookContext(book: BookForContext | null): string {
    if (!book) return `None: this is a general / account - level query, not about a specific book.`;

    const pending = book.royaltyEarned.minus(book.royaltyPaid);
    return [
        `Title: ${book.title} (${book.id})`,
        `ISBN: ${book.isbn ?? 'not assigned yet'}`,
        `Status: ${STATUS_LABELS[book.status]}`,
        `Publication date: ${day(book.publicationDate)}`,
        `MRP: ${inr(book.mrp)} | Author royalty per copy: ${inr(book.royaltyPerCopy)}`,
        `Copies sold: ${book.copiesSold}`,
        `Royalty earned: ${inr(book.royaltyEarned)} | Paid: ${inr(book.royaltyPaid)} | Pending: ${inr(pending)}`,
        `Last royalty payout: ${day(book.lastRoyaltyPayoutAt)}`,
        `Print partner: ${book.printPartner ? PARTNER_LABELS[book.printPartner] : 'not assigned yet'}`,
        `Listed on: ${book.platforms.length ? book.platforms.map((p) => PLATFORM_LABELS[p]).join(', ') : 'not listed yet'}`,
    ].join('\n');
}

export const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}... [truncated]` : text);