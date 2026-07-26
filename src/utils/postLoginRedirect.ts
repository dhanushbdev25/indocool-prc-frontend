const STORAGE_KEY = 'postLoginRedirect';

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
		return trimmed;
	} catch {
		return null;
	}
}
