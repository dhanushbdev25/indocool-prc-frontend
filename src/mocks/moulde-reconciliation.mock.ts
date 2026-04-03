export interface PartMouldeMapping {
	partNumber: string;
	mouldeCode: string;
	reconciliationCount: number;
	currentCount: number;
	lastReconciledAt?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let partMouldeStore: PartMouldeMapping[] = [
	{
		partNumber: 'PN-10045',
		mouldeCode: 'MLD-001',
		reconciliationCount: 50,
		currentCount: 52,
		lastReconciledAt: '2026-03-20T10:00:00.000Z'
	},
	{
		partNumber: 'PN-10045',
		mouldeCode: 'MLD-002',
		reconciliationCount: 100,
		currentCount: 87,
		lastReconciledAt: '2026-03-15T10:00:00.000Z'
	},
	{
		partNumber: 'PN-77890',
		mouldeCode: 'MLD-009',
		reconciliationCount: 80,
		currentCount: 81,
		lastReconciledAt: '2026-03-10T10:00:00.000Z'
	}
];

const normalizePartNumber = (partNumber: string) => partNumber.trim().toUpperCase();
const normalizeMouldeCode = (mouldeCode: string) => mouldeCode.trim().toUpperCase();

export const getPartMouldes = async (partNumber: string): Promise<PartMouldeMapping[]> => {
	await delay(120);
	const normalized = normalizePartNumber(partNumber);
	return partMouldeStore.filter(item => normalizePartNumber(item.partNumber) === normalized);
};

export const upsertPartMouldes = async (
	partNumber: string,
	mouldes: Array<{ mouldeCode: string; reconciliationCount: number; currentCount?: number }>
): Promise<void> => {
	await delay(150);
	const normalizedPart = normalizePartNumber(partNumber);
	partMouldeStore = partMouldeStore.filter(item => normalizePartNumber(item.partNumber) !== normalizedPart);

	const mapped: PartMouldeMapping[] = mouldes.map(moulde => ({
		partNumber: normalizedPart,
		mouldeCode: normalizeMouldeCode(moulde.mouldeCode),
		reconciliationCount: Number(moulde.reconciliationCount) || 0,
		currentCount: Number(moulde.currentCount ?? 0) || 0
	}));

	partMouldeStore = [...partMouldeStore, ...mapped];
};

export const getDueMouldes = async (): Promise<PartMouldeMapping[]> => {
	await delay(200);
	return partMouldeStore.filter(item => item.currentCount >= item.reconciliationCount && item.reconciliationCount > 0);
};

export const reconcileMoulde = async (partNumber: string, mouldeCode: string): Promise<void> => {
	await delay(200);
	const normalizedPart = normalizePartNumber(partNumber);
	const normalizedMoulde = normalizeMouldeCode(mouldeCode);

	partMouldeStore = partMouldeStore.map(item => {
		if (
			normalizePartNumber(item.partNumber) === normalizedPart &&
			normalizeMouldeCode(item.mouldeCode) === normalizedMoulde
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

export const getPartMouldeSummary = (partNumber: string) => {
	const normalizedPart = normalizePartNumber(partNumber);
	const partMouldes = partMouldeStore.filter(item => normalizePartNumber(item.partNumber) === normalizedPart);
	return {
		totalMouldes: partMouldes.length,
		dueMouldes: partMouldes.filter(item => item.currentCount >= item.reconciliationCount && item.reconciliationCount > 0).length
	};
};
