import type { RequestHandler } from "express";
import { ZodType } from "zod";

type Schemas = {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
}

export const validate =
    (schemas: Schemas): RequestHandler =>
    (req, res, next) => {
        res.locals.validated = {
            body: schemas.body ? schemas.body.parse(req.body) : req.body,
            query: schemas.query ? schemas.query.parse(req.query) : req.query,
            params: schemas.params ? schemas.params.parse(req.params) : req.params,
        };
        next();
    }