import type { TicketCategory } from "@prisma/client";

/**
 * The BookLeaf Knowledge Base, split into sections.
 *
 * Why split it? Sending the whole KB on every call wastes tokens and dilutes
 * the model's attention. Instead:
 *   - Classification needs only the CATEGORY_DEFINITIONS (no policies at all).
 *   - Drafting gets the company overview + tone guide (always) plus ONLY the
 *     policy and examples for the ticket's category.
 */

export const COMPANY_OVERVIEW = `BookLeaf Publishing is a self-publishing company operating in India and the US.
- Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid, with marketing and distribution add-ons).
- BookLeaf handles cover design, typesetting, ISBN assignment, printing, distribution and royalty management.
- In-house printing facility and warehouse in Delhi. Print partners: Repro India and Epitome Books.`;

export const TONE_GUIDE = `- Always empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the author's concern before jumping to solutions.
- Be specific: use actual numbers, dates and statuses from the account data rather than vague reassurances.
- If something is BookLeaf's fault (delayed royalties, ISBN error), own it directly. No corporate deflection.
- If the issue needs escalation or investigation, give a clear timeline ("within 48 hours"), never an open-ended promise.
- Always end with a clear next step for the author and/or the BookLeaf team.`;

export const CATEGORY_DEFINITIONS: Record<TicketCategory, string> = {
  ROYALTY_PAYMENTS: 'Royalty amounts, payouts, payment delays, bank details, royalty calculations or statements.',
  ISBN_METADATA:
    'ISBN problems (wrong, duplicate, mismatched) or incorrect book metadata on listings (title, author name, ISBN shown).',
  PRINTING_QUALITY: 'Physical print defects: blurry images, misaligned pages, binding issues, colour problems, reprints.',
  DISTRIBUTION_AVAILABILITY:
    'Book missing, "currently unavailable" or out of stock on Amazon, Flipkart or the BookLeaf Store; listing go-live timing.',
  BOOK_STATUS_PRODUCTION:
    'Where a book is in the production pipeline (editing, cover, typesetting, proofreading...) and delays or timelines.',
  GENERAL_INQUIRY:
    'Account questions, packages, how-to questions, and voluntary metadata changes such as updating a book description or author bio.',
};

export const POLICY_BY_CATEGORY: Record<TicketCategory, string> = {
  ROYALTY_PAYMENTS: `Royalty policy:
- 80/20 split: 80% of net profit per book goes to the author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart) and shipping charges.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold is ₹1,000. Below that, royalties roll over to the next quarter.
- Payouts go by bank transfer to the account linked in the author's dashboard.
- Authors can see a detailed royalty breakdown with per-platform sales in their dashboard.`,

  ISBN_METADATA: `ISBN policy:
- Every BookLeaf book gets a unique ISBN assigned by BookLeaf, registered under BookLeaf's publisher imprint.
- Authors wanting an ISBN under their own imprint must obtain it independently.
- Reported ISBN errors (duplicate, wrong book linked) are HIGH PRIORITY and are escalated to the production team.
- Metadata updates are submitted via the dashboard or by emailing the BookLeaf team and reflect on platforms within 3–5 business days.`,

  PRINTING_QUALITY: `Printing & quality policy:
- In-house printing handles most orders; overflow or special formats go to Repro India or Epitome Books.
- Standard print turnaround: 5–7 business days from order confirmation.
- For quality issues (misprints, binding defects, colour inconsistency) BookLeaf arranges a FREE reprint after verification.
- The author may need to share photos of the defective copy.`,

  DISTRIBUTION_AVAILABILITY: `Distribution policy:
- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK and the BookLeaf Store.
- New listings typically go live within 7–10 business days after publication is complete.
- "Unavailable" on a platform usually means a stock sync issue; BookLeaf can trigger a re-sync, live again within 24–48 hours.`,

  BOOK_STATUS_PRODUCTION: `Production stages (in order):
Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
- Authors are emailed at each stage.
- Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).
- Never blame the author for a delay, even if it is on their side; frame it collaboratively.`,

  GENERAL_INQUIRY: `General information:
- Metadata (description, bio etc.) can be updated after a book is live, via the dashboard or by emailing the BookLeaf team. Changes reflect on platforms within 3–5 business days.
- Packages: Standard Free and Bestseller Breakthrough (paid, with marketing and distribution add-ons).`,
};

export const EXAMPLES_BY_CATEGORY: Record<TicketCategory, { query: string; guidance: string }[]> = {
  ROYALTY_PAYMENTS: [
    {
      query: "I published my book 4 months ago and still haven't received any royalty. What's going on?",
      guidance:
        'Acknowledge the frustration. Explain the quarterly cycle and 45-day payout window. Ask them to confirm bank details are linked. Give the specific next payout date. If genuinely overdue, escalate with a 48-hour resolution timeline.',
    },
    {
      query: 'My royalty amount seems too low. I sold 200 copies but only received ₹3,000.',
      guidance:
        'Explain net profit: MRP minus printing, platform commission and shipping. Offer a line-by-line royalty breakdown. Be transparent, not defensive.',
    },
  ],
  ISBN_METADATA: [
    {
      query: "My book is showing a different ISBN on Amazon than what's on the physical copy.",
      guidance:
        'Treat as high priority and acknowledge it is a serious data issue. Confirm immediate escalation to the production team. Give a 48-hour resolution timeline.',
    },
  ],
  PRINTING_QUALITY: [
    {
      query: 'I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.',
      guidance:
        'Apologise sincerely. Ask for photos of the defective copies. Confirm a free reprint once verified, with a 5–7 business day timeline.',
    },
  ],
  DISTRIBUTION_AVAILABILITY: [
    {
      query: "My book is published but it's showing as 'Currently Unavailable' on Amazon.",
      guidance:
        "Explain it's typically a stock sync issue. Confirm you're triggering a re-sync with the distribution team. Set the expectation: live again within 24–48 hours.",
    },
  ],
  BOOK_STATUS_PRODUCTION: [
    {
      query: "It's been 3 weeks and my book is still in typesetting. When will it be done?",
      guidance:
        'Check the actual production status. If delayed, be honest about why. Give a specific updated timeline. Frame any author-side delay collaboratively.',
    },
  ],
  GENERAL_INQUIRY: [
    {
      query: "Can I update the description of my book on Amazon after it's already live?",
      guidance:
        'Yes: submit via the dashboard or email the BookLeaf team. Changes typically reflect within 3–5 business days.',
    },
  ],
};