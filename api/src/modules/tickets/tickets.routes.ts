import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createTicketSchema,
  listTicketsQuery,
  createMessageSchema,
  createNoteSchema,
  ticketIdParams,
  updateTicketSchema,
} from "./tickets.schemas";
import { ticketsService } from "./tickets.service";
import { notFound } from "../../lib/errors";
import { classifyTicket } from "../ai/classifier";

export const ticketsRouter = Router();
ticketsRouter.use(authenticate);

/** POST /api/v1/tickets: an author raises a support query. */
ticketsRouter.post(
  "/",
  requireRole("AUTHOR"),
  validate({ body: createTicketSchema }),
  async (req, res) => {
    const ticket = await ticketsService.create(
      req.user!,
      res.locals.validated.body,
    );
    res.status(201).json({ data: ticket });
  },
);

ticketsRouter.get(
  "/",
  validate({ query: listTicketsQuery }),
  async (req, res) => {
    const result = await ticketsService.list(
      req.user!,
      res.locals.validated.query,
    );
    res.json({
      data: result.items,
      pagination: result.pagination,
    });
  },
);

/** GET /api/v1/tickets/:id: thread view (admins also get AI fields + internal notes). */
ticketsRouter.get('/:id', validate({ params: ticketIdParams }), async (req, res) => {
    const ticket = await ticketsService.getById(req.user!, res.locals.validated.params.id);
    res.json({ data: ticket });
})

/** PATCH /api/v1/tickets/:id: admin updates status, overrides AI fields, assigns. */
ticketsRouter.patch(
    '/:id',
    requireRole('ADMIN'),
    validate({ params: ticketIdParams, body: updateTicketSchema }),
    async (req, res) => {
        const { params, body } = res.locals.validated;
        const ticket = await ticketsService.update(req.user!, params.id, body);
        res.json({ data: ticket });
    }
)

/** POST /api/v1/tickets/:id/messages: reply on the thread (admin or owning author). */
ticketsRouter.post(
    '/:id/messages',
    validate({ params: ticketIdParams, body: createMessageSchema }),
    async (req, res) => {
        const { params, body } = res.locals.validated;
        const message = await ticketsService.addMessage(req.user!, params.id, body);
        res.status(201).json({ data: message });
    }
)

ticketsRouter.post(
    '/:id/notes',
    requireRole('ADMIN'),
    validate({ params: ticketIdParams, body: createNoteSchema }),
    async (req, res) => {
        const { params, body } = res.locals.validated;
        const note = await ticketsService.addNote(req.user!, params.id, body.body);
        res.status(201).json({ data: note });
    }
)

/** POST /api/v1/tickets/:id/classify: admin re-runs AI classification (e.g. after an outage). */
ticketsRouter.post('/:id/classify', requireRole('ADMIN'), validate({ params: ticketIdParams }), async (req, res) => {
  const { id } = res.locals.validated.params;
  if (!(await classifyTicket(id))) throw notFound('Ticket');
  res.json({ data: await ticketsService.getById(req.user!, id )});
});

