import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createTicketSchema, listTicketsQuery } from "./tickets.schemas";
import { ticketsService } from "./tickets.service";

export const ticketsRouter = Router();
ticketsRouter.use(authenticate);

/** POST /api/v1/tickets: an author raises a support query. */
ticketsRouter.post('/', requireRole('AUTHOR'), validate({ body: createTicketSchema }), async (req, res) => {
    const ticket = await ticketsService.create(req.user!, res.locals.validated.body);
    res.status(201).json({ data: ticket });
});

ticketsRouter.get('/', validate({ query: listTicketsQuery }), async (req, res) => {
    const result = await ticketsService.list(req.user!, res.locals.validated.query);
    res.json({
        data: result.items,
        pagination: result.pagination
    });
});