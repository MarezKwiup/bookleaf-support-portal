import { events } from '../../lib/events';
import { classifyTicket } from './classifier';

/**
 * Wires AI features to domain events. Called once at startup.
 * The ticket service doesn't import anything from the AI module.
 */

export function registerAiListener() {
    events.on('ticket.created', ({ ticketId }) => {
        classifyTicket(ticketId).catch(err => console.error('[ai] classify listener error: ', err));
    })
}