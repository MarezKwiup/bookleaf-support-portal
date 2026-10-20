import { Router } from "express";
import { z } from 'zod';
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { booksService } from "./books.service";

export const booksRouter = Router();

booksRouter.use(authenticate);

const listQuery = z.object({
    authorId: z.string().trim().min(1).optional(),
})

const idParams = z.object({
    id: z.string().trim().min(1),
})

booksRouter.get('/', validate({ query: listQuery }), async (req, res) => {
    const books = await booksService.list(req.user!, res.locals.validated.query);
    res.json({ data: books });
})

booksRouter.get('/:id', validate({ params: idParams }), async (req, res) => {
    const book = await booksService.getById(req.user!, res.locals.validated.params.id);
    res.json({ data: book });
})
