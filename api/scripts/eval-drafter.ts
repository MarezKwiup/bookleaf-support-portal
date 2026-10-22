import type { TicketCategory } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { draftReply } from '../src/modules/ai/drafter';
import { bookContextSelect } from '../src/modules/ai/ticket-context';

/**
 * Generates drafts for the brief's sample queries against real seeded books,
 * so you can read them side by side and iterate on the prompt.
 * Run from api/:  npx tsx scripts/eval-drafter.ts            (all samples)
 *                 npx tsx scripts/eval-drafter.ts 3          (just sample #3)
 */

const SAMPLES: { bookId: string; category: TicketCategory; subject: string; description: string }[] = [
  { bookId: 'BK005', category: 'ROYALTY_PAYMENTS', subject: 'No royalty received yet', description: "I published my book 4 months ago and still haven't received any royalty. What's going on?" },
  { bookId: 'BK003', category: 'ROYALTY_PAYMENTS', subject: 'Royalty seems too low', description: 'My royalty amount seems too low. I sold 200 copies but only received ₹3,000.' },
  { bookId: 'BK011', category: 'ISBN_METADATA', subject: 'ISBN mismatch on Amazon', description: "My book is showing a different ISBN on Amazon than what's on the physical copy." },
  { bookId: 'BK008', category: 'PRINTING_QUALITY', subject: 'Terrible print quality', description: 'I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.' },
  { bookId: 'BK017', category: 'DISTRIBUTION_AVAILABILITY', subject: 'Currently unavailable on Amazon', description: "My book is published but it's showing as 'Currently Unavailable' on Amazon." },
  { bookId: 'BK015', category: 'BOOK_STATUS_PRODUCTION', subject: 'Stuck in typesetting', description: "It's been 3 weeks and my book is still in typesetting. When will it be done?" },
  { bookId: 'BK016', category: 'ROYALTY_PAYMENTS', subject: 'Where is my royalty?', description: 'I can see ₹850 pending in my dashboard but nothing has been paid to me yet. When will I get it?' },
];

async function main() {
    const only = process.argv[2] ? Number(process.argv[2]) : null;

    for (const [index, sample] of SAMPLES.entries()) {
        if (only && only !== index + 1) continue;

        const book = await prisma.book.findUniqueOrThrow({
            where: {
                id: sample.bookId
            },
            select: {
                ...bookContextSelect,
                author: {
                    select: {
                        city: true,
                        joinedAt: true,
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        const started = Date.now();
        const body = await draftReply({
            ticketId: null,
            category: sample.category,
            subject: sample.subject,
            description: sample.description,
            author: {
                name: book.author.user.name,
                city: book.author.city,
                joinedAt: book.author.joinedAt,
            },
            book,
            thread: [],
            omittedMessageCount: 0,
            notes: []
        }).catch((err) => `⚠ ${err.message}`);

        console.log(`\n━━━ #${index + 1} ${sample.subject} (${book.title}, ${Date.now() - started}ms) ━━━\n${body}`);
    }

    const runs = await prisma.aiRun.aggregate({
        where: { operation: 'DRAFT', success: true },
        _avg: { inputTokens: true, outputTokens: true, cacheReadTokens: true, latencyMs: true },
        _count: true,
    });
    console.log('\nAverage per successful draft call:', runs._avg, `n=${runs._count}`);
}

main().finally(() => prisma.$disconnect());
