import type { TicketCategory, TicketPriority } from "@prisma/client";
import type { Classification } from "./classifier";

// A rule based classifier when AI fails to respond.
// It deliberately simple: its job is to put a ticket in a sensible place in 
// the queue so nothing sits unclassified during an outage.
const CATEGORY_KEYWORDS: Record<Exclude<TicketCategory, 'GENERAL_INQUIRY'>, string[]> = {
  ROYALTY_PAYMENTS: ['royalt', 'payout', 'payment', 'paid', 'bank', 'earning', '₹', 'rupee', 'money'],
  ISBN_METADATA: ['isbn', 'metadata', 'barcode', 'imprint', 'wrong author', 'wrong title'],
  PRINTING_QUALITY: ['misprint', 'blurry', 'binding', 'misaligned', 'print quality', 'defect', 'smudge', 'torn', 'faded'],
  DISTRIBUTION_AVAILABILITY: ['unavailable', 'out of stock', 'not available', 'not showing', 'listing', 'amazon', 'flipkart'],
  BOOK_STATUS_PRODUCTION: ['typesetting', 'cover design', 'proofread', 'editing', 'production', 'manuscript', 'stage'],
};

const PRIORITY_RULES: { priority: TicketPriority; pattern: RegExp }[] = [
  { priority: 'CRITICAL', pattern: /legal|lawyer|copyright|plagiari|fraud|wrong author name/ },
  // e.g. "no royalty for 6 months", "haven't been paid in a year"
  {
    priority: 'CRITICAL',
    pattern: /(no|not|never|haven'?t).{0,40}(royalt|paid|payment).{0,40}(([6-9]|1[0-2]|six|seven|eight|nine|ten|twelve)\s*months|a year)/,
  },
  { priority: 'HIGH', pattern: /(not|never|haven'?t|didn'?t).{0,20}(received|been paid|got)/ },
  { priority: 'HIGH', pattern: /isbn.{0,40}(wrong|different|duplicate|incorrect|mismatch)|(wrong|different|duplicate|incorrect).{0,40}isbn/ },
  { priority: 'HIGH', pattern: /misprint|blurry|binding|misaligned|defect|damaged/ },
  { priority: 'HIGH', pattern: /unavailable|out of stock|not available|urgent|asap/ },
  { priority: 'LOW', pattern: /\b(can i|how do i|how can i|is it possible)\b|update (my )?(bio|description|photo|profile)/ },
];

export function fallbackClassify(subject: string, description: string): Classification {
    const text = `${subject} ${description}`.toLowerCase();

    let category: TicketCategory = 'GENERAL_INQUIRY';
    let bestScore = 0;
    const matched: string[] = [];
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TicketCategory, string[]][]) {
        const hits = keywords.filter((keyword) => text.includes(keyword));
        if (hits.length > bestScore) {
        bestScore = hits.length;
        category = cat;
        matched.splice(0, matched.length, ...hits);
        }
    }

    const priority = PRIORITY_RULES.find((rule) => rule.pattern.test(text))?.priority ?? 'MEDIUM';

    return {
        category,
        priority,
        reasoning: matched.length
            ? `Rule-based (AI unavailable): matched ${matched.map((k) => `"${k}"`).join(', ')}.`
            : 'Rule-based (AI unavailable): no strong keywords, defaulted to General Inquiry.',
    };
}
