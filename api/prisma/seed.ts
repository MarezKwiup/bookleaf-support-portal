import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { BookStatus, Platform, PrintPartner, PrismaClient } from '@prisma/client';
import { platform } from 'node:os';
import process from 'node:process';

const prisma = new PrismaClient();

const DATA_FILE = path.resolve(__dirname, '../../data/sample_data.json');

const AUTHOR_PASSWORD = 'author123';
const ADMIN_PASSWORD = 'admin123';

const ADMINS = [
    { email: 'admin@bookleaf.com', name: 'Vardan Sharma' },
    { email: 'support@bookleaf.com', name: 'Viktor Frankl' },
];

interface RawBook {
    book_id: string;
    title: string;
    isbn: string | null;
    genre: string | null;
    publication_date: string | null;
    status: string;
    mrp: number | null;
    author_royalty_per_copy: number | null;
    total_copies_sold: number;
    total_royalty_earned: number;
    royalty_paid: number;
    royalty_pending: number;
    last_royalty_payout_date: string | null;
    print_partner: string | null;
    available_on: string[]
}

interface RawAuthor {
    author_id: string;
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    joined_date: string | null;
    books: RawBook[];
}

const PRODUCTION_STAGES: Record<string, BookStatus> = {
    'manuscript received': 'MANUSCRIPT_RECEIVED',
    editing: 'EDITING',
    'cover design': 'COVER_DESIGN',
    typesetting: 'TYPESETTING',
    proofreading: 'PROOFREADING',
    'isbn assignment': 'ISBN_ASSIGNMENT',
    printing: 'PRINTING',
    'distribution setup': 'DISTRIBUTION_SETUP'
};

const toBookStatus = (raw: string) : BookStatus => {
    if (raw === 'Published & Live') return 'PUBLISHED';
    const stage = raw.replace(/^In Production\s*-\s*/i, '').toLowerCase();
    const status = PRODUCTION_STAGES[stage];
    if (!status) throw new Error(`Unknown book status "${raw}"`);
    return status;
}

const PRINT_PARTNERS: Record<string, PrintPartner> = {
    'In-House': 'IN_HOUSE',
    'Repro India': 'REPRO_INDIA',
    'Epitome Books': 'EPITOME_BOOKS',
};

const PLATFORMS: Record<string, Platform> = {
    'Amazon India': 'AMAZON_INDIA',
    Flipkart: 'FLIPKART',
    'Amazon US': 'AMAZON_US',
    'Amazon UK': 'AMAZON_UK',
    'BookLeaf Store': 'BOOKLEAF_STORE',
}

const mapOrThrow = <T>(map: Record<string, T>, value: string, label: string): T => {
    const mapped = map[value];
    if (!mapped) throw new Error(`Unknow ${label}: ${value}`);
    return mapped;
}

const toDate = (value: string | null) => (value ? new Date(value) : null);

async function seedAdmins(passwordHash: string) {
    for (const admin of ADMINS) {
        await prisma.user.upsert({
            where: { email: admin.email },
            update: { name: admin.name, role: 'ADMIN' },
            create: { ...admin, passwordHash, role: 'ADMIN' },
        });
    }
    console.log(`${ADMINS.length} admins`);
}

async function seedAuthor(raw: RawAuthor, passwordHash: string) {
    const email = raw.email.toLowerCase();

    const user = await prisma.user.upsert({
        where: { email },
        update: { name: raw.name },
        create: { email, name: raw.name, passwordHash, role: 'AUTHOR' },
    });

    const profile = {
        phone: raw.phone,
        city: raw.city,
        joinedAt: toDate(raw.joined_date),
    }

    await prisma.author.upsert({
        where: { id: raw.author_id },
        update: profile,
        create: { id: raw.author_id, userId: user.id, ...profile },
    })

    for (const b of raw.books) {
        const book = {
            authorId: raw.author_id,
            title: b.title,
            isbn: b.isbn,
            genre: b.genre,
            publicationDate: toDate(b.publication_date),
            status: toBookStatus(b.status),
            mrp: b.mrp,
            royaltyPerCopy: b.author_royalty_per_copy,
            copiesSold: b.total_copies_sold,
            royaltyEarned: b.total_royalty_earned,
            royaltyPaid: b.royalty_paid,
            lastRoyaltyPayoutAt: toDate(b.last_royalty_payout_date),
            printPartner: b.print_partner ? mapOrThrow(PRINT_PARTNERS, b.print_partner, 'print partner') : null,
            platforms: b.available_on.map((p) => mapOrThrow(PLATFORMS, p, 'platform')),
        };
        await prisma.book.upsert({
            where: { id: b.book_id },
            update: book,
            create: { id: b.book_id, ...book }
        })
    }
    return raw.books.length;
}

async function main() {
    console.log('Seeding data......');

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as { authors: RawAuthor[] };

    const [authorHash, adminHash] = await Promise.all([
        bcrypt.hash(AUTHOR_PASSWORD, 10),
        bcrypt.hash(ADMIN_PASSWORD, 10),
    ]);

    await seedAdmins(adminHash);

    let bookCount = 0;
    for (const author of data.authors) {
        bookCount += await seedAuthor(author, authorHash);
    }
    console.log(`✓ ${data.authors.length} authors (password: ${AUTHOR_PASSWORD})`);
    console.log(`✓ ${bookCount} books`);
    console.log('Done.');
}

main()
    .catch((err) => {
        console.error('Seed failed: ', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());