import { formatDateTime } from "@/lib/format";
import type { Role, TicketDetail } from "@/lib/types";
import { Badge } from "./ui";

// Conversation on a ticket
export function TicketThread({ ticket, viewer }: { ticket: TicketDetail; viewer: Role }) {
    const authorName = ticket.author?.name ?? 'You';

    return (
        <ol className="space-y-4">
            <Message
                mine={viewer === 'AUTHOR'}
                name={viewer === 'AUTHOR' ? 'You' : authorName }
                role="AUTHOR"
                createdAt={ticket.createdAt}
                body={ticket.description}
                footer={ticket.attachmentName ? `Attachment: ${ticket.attachmentName}` : undefined}
            />
            {ticket.messages.map((m) => (
                <Message
                    key={m.id}
                    mine={m.sender.role === viewer}
                    name={m.sender.role === 'ADMIN' ? `${m.sender.name} · BookLeaf Support` : viewer === 'AUTHOR' ? 'You' : m.sender.name }
                    role={m.sender.role}
                    createdAt={m.createdAt}
                    body={m.body}
                    aiAssisted={viewer === 'ADMIN' && m.aiAssisted}
                />
            ))}
        </ol>
    );
}

function Message(props: {
    mine: boolean;
    name: string;
    role: Role;
    createdAt: string;
    body: string;
    footer?: string;
    aiAssisted?: boolean;
}) {
    const bubble = 
        props.role === 'ADMIN' ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200 bg-white';

    return (
        <li className={`flex ${props.mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl border px-4 py-3 ${bubble}`}>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="font-medium text-stone-700">{props.name}</span>
                    <span>{formatDateTime(props.createdAt)}</span>
                    {props.aiAssisted && <Badge className="bg-violet-100 text-violet-800">AI-assisted</Badge>}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{props.body}</p>
                {props.footer && <p className="mt-2 text-xs text-stone-500">{props.footer}</p>}
            </div>
        </li>
    );
}