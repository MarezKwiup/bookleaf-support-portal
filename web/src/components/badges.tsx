import { PRIORITY_LABEL, PRIORITY_STYLE, TICKET_STATUS_LABEL, TICKET_STATUS_STYLE } from "@/lib/format";
import type { TicketPriority, TicketStatus } from "@/lib/types";
import { Badge } from "./ui";

export function StatusBadge({ status }: { status: TicketStatus }) {
    return <Badge className={TICKET_STATUS_STYLE[status]}>{TICKET_STATUS_LABEL[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority | null | undefined }) {
    if (!priority) return <Badge className="bg-stone-100 text-stone-500">Unclassified</Badge>;
    return <Badge className={PRIORITY_STYLE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
