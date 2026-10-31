import type { BookStatus, Platform, PrintPartner, TicketCategory, TicketPriority, TicketStatus } from "./types";

const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const inr = (amount: number | null) => (amount === null ? '-' : inrFormatter.format(amount));

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDate = (iso: string | null) => (iso ? dateFormatter.format(new Date(iso)) : '-');

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
});
export const formatDateTime = (iso: string) => dateTimeFormatter.format(new Date(iso));

export function timeAgo(iso: string, now = Date.now()) {
    const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(iso);
}

export const PRODUCTION_STAGES: BookStatus[] = [
    'MANUSCRIPT_RECEIVED',
    'EDITING',
    'COVER_DESIGN',
    'TYPESETTING',
    'PROOFREADING',
    'ISBN_ASSIGNMENT',
    'PRINTING',
    'DISTRIBUTION_SETUP',
    'PUBLISHED'
];

export const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
    MANUSCRIPT_RECEIVED: 'Manuscript received',
    EDITING: 'Editing',
    COVER_DESIGN: 'Cover design',
    TYPESETTING: 'Typesetting',
    PROOFREADING: 'Proofreading',
    ISBN_ASSIGNMENT: 'ISBN assignment',
    PRINTING: 'Printing',
    DISTRIBUTION_SETUP: 'Distribution setup',
    PUBLISHED: 'Published & live'
};

export const PLATFORM_LABEL: Record<Platform, string> = {
    AMAZON_INDIA: 'Amazon India',
    FLIPKART: 'Flipkart',
    AMAZON_US: 'Amazon US',
    AMAZON_UK: 'Amazon UK',
    BOOKLEAF_STORE: 'Bookleaf Store'
};

export const PRINT_PARTNER_LABEL: Record<PrintPartner, string> = {
    IN_HOUSE: 'In-house (Delhi)',
    REPRO_INDIA: 'Repro India',
    EPITOME_BOOKS: 'Epitome Books',
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
};

export const TICKET_STATUS_STYLE: Record<TicketStatus, string> = {
    OPEN: 'bg-sky-100 text-sky-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    RESOLVED: 'bg-emerald-100 text-emerald-800',
    CLOSED: 'bg-stone-200 text-stone-700'
};

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
    ROYALTY_PAYMENTS: 'Royalty & Payments',
    ISBN_METADATA: 'ISBN & Metadata',
    PRINTING_QUALITY: 'Printing & Quality',
    DISTRIBUTION_AVAILABILITY: 'Distribution & Availability',
    BOOK_STATUS_PRODUCTION: 'Book Status & Production',
    GENERAL_INQUIRY: 'General Inquiry'
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
};

export const PRIORITY_STYLE: Record<TicketPriority, string> = {
    CRITICAL: 'bg-red-600 text-white',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-stone-100 text-stone-700'
};