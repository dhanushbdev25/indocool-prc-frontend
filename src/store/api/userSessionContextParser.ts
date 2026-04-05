export interface SessionRole {
	id: number;
	name: string;
	permissions: string[];
}

export interface SessionData {
	message: string;
	id: number;
	name: string;
	email: string;
	defaultRole: SessionRole;
	otherRoles: SessionRole[];
}

export type sessionData = SessionData;

/** Type guard for session API response (basic structural check). */
export function isSessionData(value: unknown): value is SessionData {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	const dr = o.defaultRole;
	const or = o.otherRoles;
	if (typeof o.message !== 'string' || typeof o.id !== 'number' || typeof o.name !== 'string' || typeof o.email !== 'string') {
		return false;
	}
	if (dr === null || typeof dr !== 'object' || Array.isArray(dr)) {
		return false;
	}
	const drObj = dr as Record<string, unknown>;
	if (
		typeof drObj.id !== 'number' ||
		typeof drObj.name !== 'string' ||
		!Array.isArray(drObj.permissions) ||
		!drObj.permissions.every((p): p is string => typeof p === 'string')
	) {
		return false;
	}
	if (!Array.isArray(or)) {
		return false;
	}
	for (const role of or) {
		if (role === null || typeof role !== 'object' || Array.isArray(role)) {
			return false;
		}
		const r = role as Record<string, unknown>;
		if (
			typeof r.id !== 'number' ||
			typeof r.name !== 'string' ||
			!Array.isArray(r.permissions) ||
			!r.permissions.every((p): p is string => typeof p === 'string')
		) {
			return false;
		}
	}
	return true;
}

// Helper function to extract all permissions from session data
export const getAllPermissions = (sessionData: sessionData): string[] => {
	const allPermissions = [
		...sessionData.defaultRole.permissions,
		...sessionData.otherRoles.flatMap(role => role.permissions)
	];
	// Remove duplicates
	return [...new Set(allPermissions)];
};
