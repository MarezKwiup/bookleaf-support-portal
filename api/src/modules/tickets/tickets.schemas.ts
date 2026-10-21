import { z } from 'zod';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

const enumList = <T extends Record<string, string>>(values: T) => 
    z.string()
    .transform((raw) => raw.split(',').map((v) => v.trim()).filter(Boolean))
    .pipe(z.array(z.enum(values)).min(1))
    .optional()

export const ticketIdParams = z.object({
    id: z.string().trim().min(1)
});

export const createTicketSchema = z.object({
    bookId: z.string().trim().min(1).nullish(),
    subject: z.string().trim().min(5, 'Subject should be atleast 5 characters').max(200),
    description: z
        .string()
        .trim()
        .min(20, 'Please describe the issue in a little more detail (20+ characters)')
        .max(5000),
    attachmentName: z.string().trim().max(255).optional()
});

export const listTicketsQuery = z.object({
    status: enumList(TicketStatus),
    category: enumList(TicketCategory),
    priority: enumList(TicketPriority),
    assignee: z.string().trim().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    search: z.string().trim().max(200).optional(),
    sort: z.enum(['urgency', 'newest', 'oldest', 'updated']).default('urgency'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateTicketSchema = z.object({
    status: z.enum(TicketStatus).optional(),
    category: z.enum(TicketCategory).optional(),
    priority: z.enum(TicketPriority).optional(),
    assigneeId: z.string().trim().min(1).nullable().optional(),
})
.refine((body) => Object.values(body).some((v) => v !== undefined), {
message: 'Provide at least one field to update',
});

export const createMessageSchema = z.object({
    body: z.string().trim().min(1, 'Message cannot be empty').max(10000),
    aiAssisted: z.boolean().default(false),
});

export const createNoteSchema = z.object({
    body: z.string().trim().min(1, 'Note cannot be empty').max(5000),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuery>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
