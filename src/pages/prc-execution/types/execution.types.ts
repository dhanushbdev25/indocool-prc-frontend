// TypeScript interfaces for PRC Execution screen

import { TableConfig } from '../../../types/table-config.types';

// Annotation types
export interface AnnotationPoint {
	type: 'point';
	id: string;
	x: number;
	y: number;
	cls: string;
	comment: string;
	category?: string;
}

export interface AnnotationPolygon {
	type: 'polygon';
	id: string;
	points: Array<[number, number]>;
	cls: string;
	comment: string;
	category?: string;
}

/** Normalized center (cx, cy) in 0–1 relative to canvas width/height; radius is fraction of min(canvasWidth, canvasHeight) */
export interface AnnotationCircle {
	type: 'circle';
	id: string;
	cx: number;
	cy: number;
	radius: number;
	cls: string;
	comment: string;
	category?: string;
}

export type AnnotationRegion = AnnotationPoint | AnnotationPolygon | AnnotationCircle;

export interface ImageAnnotation {
	imageFileName: string;
	imageUrl: string;
	regions: AnnotationRegion[];
}

export interface FixedTableRowAnnotation {
	rowIndex: number;
	annotations: ImageAnnotation[];
	/** Derived client-side from annotations; persisted with row payload when present */
	defectCounts?: Record<string, number>;
}

export interface StepGroup {
	id: number;
	processName: string;
	processDescription: string;
	sequenceTiming?: number;
	steps: Array<{
		id: number;
		ctq: boolean;
		stepType: string;
		targetValueType: string;
		uom: string;
		minValue?: string;
		maxValue?: string;
		minimumAcceptanceValue?: string;
		maximumAcceptanceValue?: string;
		multipleMeasurements: boolean;
		multipleMeasurementMaxCount?: number;
		tableConfig?: TableConfig | null;
		notes: string;
		parameterDescription: string;
		evaluationMethod: string;
		allowAttachments: boolean;
		stepNumber: number;
		version: number;
		isLatest: boolean;
		createdAt: string;
		updatedAt: string;
		processStepGroupId: number;
		responsiblePerson?: boolean;
	}>;
}

/** Passed from StepPreview when completing a step (remarks + delay reason when timing exceeded). */
export interface ProceedFromPreviewPayload {
	timingExceededRemarks?: string;
	timingExceededReasonCode?: string | number;
	timingExceededReasonLabel?: string;
}

export interface StepPreviewData {
	stepNumber: number;
	title: string;
	type: 'rawMaterials' | 'bom' | 'sequence' | 'inspection';
	ctq: boolean;
	data: Record<string, unknown> | unknown[];
	productionApproved: boolean;
	ctqApproved: boolean;
	partialCtqApprove?: boolean;
	stepCompleted: boolean;
	timingExceeded?: boolean;
	actualDuration?: number;
	expectedDuration?: number;
	timingExceededRemarks?: string;
	/** Selected combo value from GET /combo?type=OPERATIONDELAYREASON */
	timingExceededReasonCode?: string | number;
	/** Denormalized label for read-only display when combo list is not loaded */
	timingExceededReasonLabel?: string;
	// Additional metadata for inspection steps
	inspectionParameters?: Array<{
		id: number;
		parameterName: string;
		type: string;
		ctq: boolean;
		role: string;
		columns: Array<{
			name: string;
			type: string;
			defaultValue?: string;
			tolerance?: string;
		}>;
		tableConfig?: TableConfig | null;
		specification: string;
		order: number;
		tolerance?: string;
		files?: Array<{
			fileName: string;
			filePath: string;
			originalFileName: string;
		}>;
		rowMappings?: Array<{
			rowIndex: number;
			fileName: Array<{
				fileName: string;
				filePath: string;
				originalFileName: string;
			}>;
		}>;
		version: number;
		isLatest: boolean;
		createdAt: string;
		updatedAt: string;
		inspectionId: number;
	}>;
	inspectionMetadata?: {
		id: number;
		type: string;
		status: string;
		version: number;
		isLatest: boolean;
		createdAt: string;
		updatedAt: string;
		inspectionId: string;
		inspectionName: string;
		approveByProduction?: boolean;
		approveByQuality?: boolean;
	};
}

export interface TimelineStep {
	stepNumber: number;
	type: 'setup' | 'rawMaterials' | 'bom' | 'sequence' | 'inspection' | 'sapConfirmations';
	title: string;
	description: string;
	status: 'completed' | 'in-progress' | 'pending';
	ctq: boolean;
	productionApproved?: boolean;
	ctqApproved?: boolean;
	partialCtqApprove?: boolean;
	// For raw materials/bom
	items?: Array<{
		id: number;
		name: string;
		quantity: string;
		splitQuantity?: string;
		/** Planned / required quantity UOM */
		uom: string;
		/** Display UOM for actual line (API); falls back to `uom` when mapped */
		actualUom?: string;
		actualQuantity?: string | number;
		batchNumber?: string;
		description?: string;
		materialType?: string;
		batching?: boolean;
		// Additional fields for BOM/catalyst mixing
		materialCode?: string;
		materialName?: string;
		order?: number;
		splitting?: boolean;
		splittingConfiguration?: Array<{
			order: number;
			splitQuantity: string;
		}> | null;
	}>;
	// For sequence step groups
	stepGroup?: StepGroup;
	prcTemplateStepId?: number;
	// For individual sequence steps (when within a step group)
	stepData?: {
		prcTemplateStepId: number;
		stepGroupId?: number;
		stepId?: number;
		stepType?: string;
		targetValueType?: string;
		uom?: string;
		minValue?: string;
		maxValue?: string;
		minimumAcceptanceValue?: string;
		maximumAcceptanceValue?: string;
		multipleMeasurements?: boolean;
		multipleMeasurementMaxCount?: number;
		tableConfig?: TableConfig | null;
		notes?: string;
		parameterDescription?: string;
		evaluationMethod?: string;
		allowAttachments?: boolean;
		stepNumber?: number;
		responsiblePerson?: boolean;
	};
	// For inspection steps
	inspectionParameters?: Array<{
		id: number;
		parameterName: string;
		type: string;
		ctq: boolean;
		role: string;
		columns: Array<{
			name: string;
			type: string;
			defaultValue?: string;
			tolerance?: string;
		}>;
		tableConfig?: TableConfig | null;
		specification: string;
		order: number;
		tolerance?: string;
		files?: Array<{
			fileName: string;
			filePath: string;
			originalFileName: string;
		}>;
		rowMappings?: Array<{
			rowIndex: number;
			fileName: Array<{
				fileName: string;
				filePath: string;
				originalFileName: string;
			}>;
		}>;
		version: number;
		isLatest: boolean;
		createdAt: string;
		updatedAt: string;
		inspectionId: number;
	}>;
	// For inspection metadata
	inspectionMetadata?: {
		id: number;
		type: string;
		status: string;
		version: number;
		isLatest: boolean;
		createdAt: string;
		updatedAt: string;
		inspectionId: string;
		inspectionName: string;
		approveByProduction?: boolean;
		approveByQuality?: boolean;
	};
}

/** Operation setup (execution): simplified person line — not sequence-step measurement responsible persons */
export interface OperationWiseExecutionPerson {
	id?: string;
	employeeId: string;
	employeeName: string;
	workstation: string;
}

/**
 * One row per operation from part master + execution runtime fields.
 * Matches Part Master `OperationWisePartRow` plus assignments and deviation flag.
 */
export interface OperationWiseExecutionRow {
	id: string | number;
	operationID: number;
	operationName: string;
	/** Optional until part master / runtime supplies a planned headcount */
	responsiblePersonCount?: number;
	/** When present, should match sum(l1–l4); used for display and deviation when set */
	l1Count?: number;
	l2Count?: number;
	l3Count?: number;
	l4Count?: number;
	responsiblePersons?: OperationWiseExecutionPerson[];
	/** True when saved count of responsiblePersons differs from expected headcount */
	countDeviated?: boolean;
}

export interface ExecutionData {
	id: number;
	customer: string;
	partId: number;
	partNumber: string;
	partDescription: string;
	version: number;
	productionSetId: string;
	mouldId: string;
	date: string;
	shift: string;
	inCharge: number;
	remarks?: string;
	drawingNumber: string;
	status: string;
	prcTemplate: number;
	catalyst: number;
	progress: number;
	completedCtq: number;
	totalCtq: number;
	duration: number;
	stepsCompleted: number;
	totalSteps: number;
	currentStage: number;
	nextStage: number;
	createdBy: number;
	updatedBy: number;
	createdAt: string;
	updatedAt: string;
	// Additional fields from API response
	customerVariantId?: number | null;
	customerVariantName?: string | null;
	reservation?: string | null;
	/** From GET root; merged with prcAggregatedSteps.operationWiseData for setup step */
	operationWiseData?: OperationWiseExecutionRow[];
	mouldingInspectionParentId: number;
	mouldingInspectionId: number;
	ctqMap: unknown;
	sequenceIds: unknown;
	prcCurrentTemplate?: {
		prcTemplate: {
			id: number;
			templateId: string;
			templateName: string;
			version: number;
			status: string;
			notes?: string;
		};
		prcTemplateSteps: Array<{
			id: number;
			type: string;
			stepId?: number;
			sequence: number;
			data?: unknown;
		}>;
	};
	rawMaterials?: Array<{
		id: number;
		materialCode: string;
		materialName: string;
		quantity: string;
		uom: string;
		batching: boolean;
		actualQuantity?: string | number;
		batchNumber?: string;
		/** Optional; when absent, UI uses `uom` for the actual UOM column */
		actualUom?: string;
	}>;
	bom?: Array<{
		id: number;
		uom: string;
		order: number;
		partId: number;
		version: number;
		batching: boolean;
		isLatest: boolean;
		quantity: string;
		createdAt: string;
		splitting: boolean;
		updatedAt: string;
		materialCode: string;
		materialName: string;
		splitQuantity: string;
		splittingConfiguration: Array<{
			order: number;
			splitQuantity: string;
		}> | null;
	}>;
	inspectionDiagrams?: {
		files?: Array<{
			inspectionParameterId?: number;
			fileName?: Array<{
				fileName: string;
				filePath: string;
				originalFileName: string;
			}>;
			rowMappings?: Array<{
				rowIndex: number;
				fileName: Array<{
					fileName: string;
					filePath: string;
					originalFileName: string;
				}>;
			}>;
		}> | null;
	};
	prcAggregatedSteps?: Record<string, unknown> & {
		stepApprovedBy?: Record<string, unknown>;
		prcmetadata?: Record<string, unknown>;
		operationWiseData?: OperationWiseExecutionRow[];
	};
	stepStartEndTime?: Record<string, unknown>;
	catalystData?: {
		catalyst: {
			id: number;
			status: string;
			chartId: string;
			version: number;
			isLatest: boolean;
			chartSupplier: string;
			notes: string;
			mekpDensity: string;
			isActive: boolean;
			createdBy: number | null;
			updatedBy: number | null;
			createdAt: string;
			updatedAt: string;
		};
		catalystConfiguration: Array<{
			id: number;
			catalystId: number;
			chartId: string;
			version: number;
			isLatest: boolean;
			minTemperature: string;
			maxTemperature: string;
			minHumidity: string;
			maxHumidity: string;
			minGelcoat: string;
			maxGelcoat: string;
			gelcoatLabel: string;
			minResinDosage: string;
			maxResinDosage: string;
			resinLabel: string;
			minTopCoat: string;
			maxTopCoat: string;
			topCoatLabel: string;
			blockCatalystMixing: boolean;
			requestSupervisorApproval: boolean;
			createdAt: string;
			updatedAt: string;
		}>;
	};
}

export interface FormData {
	[key: string]: unknown;
	// Support for annotation data
	annotations?: ImageAnnotation[];
	// Support for fixed-table row level annotations
	rowAnnotations?: FixedTableRowAnnotation[];
	// Support for responsible person data - now supports both single object (backward compatibility) and array
	responsiblePersonData?:
		| {
				role: 'l1' | 'l2' | 'l3' | 'l4';
				employeeName: string;
				employeeCode: string;
		  }
		| Array<{
				id: string;
				role: 'l1' | 'l2' | 'l3' | 'l4';
				employeeName: string;
				employeeCode: string;
		  }>;
}

// Catalyst mixing specific types
export interface CatalystMixingEntry {
	id: string; // Unique identifier for this entry
	materialId: number; // Material ID for hierarchy lookup
	materialCode: string;
	materialName: string;
	quantity: string;
	uom: string;
	order?: number; // For split materials
	isSplit: boolean;
	temperature: string;
	humidity: string;
	/** Optional can / container identifier captured during mixing */
	canNumber: string;
	actualQuantity: string;
	catalystQuantity: string;
	calculatedMin: number;
	calculatedMax: number;
	validationStatus: 'Accepted' | 'Lesser' | 'Greater';
	acknowledged: boolean;
	blocked: boolean;
	requiresSupervisorApproval: boolean;
}

export interface CatalystMixingFormData {
	entries: CatalystMixingEntry[];
}

export interface StepTiming {
	startTime: string;
	endTime: string;
	productionApproved?: string; // Timestamp when approve production button was clicked
	ctqApproved?: string; // Timestamp when approve CTQ button was clicked
	stepCompleted?: string; // Timestamp when complete step button was clicked
}

export interface StepApprovalBy {
	dataEnteredBy?: number; // User ID who entered/completed the step data
	productionApprovedBy?: number; // User ID who approved production
	ctqApprovedBy?: number; // User ID who approved CTQ
	stepCompletedBy?: number; // User ID who completed the step
}

export interface AggregatedData {
	prcAggregatedSteps: Record<string, unknown> & {
		stepApprovedBy?: Record<string, unknown>;
	};
	stepStartEndTime: Record<string, unknown>;
}
