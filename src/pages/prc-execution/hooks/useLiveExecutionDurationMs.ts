import { useEffect, useState } from 'react';
import { type ExecutionData } from '../types/execution.types';
import { getExecutionRuntimeMs } from '../utils/timelineCardTiming';

const TERMINAL_STATUSES = new Set(['COMPLETED', 'INACTIVE', 'PREVIEW']);

function isTerminalStatus(status: string): boolean {
	return TERMINAL_STATUSES.has(status);
}

function hasActiveExecutionRuntime(stepStartEndTime: Record<string, unknown> | undefined): boolean {
	const runtime = stepStartEndTime?.executionRuntime as Record<string, unknown> | undefined;
	return typeof runtime?.startTime === 'string' && typeof runtime?.endTime !== 'string';
}

/**
 * Live elapsed duration from `stepStartEndTime.executionRuntime` (setup completion → last template step close).
 * Returns 0 until Execution Setup is completed and runtime start is persisted.
 */
export function useLiveExecutionDurationMs(executionData: ExecutionData): number {
	const [now, setNow] = useState(() => Date.now());
	const terminal = isTerminalStatus(executionData.status);
	const stepStartEndTime = executionData.stepStartEndTime as Record<string, unknown> | undefined;

	useEffect(() => {
		if (terminal || !hasActiveExecutionRuntime(stepStartEndTime)) return;
		const id = window.setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [terminal, stepStartEndTime]);

	return getExecutionRuntimeMs(executionData, now);
}
