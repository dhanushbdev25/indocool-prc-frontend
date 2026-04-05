export interface SplittingConfigRow {
	order: number;
	splitQuantity: string | number;
}

export interface RawMaterial {
	id?: number;
	partId?: number;
	materialName: string;
	materialCode: string;
	quantity: string;
	uom: string;
	version?: number;
	isLatest?: boolean;
	batching?: boolean;
	splitting?: boolean;
	splittingConfiguration?: SplittingConfigRow[] | null;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface Drilling {
	id?: number;
	partId?: number;
	characteristics: string;
	specification: string;
	noOfHoles: string;
	diaOfHoles: string;
	tolerance: string;
	version?: number;
	isLatest?: boolean;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface Cutting {
	id?: number;
	partId?: number;
	characteristics: string;
	specification: string;
	tolerance: string;
	version?: number;
	isLatest?: boolean;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface PartDrawing {
	fileName?: string;
	filePath?: string;
	originalFileName?: string;
	[key: string]: unknown;
}

export interface InspectionDiagramFileEntry {
	fileName?: string;
	filePath?: string;
	originalFileName?: string;
	[key: string]: unknown;
}

export interface InspectionDiagramFileGroup {
	inspectionParameterId?: number;
	fileName?: InspectionDiagramFileEntry[];
	[key: string]: unknown;
}

export interface InspectionDiagram {
	partId?: number;
	files?: InspectionDiagramFileGroup[] | null;
	[key: string]: unknown;
}

export interface Mould {
	mouldCode: string;
	reconciliationCount: number;
	currentCount?: number;
	lastReconciledAt?: string;
	[key: string]: unknown;
}

export type PartStatus = 'ACTIVE' | 'NEW' | 'INACTIVE';

export interface PartMaster {
	id?: number;
	partNumber: string;
	drawingNumber: string;
	drawingRevision?: number;
	partRevision?: number;
	status?: PartStatus;
	customer: string;
	description: string;
	notes?: string | null;
	layupType?: string | null;
	model?: string | null;
	sapReferenceNumber?: string | null;
	version?: number;
	isLatest?: boolean;
	catalyst?: number | null;
	prcTemplate?: number | null;
	createdBy?: number | null;
	updatedBy?: number | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	customerName?: string | null;
	mouldDetails?: Mould[];
	files?: PartDrawing[] | null;
	inspectionDiagrams?: InspectionDiagram | InspectionDiagram[] | null;
}

export interface CustomerCombo {
	label: string;
	value: string;
	data?: Record<string, unknown>;
	[key: string]: unknown;
}

export interface PartDetail {
	partMaster: PartMaster;
	rawMaterials: RawMaterial[];
	drilling: Drilling[];
	cutting: Cutting[];
	files?: PartDrawing[] | null;
	inspectionDiagrams?: InspectionDiagram | InspectionDiagram[] | null;
	[key: string]: unknown;
}

export interface PartListHeader {
	ACTIVE: number;
	NEW: number;
	INACTIVE: number;
}

export interface PartsResponse {
	header: PartListHeader;
	detail: PartDetail[];
}

export interface PartByIdResponse {
	header: PartListHeader;
	detail: PartDetail;
}

export interface CustomersResponse {
	data: CustomerCombo[];
}

export interface CreatePartResponse {
	message: string;
	data: PartMaster;
}

export interface UpdatePartResponse {
	message: string;
	data: PartMaster;
}

/** Raw material row for create/update payloads (no persisted ids). */
export type RawMaterialInput = Omit<RawMaterial, 'id' | 'partId' | 'createdAt' | 'updatedAt'>;
export type DrillingInput = Omit<Drilling, 'id' | 'partId' | 'createdAt' | 'updatedAt'>;
export type CuttingInput = Omit<Cutting, 'id' | 'partId' | 'createdAt' | 'updatedAt'>;

export type PartMasterCreatePayload = Omit<PartMaster, 'id' | 'createdAt' | 'updatedAt' | 'customerName'>;

export interface CreatePartRequest {
	data: {
		partMaster: PartMasterCreatePayload;
		rawMaterials: RawMaterialInput[];
		drilling: DrillingInput[];
		cutting: CuttingInput[];
	};
}

export type PartMasterUpdatePayload = Omit<PartMaster, 'createdAt' | 'updatedAt' | 'customerName'>;

export interface UpdatePartRequest {
	id: number;
	data: {
		partMaster: PartMasterUpdatePayload;
		rawMaterials: RawMaterialInput[];
		drilling: DrillingInput[];
		cutting: CuttingInput[];
	};
}

export interface DeletePartRequest {
	partMaster: PartMasterUpdatePayload;
	rawMaterials: RawMaterialInput[];
	drilling: DrillingInput[];
	cutting: CuttingInput[];
}

function isPartListHeader(value: unknown): value is PartListHeader {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const h = value as Record<string, unknown>;
	return (
		typeof h.ACTIVE === 'number' &&
		typeof h.NEW === 'number' &&
		typeof h.INACTIVE === 'number'
	);
}

function isPartDetail(value: unknown): value is PartDetail {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const d = value as Record<string, unknown>;
	return (
		d.partMaster !== null &&
		typeof d.partMaster === 'object' &&
		!Array.isArray(d.partMaster) &&
		Array.isArray(d.rawMaterials) &&
		Array.isArray(d.drilling) &&
		Array.isArray(d.cutting)
	);
}

export function isPartsResponse(value: unknown): value is PartsResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!isPartListHeader(o.header) || !Array.isArray(o.detail)) {
		return false;
	}
	return o.detail.every(isPartDetail);
}

export function isPartByIdResponse(value: unknown): value is PartByIdResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return isPartListHeader(o.header) && isPartDetail(o.detail);
}

export function isCustomersResponse(value: unknown): value is CustomersResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!Array.isArray(o.data)) {
		return false;
	}
	return o.data.every(
		(item): item is CustomerCombo =>
			item !== null &&
			typeof item === 'object' &&
			!Array.isArray(item) &&
			typeof (item as Record<string, unknown>).label === 'string' &&
			typeof (item as Record<string, unknown>).value === 'string'
	);
}

export function isPartMutationResponse(value: unknown): value is CreatePartResponse | UpdatePartResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return (
		typeof o.message === 'string' &&
		o.data !== null &&
		typeof o.data === 'object' &&
		!Array.isArray(o.data)
	);
}
