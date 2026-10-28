// Types mirroring backend response shapes
export type Role = 'AUTHOR' | 'ADMIN';

export type BookStatus = 
    | 'MANUSCRIPT_RECEIVED'
    | 'EDITING'
    | 'COVER_DESIGN'
    | 'TYPESETTING'
    | 'PROOFREADING'
    | 'ISBN_ASSIGNMENT'
    | 'PRINTING'
    | 'DISTRIBUTION_SETUP'
    | 'PUBLISHED';

export type Platform = 'AMAZON_INDIA' | 'FLIPKART' | 'AMAZON_US' | 'AMAZON_UK' | 'BOOKLEAF_STORE';
export type PrintPartner = 'IN_HOUSE' | 'REPRO_INDIA' | 'EPITOME_BOOKS';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketCategory = 
    | 'ROYALTY_PAYMENTS'
    | 'ISBN_METADATA'
    | 'PRINTING_QUALITY'
    | 'DISTRIBUTION_AVAILABILITY'
    | 'BOOK_STATUS_PRODUCTION'
    | 'GENERAL_INQUIRY'
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AiStatus = 'PENDING' | 'COMPLETED' | 'FALLBACK' | 'FAILED';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: Role;
    authorId: string | null;
}

export interface Book {
    id: string;
    authorId: string;
    title: string;
    isbn: string | null;
    genre: string | null;
    status: BookStatus;
    publicationDate: string | null;
    mrp: number | null;
    royaltyPerCopy: number | null;
    copiesSold: number;
    royaltyEarned: number;
    royaltyPaid: number;
    royaltyPending: number;
    lastRoyaltyPayoutAt: string | null;
    printPartner: PrintPartner | null;
    platforms: Platform[];
}

export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

interface PersonRef {
    id: string;
    name: string;
}

export interface TicketListItem {
    id: string;
    reference: string;
    subject: string;
    status: TicketStatus;
    book: { id: string; title: string } | null;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
    author?: { id: string; name: string; email: string };
    category?: TicketCategory | null;
    priority?: TicketPriority | null;
    aiStatus?: AiStatus;
    assignee?: PersonRef | null;
    firstResponseAt?: string | null;
}

export interface TicketMessage {
    id: string;
    body: string;
    createdAt: string;
    sender: { id: string; name: string; role: Role };
    aiAssisted?: boolean;
}

export interface InternalNote {
    id: string;
    body: string;
    createdAt: string;
    admin: PersonRef;
}

export interface TicketDetail {
    id: string;
    reference: string;
    subject: string;
    description: string;
    status: TicketStatus;
    attachmentName: string | null;
    book: { id: string; title: string; isbn: string | null; status: BookStatus } | null;
    messages: TicketMessage[];
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
    author?: { id: string; name: string; email: string; city: string | null; joinedAt: string | null };
    assignee?: PersonRef | null;
    category?: TicketCategory | null;
    priority?: TicketPriority | null;
    firstResponseAt?: string | null;
    ai?: {
        status: AiStatus;
        category: TicketCategory | null;
        priority: TicketPriority | null;
        reasoning: string | null;
        categoryOverridden: boolean;
        priorityOverridden: boolean;
    };
    internalNotes?: InternalNote[];
}

export interface Draft {
    body: string;
    model: string;
    generatedAt: string;
    stale: boolean;
}

export type DraftResult =
    | { status: 'READY'; source: 'CACHE' | 'GENERATED'; draft: Draft }
    | { status: 'UNAVAILABLE'; reason: string; draft: Draft | null }
    | { status: 'NOT_APPLICABLE'; reason: 'TICKET_CLOSED'; draft: null };
