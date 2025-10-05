import { z } from 'zod/v4';

const roleSchema = z.object({
	id: z.number(),
	name: z.string(),
	permissions: z.array(z.string())
});

export const userSessionContextparser = z.object({
	message: z.string(),
	id: z.number(),
	name: z.string(),
	email: z.email(),
	defaultRole: roleSchema,
	otherRoles: z.array(roleSchema)
});

export type sessionData = z.infer<typeof userSessionContextparser>;

// Helper function to extract all permissions from session data
export const getAllPermissions = (sessionData: sessionData): string[] => {
	const allPermissions = [
		...sessionData.defaultRole.permissions,
		...sessionData.otherRoles.flatMap(role => role.permissions)
	];
	// Remove duplicates
	return [...new Set(allPermissions)];
};
