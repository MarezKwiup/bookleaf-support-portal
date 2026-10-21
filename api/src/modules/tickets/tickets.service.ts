import type { Prisma, TicketStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { badRequest, notFound } from "../../lib/errors";
import { events } from "../../lib/events";
import type { AuthUser } from "../../middleware/auth";
import type {
  CreateTicketInput,
  ListTicketsQuery,
  CreateMessageInput,
  UpdateTicketInput,
} from "./tickets.schemas";
import { title } from "node:process";

const CLOSED_STATES: TicketStatus[] = ['RESOLVED', 'CLOSED'];

export const ticketReference = (number: number) =>
  `BL-${String(number).padStart(4, "0")}`;

const listInclude = {
  book: {
    select: {
      id: true,
      title: true,
    },
  },
  author: {
    select: {
      id: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
  assignee: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      messages: true,
    },
  },
} satisfies Prisma.TicketInclude;

type ListRow = Prisma.TicketGetPayload<{ include: typeof listInclude }>;

const detailInclude = {
    book: {
        select: {
            id: true,
            title: true,
            isbn: true,
            status: true
        }
    },
    author: {
        select: {
            id: true,
            city: true,
            joinedAt: true,
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
    messages: {
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    role: true
                }
            }
        }
    },
    notes: {
    orderBy: { createdAt: 'asc' },
    include: { admin: { select: { id: true, name: true } } },
  },
} satisfies Prisma.TicketInclude;

type DetailRow = Prisma.TicketGetPayload<{include: typeof detailInclude }>;

export const ticketScope = (user: AuthUser): Prisma.TicketWhereInput =>
  user.role === "AUTHOR" ? { authorId: user.authorId! } : {};

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
  if (viewer.role === "AUTHOR") return base;

  return {
    ...base,
    author: {
      id: t.author.id,
      name: t.author.user.name,
      email: t.author.user.email,
    },
    category: t.category,
    priority: t.priority,
    aiStatus: t.aiStatus,
    assignee: t.assignee,
    firstResponseAt: t.firstResponseAt,
  };
};

export const serializeMessage = (
    m: DetailRow['messages'][number],
    viewer: AuthUser,
) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    sender: {
        id: m.sender.id,
        name: m.sender.name,
        role: m.sender.role
    },
    ...(viewer.role === 'ADMIN' ? { aiAssisted: m.aiAssisted } : {} ),
});

export const serializeDetail = (t: DetailRow, viewer: AuthUser) => {
    const base = {
        id: t.id,
        reference: ticketReference(t.number),
        subject: t.subject,
        description: t.description,
        status: t.status,
        attachmentName: t.attachmentName,
        book: t.book,
        messages: t.messages.map((m) => serializeMessage(m, viewer)),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        resolvedAt: t.resolvedAt,
    };
    if (viewer.role === 'AUTHOR') return base;

    return {
        ...base,
        author: {
            id: t.author.id,
            name: t.author.user.name,
            email: t.author.user.email,
            city: t.author.city,
            joinedAt: t.author.joinedAt
        },
        assignee: t.assignee,
        category: t.category,
        priority: t.priority,
        firstResponseAt: t.firstResponseAt,
        ai: {
            status: t.aiStatus,
            category: t.aiCategory,
            priority: t.aiPriority,
            reasoning: t.aiReasoning,
            categoryOverridden: t.categoryOverridden,
            priorityOverridden: t.priorityOverridden
        },
        internalNotes: t.notes.map((n) => ({
            id: n.id,
            body: n.body,
            createdAt: n.createdAt,
            admin: n.admin
        }))
    };
};

const endOfDayUtc = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const buildWhere = (
  user: AuthUser,
  q: ListTicketsQuery,
): Prisma.TicketWhereInput => {
  const where: Prisma.TicketWhereInput = { ...ticketScope(user) };

  if (q.status) where.status = { in: q.status };
  if (q.category) where.category = { in: q.category };
  if (q.priority) where.priority = { in: q.priority };

  if (q.assignee && user.role === "ADMIN") {
    if (q.assignee === "unassigned") where.assigneeId = null;
    else where.assigneeId = q.assignee === "me" ? user.id : q.assignee;
  }

  if (q.from || q.to) {
    where.createdAt = {
      gte: q.from,
      lte: q.to ? endOfDayUtc(q.to) : undefined,
    };
  }

  if (q.search) {
    const contains = {
      contains: q.search,
      mode: "insensitive" as const,
    };
    where.OR = [
      {
        subject: contains,
      },
      {
        description: contains,
      },
      ...(user.role === "ADMIN"
        ? [{ author: { user: { name: contains } } }]
        : []),
    ];
  }
  return where;
};

const buildOrderBy = (
  sort: ListTicketsQuery["sort"],
): Prisma.TicketOrderByWithRelationInput[] => {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "oldest":
      return [{ createdAt: "asc" }];
    case "updated":
      return [{ updatedAt: "desc" }];
    default:
      return [
        {
          priority: {
            sort: "asc",
            nulls: "first",
          },
        },
        {
          createdAt: "asc",
        },
      ];
  }
};

const findAccessible = async (user: AuthUser, id: string) => {
    const ticket = await prisma.ticket.findFirst({
        where: { id, ...ticketScope(user) },
        select: {
            id: true,
            authorId: true,
            status: true,
            aiCategory: true,
            aiPriority: true,
            firstResponseAt: true
        },
    });
    if (!ticket) throw notFound('Ticket');
    return ticket;
}

export const ticketsService = {
  async create(user: AuthUser, input: CreateTicketInput) {
    const authorId = user.authorId!;

    if (input.bookId) {
      const book = await prisma.book.findFirst({
        where: {
          id: input.bookId,
          authorId,
        },
        select: {
          id: true,
        },
      });
      if (!book) {
        throw badRequest("Selected book was not found", { field: "bookId" });
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
      include: listInclude,
    });

    events.emit("ticket.created", { ticketId: ticket.id, authorId });
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
        take: q.pageSize,
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      items: rows.map((row) => serializeListItem(row, user)),
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    };
  },

  async getById(user: AuthUser, id: string) {
    const ticket = await prisma.ticket.findFirst({
        where: {
            id,
            ...ticketScope(user)
        },
        include: detailInclude
    });
    if (!ticket) throw notFound('Ticket');
    return serializeDetail(ticket, user);
  },

  // Admin only functions
  async update(admin: AuthUser, id: string, input: UpdateTicketInput) {
    const current = await findAccessible(admin, id);
    const data: Prisma.TicketUncheckedUpdateInput = {};
    const changes: string[] = [];

    if (input.status && input.status !== current.status) {
        data.status = input.status;
        data.resolvedAt = CLOSED_STATES.includes(input.status) ? new Date : null;
        changes.push('status');
    }

    if (input.category) {
        data.category = input.category;
        data.categoryOverridden = current.aiCategory !== null && input.category !== current.aiCategory;
        changes.push('category');
    }

    if (input.priority) {
        data.priority = input.priority;
        data.priorityOverridden = current.aiPriority !== null && input.priority !== current.aiPriority;
        changes.push('priority');
    }

    if (input.assigneeId !== undefined) {
        const assineeId = input.assigneeId === 'me' ? admin.id : input.assigneeId;
        if (assineeId) {
            const assignee = await prisma.user.findUnique({
                where: {
                    id: assineeId
                },
                select: {
                    role: true
                }
            })
            if (!assignee || assignee.role !== 'ADMIN') {
                throw badRequest('Tickets can only to assigned to admin users', { field: 'assigneeId' });
            }
        }
        data.assigneeId = assineeId;
        changes.push('assignee');
    }

    const ticket = await prisma.ticket.update({
        where: { id },
        data,
        include: detailInclude
    });
    if (changes.length > 0) {
        events.emit('ticket.updated', { ticketId: id, authorId: ticket.authorId, changes });
    }
    return serializeDetail(ticket, admin);
  },

  async addMessage(user: AuthUser, id: string, input: CreateMessageInput) {
    const ticket = await findAccessible(user, id);
    const isAdmin = user.role === 'ADMIN';

    if (ticket.status === 'CLOSED') {
        throw badRequest(
            isAdmin
                ? 'This ticket is closed. Reopen it before replying.'
                : 'This ticket is closed. Please raise a new ticket if you need further help.'
        );
    }

    const ticketUpdate: Prisma.TicketUncheckedUpdateInput = { updatedAt: new Date() };
    if (isAdmin) {
        if (!ticket.firstResponseAt) ticketUpdate.firstResponseAt = new Date();
        if (ticket.status === 'OPEN') ticketUpdate.status = 'IN_PROGRESS';
    } else if (ticket.status === 'RESOLVED') {
        ticketUpdate.status = 'OPEN';
        ticketUpdate.resolvedAt = null;
    }

    const [message] = await prisma.$transaction([
        prisma.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: user.id,
                body: input.body,
                aiAssisted: isAdmin ? input.aiAssisted : false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                }
            }
        }),
        prisma.ticket.update({
            where: { id },
            data: ticketUpdate
        })
    ]);

    events.emit('ticket.message', {
        ticketId: id,
        authorId: ticket.authorId,
        messageId: message.id
    });
    return serializeMessage(message, user);
  },

  async addNote(admin: AuthUser, id: string, body: string) {
    await findAccessible(admin, id);
    const note = await prisma.internalNote.create({
        data: {
            ticketId: id,
            adminId: admin.id,
            body
        },
        include: {
            admin: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    })
    return { id: note.id, body: note.body, createdAt: note.createdAt, admin: note.admin };
  }
};
