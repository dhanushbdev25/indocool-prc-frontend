import { z } from 'zod/v4';

export const userSessionContextparser = z.object({
	id: z.string(),
	name: z.string(),
	email: z.email(),
	roleId: z.number(),
	permissions: z.array(z.string())
});

export type sessionData = z.infer<typeof userSessionContextparser>;
