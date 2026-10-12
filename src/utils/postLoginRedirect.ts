import { PUBLIC_AUTH_PATHS } from '../constants/authRoutes';

const STORAGE_KEY = 'postLoginRedirect';

/**
 * Logged-out-only routes are not valid redirect targets: once the user has a
 * token the authenticated route tree has no such path, so restoring one would
 * drop them on NotFound straight after a successful login.
 */
function isPublicAuthPath(pathWithSearch: string): boolean {
	const [pathname] = pathWithSearch.split(/[?#]/);
	const normalized = pathname.replace(/\/+$/, '') || '/';
	return PUBLIC_AUTH_PATHS.includes(normalized);
}

/** Persist deep-link path so login can restore it after auth. */
export function capturePostLoginRedirect(pathWithSearch?: string): void {
	const path =
		pathWithSearch ??
		`${typeof window !== 'undefined' ? window.location.pathname : ''}${
			typeof window !== 'undefined' ? window.location.search : ''
		}`;
	const trimmed = path.trim();
	if (!trimmed || trimmed === '/') return;
	// Reject protocol-relative / external URLs
	if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return;
	if (isPublicAuthPath(trimmed)) return;
	try {
		sessionStorage.setItem(STORAGE_KEY, trimmed);
	} catch {
		/* ignore quota / private mode */
	}
}

/** Read and clear the stored post-login path. Returns null if missing/invalid. */
export function consumePostLoginRedirect(): string | null {
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		sessionStorage.removeItem(STORAGE_KEY);
		if (!stored) return null;
		const trimmed = stored.trim();
		if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
		// Defensive: neutralise values stored before the exclusion above existed.
		if (isPublicAuthPath(trimmed)) return null;
		return trimmed;
	} catch {
		return null;
	}
}
