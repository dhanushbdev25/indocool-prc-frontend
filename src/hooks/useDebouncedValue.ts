import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has been stable for `delay` ms.
 * delay <= 0 returns the value immediately (useful for tests).
 */
export function useDebouncedValue<T>(value: T, delay = 280): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		if (delay <= 0) {
			setDebounced(value);
			return;
		}
		const id = window.setTimeout(() => setDebounced(value), delay);
		return () => window.clearTimeout(id);
	}, [value, delay]);

	return debounced;
}

export default useDebouncedValue;
