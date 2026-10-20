import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { notFound, unauthorized } from '../../lib/errors';
import { signToken } from '../../middleware/auth';
import type { LoginInput } from './auth.schemas';
import { email } from 'zod';

const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    author: { select: { id: true } },
} as const;

type PublicUserRow = {
    id: string;
    email: string;
    name: string;
    role: Role;
    author: { id: string } | null;
}

const toPublicUser = (user: PublicUserRow) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    authorId: user.author?.id ?? null,
});

// To keep response times of not existing emails and wrong emails to approx same.
const DUMMY_HASH = bcrypt.hashSync('timing-attack-guard', 10);

export const authService = {
    async login({ email, password }: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { ...publicUserSelect, passwordHash: true }
        });

        const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !passwordOk) throw unauthorized('Invalid email or password');

        const publicUser = toPublicUser(user);
        const token = signToken({
            id: publicUser.id,
            role: publicUser.role,
            authorId: publicUser.authorId
        });
        return { token, user: publicUser };
    },

    async me(userId: string) {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: publicUserSelect
        });
        if (!user) throw notFound('User');
        return toPublicUser(user);
    }
}