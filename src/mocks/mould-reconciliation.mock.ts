export interface PartMouldMapping {
	partNumber: string;
	mouldCode: string;
	reconciliationCount: number;
	currentCount: number;
	lastReconciledAt?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let partMouldStore: PartMouldMapping[] = [
	{
		partNumber: 'PN-10045',
		mouldCode: 'MLD-001',
		reconciliationCount: 50,
		currentCount: 52,
		lastReconciledAt: '2026-03-20T10:00:00.000Z'
	},
	{
		partNumber: 'PN-10045',
		mouldCode: 'MLD-002',
		reconciliationCount: 100,
		currentCount: 87,
		lastReconciledAt: '2026-03-15T10:00:00.000Z'
	},
	{
		partNumber: 'PN-77890',
		mouldCode: 'MLD-009',
		reconciliationCount: 80,
		currentCount: 81,
		lastReconciledAt: '2026-03-10T10:00:00.000Z'
	}
];

const normalizePartNumber = (partNumber: string) => partNumber.trim().toUpperCase();
const normalizeMouldCode = (mouldCode: string) => mouldCode.trim().toUpperCase();

export const getPartMoulds = async (partNumber: string): Promise<PartMouldMapping[]> => {
	await delay(120);
	const normalized = normalizePartNumber(partNumber);
	return partMouldStore.filter(item => normalizePartNumber(item.partNumber) === normalized);
};

export const upsertPartMoulds = async (
	partNumber: string,
	moulds: Array<{ mouldCode: string; reconciliationCount: number; currentCount?: number }>
): Promise<void> => {
	await delay(150);
	const normalizedPart = normalizePartNumber(partNumber);
	partMouldStore = partMouldStore.filter(item => normalizePartNumber(item.partNumber) !== normalizedPart);

	const mapped: PartMouldMapping[] = moulds.map(mould => ({
		partNumber: normalizedPart,
		mouldCode: normalizeMouldCode(mould.mouldCode),
		reconciliationCount: Number(mould.reconciliationCount) || 0,
		currentCount: Number(mould.currentCount ?? 0) || 0
	}));

	partMouldStore = [...partMouldStore, ...mapped];
};

export const getDueMoulds = async (): Promise<PartMouldMapping[]> => {
	await delay(200);
	return partMouldStore.filter(item => item.currentCount >= item.reconciliationCount && item.reconciliationCount > 0);
};

export const reconcileMould = async (partNumber: string, mouldCode: string): Promise<void> => {
	await delay(200);
	const normalizedPart = normalizePartNumber(partNumber);
	const normalizedMould = normalizeMouldCode(mouldCode);

	partMouldStore = partMouldStore.map(item => {
		if (
			normalizePartNumber(item.partNumber) === normalizedPart &&
			normalizeMouldCode(item.mouldCode) === normalizedMould
		) {
			return {
				...item,
				currentCount: 0,
				lastReconciledAt: new Date().toISOString()
			};
		}
		return item;
	});
};

export const getPartMouldSummary = (partNumber: string) => {
	const normalizedPart = normalizePartNumber(partNumber);
	const partMoulds = partMouldStore.filter(item => normalizePartNumber(item.partNumber) === normalizedPart);
	return {
		totalMoulds: partMoulds.length,
		dueMoulds: partMoulds.filter(item => item.currentCount >= item.reconciliationCount && item.reconciliationCount > 0).length
	};
};
