import { EventEmitter } from "node:events";

export type DomainEvents = {
    'ticket.created': { ticketId: string; authorId: string };
    'ticket.updated': { ticketId: string; authorId: string; changes: string[] };
    'ticket.message': { ticketId: string; authorId: string; messageId: string };
}

class TypedEmitter {
    private emitter = new EventEmitter();

    emit<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]) {
        this.emitter.emit(event, payload);
    }

    on<K extends keyof DomainEvents>(event: K, listener: (payload: DomainEvents[K]) => void) {
        this.emitter.on(event, listener);
        return () => this.emitter.off(event, listener);
    }
}

export const events = new TypedEmitter();