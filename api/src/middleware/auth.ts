import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { forbidden, unauthorized } from "../lib/errors";

export interface AuthUser {
    id: string;
    role: Role;
    authorId: string | null;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export const signToken = (user: AuthUser): string =>
    jwt.sign({ sub: user.id, role: user.role, authorId: user.authorId}, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

const extractToken = (authHeader?: string, queryToken?: unknown): string | null => {
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
    if (typeof queryToken === 'string' && queryToken.length > 0) return queryToken;
    return null;
}

export const authenticate: RequestHandler = (req, _res, next) => {
    const token = extractToken(req.headers.authorization, req.query.token);
    if (!token) throw unauthorized();

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & {
            role: Role;
            authorId: string | null;
        };
        req.user = { id: payload.sub as string, role: payload.role, authorId: payload.authorId ?? null };
        next();
    } catch {
        throw unauthorized('Session expired or invalid. Please log in again.');
    }
}

export const requireRole =
    (...roles: Role[]): RequestHandler =>
    (req, _res, next) => {
        if (!req.user) throw unauthorized();
        if (!roles.includes(req.user.role)) throw forbidden();
        next();
    }