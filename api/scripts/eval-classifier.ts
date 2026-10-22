import { prisma } from '../src/lib/prisma';
import { classifyText } from '../src/modules/ai/classifier';
import { fallbackClassify } from '../src/modules/ai/fallback-classifier'; 
import { bookContextSelect } from '../src/modules/ai/ticket-context';

const SAMPLES = [
  { bookId: 'BK005', expected: 'ROYALTY_PAYMENTS', subject: 'No royalty received yet', description: "I published my book 4 months ago and still haven't received any royalty. What's going on?" },
  { bookId: 'BK003', expected: 'ROYALTY_PAYMENTS', subject: 'Royalty seems too low', description: 'My royalty amount seems too low. I sold 200 copies but only received ₹3,000.' },
  { bookId: 'BK011', expected: 'ISBN_METADATA', subject: 'ISBN mismatch on Amazon', description: "My book is showing a different ISBN on Amazon than what's on the physical copy." },
  { bookId: 'BK008', expected: 'PRINTING_QUALITY', subject: 'Terrible print quality', description: 'I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.' },
  { bookId: 'BK017', expected: 'DISTRIBUTION_AVAILABILITY', subject: 'Currently unavailable on Amazon', description: "My book is published but it's showing as 'Currently Unavailable' on Amazon." },
  { bookId: 'BK015', expected: 'BOOK_STATUS_PRODUCTION', subject: 'Stuck in typesetting', description: "It's been 3 weeks and my book is still in typesetting. When will it be done?" },
  { bookId: 'BK001', expected: 'GENERAL_INQUIRY', subject: 'Update Amazon description', description: "Can I update the description of my book on Amazon after it's already live?" },
];

async function main() {
    let aiCorrect = 0;
    let rulesCorrect = 0;

    for (const sample of SAMPLES) {
        const book = await prisma.book.findUnique({
            where: {
                id: sample.bookId
            },
            select: bookContextSelect
        });
        const ai = await classifyText({
            ticketId: null,
            subject: sample.subject,
            description: sample.description,
            book
        });
        const rules = fallbackClassify(sample.subject, sample.description);

        if (ai.result.category === sample.expected) aiCorrect++;
        if (rules.category === sample.expected) rulesCorrect++;

        console.log(`\n▶ ${sample.subject}  (expected ${sample.expected})`);
        console.log(`  AI [${ai.status}]: ${ai.result.category} / ${ai.result.priority}: ${ai.result.reasoning}`);
        console.log(`  Rules:        ${rules.category} / ${rules.priority}`);
    }

    console.log(`\nCategory accuracy: AI ${aiCorrect}/${SAMPLES.length}, rules ${rulesCorrect}/${SAMPLES.length}`);

    const runs = await prisma.aiRun.aggregate({
        where: {
            operation: 'CLASSIFY',
            success: true,
            ticketId: null,
        },
        _avg: {
            inputTokens: true,
            outputTokens: true,
            cacheReadTokens: true,
            latencyMs: true
        },
        _count: true
    });
    console.log('Average per successful call (all eval runs so far):', runs._avg, `n=${runs._count}`);
}

main().finally(() => prisma.$disconnect());