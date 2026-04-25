/** Formats milliseconds as H/M/S for execution duration chips and stats (seconds on by default). */
export function formatExecutionDuration(durationMs: number, includeSeconds = true): string {
	const ms = Math.max(0, Math.floor(durationMs));
	const hours = Math.floor(ms / 3600000);
	const minutes = Math.floor((ms % 3600000) / 60000);
	if (includeSeconds) {
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${hours}h ${minutes}m ${seconds}s`;
	}
	return `${hours}h ${minutes}m`;
}
