export interface AvailableReport {
	code: string;
	label: string;
}

export interface ReportHeader {
	label: string;
	key: string;
	sequence: number;
	export: boolean;
}

export type ReportRow = Record<string, unknown>;

export interface ReportData {
	header: ReportHeader[];
	detail: ReportRow[];
}

export interface ReportRequest {
	reportType: string;
	from?: string;
	to?: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
	v !== null && typeof v === 'object' && !Array.isArray(v);

const coerceNumber = (v: unknown, fallback = 0): number => {
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
	return fallback;
};

const coerceBoolean = (v: unknown, fallback: boolean): boolean => {
	if (typeof v === 'boolean') return v;
	if (typeof v === 'string') {
		const s = v.trim().toLowerCase();
		if (s === 'true') return true;
		if (s === 'false') return false;
	}
	return fallback;
};

export const parseAvailableReportsResponse = (response: unknown): AvailableReport[] => {
	const payload = isRecord(response) ? response.data : response;
	if (!Array.isArray(payload)) {
		console.warn('Invalid /reports/available response structure', response);
		return [];
	}
	return payload
		.map((row): AvailableReport | null => {
			if (!isRecord(row)) return null;
			const code = typeof row.value === 'string' ? row.value.trim() : '';
			const label = typeof row.label === 'string' ? row.label.trim() : '';
			if (!code || !label) return null;
			return { code, label };
		})
		.filter((entry): entry is AvailableReport => entry !== null);
};

const parseReportHeader = (raw: unknown, index: number): ReportHeader | null => {
	if (!isRecord(raw)) return null;
	const key = typeof raw.key === 'string' ? raw.key.trim() : '';
	const label = typeof raw.label === 'string' ? raw.label.trim() : '';
	if (!key || !label) return null;
	return {
		key,
		label,
		sequence: coerceNumber(raw.sequence, index + 1),
		export: coerceBoolean(raw.export, true)
	};
};

export const parseReportResponse = (response: unknown): ReportData => {
	if (!isRecord(response)) {
		console.warn('Invalid /reports/:reportType response structure', response);
		return { header: [], detail: [] };
	}
	const headerRaw = Array.isArray(response.header) ? response.header : [];
	const detailRaw = Array.isArray(response.detail) ? response.detail : [];

	const header = headerRaw
		.map(parseReportHeader)
		.filter((h): h is ReportHeader => h !== null)
		.sort((a, b) => a.sequence - b.sequence);

	const detail = detailRaw.filter(isRecord);

	return { header, detail };
};
