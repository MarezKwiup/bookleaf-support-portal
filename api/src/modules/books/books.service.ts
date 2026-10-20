import { PrintPartner, type Book, type Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import type { AuthUser } from '../../middleware/auth';

const toNumber = (value: Prisma.Decimal | null) => (value === null ? null : value.toNumber());

export const serializeBook = (book: Book) => ({
    id: book.id,
    authorId: book.authorId,
    title: book.title,
    isbn: book.isbn,
    genre: book.genre,
    status: book.status,
    publicationDate: book.publicationDate,
    mrp: toNumber(book.mrp),
    royaltyPerCopy: toNumber(book.royaltyPerCopy),
    copiesSold: book.copiesSold,
    royaltyEarned: book.royaltyEarned.toNumber(),
    royaltyPaid: book.royaltyPaid.toNumber(),
    royaltyPending: book.royaltyEarned.minus(book.royaltyPaid).toNumber(),
    lastRoyaltyPayoutAt: book.lastRoyaltyPayoutAt,
    PrintPartner: book.printPartner,
    platforms: book.platforms
});

export type BookDto = ReturnType<typeof serializeBook>;

const scopeFor = (user: AuthUser, authorId?: string): Prisma.BookWhereInput =>
    user.role === 'AUTHOR' ? { authorId: user.authorId! } : authorId ? { authorId } : {};

export const booksService = {
    async list(user: AuthUser, filters: { authorId?: string }) {
        const books = await prisma.book.findMany({
            where: scopeFor(user, filters.authorId),
            orderBy: [
                { publicationDate: {
                    sort: 'desc',
                    nulls: 'first'
                }},
                {
                    title: 'asc',
                }
            ]
        });
        return books.map(serializeBook);
    },

    async getById(user: AuthUser, id: string) {
        const book = await prisma.book.findFirst({
            where: {
                id,
                ...scopeFor(user)
            }
        });
        if (!book) throw notFound('Book');
        return serializeBook(book);
    }
}