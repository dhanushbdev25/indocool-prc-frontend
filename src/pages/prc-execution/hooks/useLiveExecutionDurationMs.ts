import { useEffect, useState } from 'react';
import { type ExecutionData } from '../types/execution.types';

const TERMINAL_STATUSES = new Set(['COMPLETED', 'INACTIVE']);

function isTerminalStatus(status: string): boolean {
	return TERMINAL_STATUSES.has(status);
}

/**
 * Extrapolates total execution duration from the last API snapshot (`duration` as of `updatedAt`)
 * while the run is non-terminal, updating once per second without extra GETs.
 */
export function useLiveExecutionDurationMs(executionData: ExecutionData): number {
	const [now, setNow] = useState(() => Date.now());
	const terminal = isTerminalStatus(executionData.status);

	useEffect(() => {
		if (terminal) return;
		const id = window.setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [terminal]);

	const base = executionData.duration;
	if (terminal) {
		return Math.max(0, base);
	}

	const updated = new Date(executionData.updatedAt).getTime();
	if (!Number.isFinite(updated)) {
		return Math.max(0, base);
	}

	return Math.max(0, base + (now - updated));
}
