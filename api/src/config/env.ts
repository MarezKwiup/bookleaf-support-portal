import "dotenv/config";
import process from "node:process";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be atleast 32 characters"),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:4000')
                    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('claude-haiku-4-5'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment configuration');
    for (const issue of parsed.error.issues) {
        console.error(` - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}

export const env = parsed.data;
