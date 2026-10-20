import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema } from './auth.schemas';
import { authService } from './auth.service';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginSchema}), async (_req, res) => {
    const result = await authService.login(res.locals.validated.body);
    res.json({ data: result });
})

authRouter.get('/me', authenticate, async (requestAnimationFrame, res) => {
    const user = await authService.me(requestAnimationFrame.user!.id);
    res.json({ data: user });
})