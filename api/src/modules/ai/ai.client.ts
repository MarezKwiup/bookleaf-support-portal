import Anthropic from "@anthropic-ai/sdk";
import type { AiOperation } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";

/** This file talks to the LLM provider. */

export class AiUnavialableError extends Error {
    constructor(public readonly reason: string) {
        super(`AI unavailable: ${reason}`);
        this.name = 'AiUnavialableError';
    }
}

const client = env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: env.AI_TIMEOUT_MS, maxRetries: 2 })
    : null;
    
export const isAiConfigured = () => client !== null;

interface CompleteParams {
    operation: AiOperation; 
    ticketId: string | null; //Null for calls not tied to a ticket
    system: string; // static instructions
    user: string; // per ticket context
    maxTokens: number;
    jsonSchema?: Record<string, unknown>; //model returns to this defined schema
}

// Maps sdk error to codes for logs
const toErrorCode = (err: unknown): string => {
    if (err instanceof Anthropic.APIConnectionTimeoutError) return `TIMEOUT`;
    if (err instanceof Anthropic.APIConnectionError) return 'CONNECTION_ERROR';
    if (err instanceof Anthropic.RateLimitError) return 'RATE_LIMITED';
    if (err instanceof Anthropic.AuthenticationError) return 'INVALID _API_KEY';
    if (err instanceof Anthropic.APIError) return `HTTP_${err.status ?? 'UNKNOWN'}`;
    return 'UNKNOWN';
}

type Usage = Anthropic.Messages.Usage;

const logRun = async (
    params: CompleteParams,
    startedAt: number,
    result: { success: boolean; usage?: Usage; errorCode?: string },
) => {
    try {
        await prisma.aiRun.create({
            data: {
                ticketId: params.ticketId,
                operation: params.operation,
                model: env.AI_MODEL,
                inputTokens: (result.usage?.input_tokens ?? 0) + (result.usage?.cache_creation_input_tokens ?? 0),
                outputTokens: result.usage?.output_tokens ?? 0,
                cacheReadTokens: result.usage?.cache_read_input_tokens ?? 0,
                latencyMs: Date.now() - startedAt,
                success: result.success,
                errorCode: result.errorCode
            }
        });
    } catch (err) {
        console.error('Failed to log AI run: ', err);
    }
};

export async function complete(params: CompleteParams): Promise<string> {
    if (!client) throw new AiUnavialableError('NO_API_KEY');

    const startedAt = Date.now();
    let response : Anthropic.Messages.Message;

    try {
        response = await client.messages.create({
            model: env.AI_MODEL,
            max_tokens: params.maxTokens,
            // cache_control marks the system prompt as cacheable: repeat calls read it
            system: [{ type: 'text', text: params.system, cache_control: { type: 'ephemeral' } }],
            messages: [{ role: 'user', content: params.user }],
            ...(params.jsonSchema
                ? { output_config: { format: { type: 'json_schema', schema: params.jsonSchema } } }
                : {}
            ),
        });
    } catch (err) {
        const code = toErrorCode(err);
        await logRun(params, startedAt, { success: false, errorCode: code });
        throw new AiUnavialableError(code);
    }

    const text= response.content
        .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')
        .trim();

    const unusable = response.stop_reason === 'max_tokens' || response.stop_reason === 'refusal' || !text;
    await logRun(params, startedAt, {
        success: !unusable,
        usage: response.usage,
        errorCode: unusable ? `STOP_${response.stop_reason ?? 'EMPTY'}` : undefined,
    });
    if (unusable) throw new AiUnavialableError(`STOP_${response.stop_reason ?? 'EMPTY'}`);
    return text;
}
