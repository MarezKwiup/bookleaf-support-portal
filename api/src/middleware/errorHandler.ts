import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";

export const notFoundHandler: RequestHandler = (req, res) => {
    res.status(404).json({
        error: { code: 'ROUTE_NOT_FOUND', message: `No route for ${req.method} ${req.path}` },
    });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        res.status(err.status).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details
            }
        });
        return;
    }

    if (err instanceof ZodError) {
        res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
            }
        })
        return;
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
            res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Record not found'
                }
            });
            return;
        }
        if (err.code === 'P2002') {
            res.status(409).json({
                error: {
                    code: 'CONFLICT',
                    message: 'A record with this value already exists'
                }
            });
            return;
        }
    }

    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({
            error: {
                code: 'INVALID_JSON',
                message: 'Request body is not valid JSON'
            }
        });
        return;
    }

    console.error('Unhandled error: ', err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong'
        }
    });
}