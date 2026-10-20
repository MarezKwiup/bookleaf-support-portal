import { env } from './config/env';
import { prisma } from './lib/prisma';
import { createApp } from './app';
import { events } from './lib/events';

const app = createApp();

const server = app.listen(env.PORT, () => {
    console.log(`Bookleaf API listenting on http://localhost:${env.PORT}`);
});

const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down....`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
};

events.on('ticket.created', (e) => console.log('📨 ticket.created', e));

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));