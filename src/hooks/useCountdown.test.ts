import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns 0 for a null deadline', () => {
		const { result } = renderHook(() => useCountdown(null));

		expect(result.current).toBe(0);
	});

	it('reports the seconds remaining until the deadline', () => {
		const deadline = Date.now() + 30_000;
		const { result } = renderHook(() => useCountdown(deadline));

		expect(result.current).toBe(30);
	});

	it('counts down as time passes', () => {
		const deadline = Date.now() + 30_000;
		const { result } = renderHook(() => useCountdown(deadline));

		act(() => {
			vi.advanceTimersByTime(5_000);
		});

		expect(result.current).toBe(25);
	});

	it('recomputes from the wall clock when ticks are missed', () => {
		// A backgrounded tab throttles setInterval; the value must still be right.
		const deadline = Date.now() + 600_000;
		const { result } = renderHook(() => useCountdown(deadline));

		act(() => {
			// Jump the wall clock as a sleeping tab would, then allow a single tick.
			vi.setSystemTime(new Date('2026-01-01T00:04:59.000Z'));
			vi.advanceTimersByTime(1_000);
		});

		// 5 minutes elapsed in one tick: derived from the clock, not decremented.
		expect(result.current).toBe(300);
	});

	it('clamps to zero for a deadline in the past', () => {
		const deadline = Date.now() - 5_000;
		const { result } = renderHook(() => useCountdown(deadline));

		expect(result.current).toBe(0);
	});
});
