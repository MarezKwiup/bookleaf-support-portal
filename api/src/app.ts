import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { authenticate, requireRole } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { booksRouter } from './modules/books/books.routes';
import { ticketsRouter } from './modules/tickets/tickets.routes';

export const createApp = () => {
    const app = express();

    app.use(helmet());
    app.use(cors({
        origin: env.CORS_ORIGINS,
        credentials: true
    }));
    app.use(express.json({ limit: '100kb' }));
    if (env.NODE_ENV !== 'test') {
        app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    }

    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok'
        });
    });

    const api = express.Router();
    api.use('/auth', authRouter);
    api.use('/books', booksRouter);
    api.use('/tickets', ticketsRouter);
    app.use('/api/v1', api);

    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}