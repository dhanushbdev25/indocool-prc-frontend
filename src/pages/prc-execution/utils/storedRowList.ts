import { transformObjectToArray } from './dataTransformers';

/**
 * Fixed-table rows are saved as an array, but re-saving a step used to spread that array into an
 * index-keyed object (`{ "0": {...} }`) — the shape nearly every stored execution holds. The merge
 * that caused it is fixed, so newer saves are arrays; both have to render or the sheet reads empty.
 */
export const readStoredRowList = <T>(value: unknown): T[] => {
	if (Array.isArray(value)) return value as T[];
	if (value !== null && typeof value === 'object') return transformObjectToArray(value as Record<string, T>);
	return [];
};
