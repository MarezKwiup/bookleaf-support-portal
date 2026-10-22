import type { BookForContext } from "./ticket-context";

/**
 * Royalty schedule facts computed in code, not by the model.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const PAYOUT_WINDOW_DAYS = 45;
const MIN_PAYOUT_INR = 1000;

const iso = (date: Date) => date.toISOString().slice(0, 10);

/** Last day of the quarter that contains `month` (0-based) of `year`, in UTC. */
const quarterEnd = (year: number, month: number) => new Date(Date.UTC(year, Math.floor(month / 3) * 3 + 3, 0));

export function royaltyScheduleFacts(today: Date, book: BookForContext | null): string {
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth();

    const currentQuarterEnd = quarterEnd(year, month);
    const lastQuarterEnd = new Date(Date.UTC(year, Math.floor(month / 3) * 3, 0));
    const lastQuarterPayoutBy = new Date(lastQuarterEnd.getTime() + PAYOUT_WINDOW_DAYS * DAY_MS);
    const currentQuarterPayoutBy = new Date(currentQuarterEnd.getTime() + PAYOUT_WINDOW_DAYS * DAY_MS);
    const previousQuarterEnd = new Date(Date.UTC(year, Math.floor(month / 3) * 3 - 3, 0));
    const latestDueQuarterEnd = today > lastQuarterPayoutBy ? lastQuarterEnd : previousQuarterEnd;

    const lines = [
        `Most recently completed quarter ended ${iso(lastQuarterEnd)}; its payout is due by ${iso(lastQuarterPayoutBy)}${
        today > lastQuarterPayoutBy ? ' (that deadline has passed)' : ''
        }.`,
        `Current quarter ends ${iso(currentQuarterEnd)}; its payout is due by ${iso(currentQuarterPayoutBy)}.`,
    ];

    if (book) {
        const pending = book.royaltyEarned.minus(book.royaltyPaid).toNumber();
        if (pending <= 0) {
                  lines.push('This book has no pending royalty: everything earned so far has been paid.');
        } else if (pending < MIN_PAYOUT_INR) {
            lines.push(
                `Pending royalty (₹${pending.toLocaleString('en-IN')}) is below the ₹1,000 minimum payout, so it rolls over to the next quarter.`,
            );
        } else {
            lines.push(`Pending royalty (₹${pending.toLocaleString('en-IN')}) is above the ₹1,000 minimum, so it is payable.`);
            const unpaidSince = book.lastRoyaltyPayoutAt ?? book.publicationDate;
            if (unpaidSince && unpaidSince < latestDueQuarterEnd) {
                const since = book.lastRoyaltyPayoutAt
                ? `the last payout on ${iso(unpaidSince)}`
                : `publication on ${iso(unpaidSince)} (no payout ever made)`;
                lines.push(
                `LIKELY OVERDUE: the payout deadline for the quarter ending ${iso(latestDueQuarterEnd)} has passed, and nothing has been paid since ${since}. Treat this as a BookLeaf delay: own it, escalate to the finance team, and commit to an update within 48 hours.`,
                );
            }
        }
        if (book.royaltyPaid.isZero() && book.copiesSold > 0) {
            lines.push('No royalty has ever been paid out for this book.');
        }
    }

    return lines.join('\n');
}