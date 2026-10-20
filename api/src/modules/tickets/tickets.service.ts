import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { badRequest } from "../../lib/errors";
import { events } from "../../lib/events";
import type { AuthUser } from "../../middleware/auth";
import type { CreateTicketInput, ListTicketsQuery } from "./tickets.schemas";

export const ticketReference = (number: number) => `BL-${String(number).padStart(4, '0')}`;

const listInclude = {
    book: {
        select: {
            id: true,
            title: true
        }
    },
    author: {
        select: {
            id: true,
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    },
    assignee: {
        select: {
            id: true,
            name: true
        }
    },
    _count: { 
        select: {
            messages: true
        }
    }
} satisfies Prisma.TicketInclude;

type ListRow = Prisma.TicketGetPayload<{include: typeof listInclude}>;

export const ticketScope = (user: AuthUser): Prisma.TicketWhereInput =>
    user.role === 'AUTHOR' ? { authorId: user.authorId! } : {}

export const serializeListItem = (t: ListRow, viewer: AuthUser) => {
    const base = {
        id: t.id,
        reference: ticketReference(t.number),
        subject: t.subject,
        status: t.status,
        book: t.book,
        messageCount: t._count.messages,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    };
    if (viewer.role === 'AUTHOR') return base;

    return {
        ...base,
        author: {
            id: t.author.id,
            name: t.author.user.name,
            email: t.author.user.email
        },
        category: t.category,
        priority: t.priority,
        aiStatus: t.aiStatus,
        assignee: t.assignee,
        firstResponseAt: t.firstResponseAt,
    };
};

const endOfDayUtc = (date: Date) => {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
}

const buildWhere = (user: AuthUser, q: ListTicketsQuery): Prisma.TicketWhereInput => {
    const where : Prisma.TicketWhereInput = { ...ticketScope(user) };

    if (q.status) where.status = { in: q.status };
    if (q.category) where.category = { in: q.category };
    if (q.priority) where.priority = { in: q.priority };

    if (q.assignee && user.role === 'ADMIN') {
        if (q.assignee === 'unassigned') where.assigneeId = null;
        else where.assigneeId = q.assignee === 'me' ? user.id : q.assignee;
    }

    if (q.from || q.to) {
        where.createdAt = {
            gte: q.from,
            lte: q.to ? endOfDayUtc(q.to) : undefined
        };
    }

    if (q.search) {
        const contains = {
            contains: q.search,
            mode: 'insensitive' as const
        };
        where.OR = [
            {
                subject: contains
            },
            {
                description: contains
            },
            ...(user.role === 'ADMIN' ? [{ author: { user: { name: contains } } }]: []),
        ];
    }
    return where;
}

const buildOrderBy = (sort: ListTicketsQuery['sort']): Prisma.TicketOrderByWithRelationInput[] => {
    switch (sort) {
        case 'newest':
            return [{ createdAt: 'desc' }]
        case 'oldest':
            return [{ createdAt: 'asc' }]
        case 'updated':
            return [{updatedAt: 'desc' }]
        default:
            return [
                {
                    priority: {
                        sort: 'asc',
                        nulls: 'first'
                    }
                },
                {
                    createdAt: 'asc'
                }
            ]
    }
}

export const ticketsService = {
    async create(user: AuthUser, input: CreateTicketInput) {
        const authorId = user.authorId!;

        if (input.bookId) {
            const book = await prisma.book.findFirst({
                where: {
                    id: input.bookId,
                    authorId
                },
                select: {
                    id: true
                }
            });
            if (!book) {
                throw badRequest('Selected book was not found', { field: 'bookId' });
            }
        }

        const ticket = await prisma.ticket.create({
            data: {
                authorId,
                bookId: input.bookId ?? null,
                subject: input.subject,
                description: input.description,
                attachmentName: input.attachmentName,
            },
            include: listInclude
        })

        events.emit('ticket.created', { ticketId: ticket.id, authorId });
        return serializeListItem(ticket, user);
    },

    async list(user: AuthUser, q: ListTicketsQuery) {
        const where = buildWhere(user, q);

        const [rows, total] = await prisma.$transaction([
            prisma.ticket.findMany({
                where,
                include: listInclude,
                orderBy: buildOrderBy(q.sort),
                skip: (q.page - 1) * q.pageSize,
                take: q.pageSize
            }),
            prisma.ticket.count({ where })
        ]);

        return {
            items: rows.map((row) => serializeListItem(row, user)),
            pagination: {
                page: q.page,
                pageSize: q.pageSize,
                total,
                totalPages: Math.ceil(total / q.pageSize)
            }
        };
    }
}