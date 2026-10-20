import { email, z } from 'zod';

export const loginSchema = z.object({
    email: z.email('Enter a valid email address').transform((email) => email.toLowerCase().trim()),
    password: z.string({ error: 'password is required'}).min(1, 'password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;