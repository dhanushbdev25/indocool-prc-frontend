import { useEffect, useState } from 'react';

function computeRemaining(deadline: number | null): number {
	if (deadline === null) return 0;
	return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

/**
 * Whole seconds remaining until `deadline` (epoch ms); 0 when null or elapsed.
 *
 * The value is recomputed from the wall clock on every tick — and again when the
 * tab regains focus — rather than decremented. Background tabs throttle timers to
 * roughly once a minute, so a decrementing counter would drift badly while the
 * user is away.
 */
export function useCountdown(deadline: number | null): number {
	const [remaining, setRemaining] = useState(() => computeRemaining(deadline));

	useEffect(() => {
		const sync = () => setRemaining(computeRemaining(deadline));
		sync();
		if (deadline === null) return;

		const intervalId = window.setInterval(sync, 1000);
		document.addEventListener('visibilitychange', sync);
		window.addEventListener('focus', sync);

		return () => {
			window.clearInterval(intervalId);
			document.removeEventListener('visibilitychange', sync);
			window.removeEventListener('focus', sync);
		};
	}, [deadline]);

	return remaining;
}
