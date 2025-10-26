// TypeScript interfaces for PRC Execution screen

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

export type AnnotationRegion = AnnotationPoint | AnnotationPolygon;

export interface ImageAnnotation {
	imageFileName: string;
	imageUrl: string;
	regions: AnnotationRegion[];
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
		specification: string;
		order: number;
		tolerance?: string;
		files?: Array<{
			fileName: string;
			filePath: string;
			originalFileName: string;
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
	};
}

export interface TimelineStep {
	stepNumber: number;
	type: 'rawMaterials' | 'bom' | 'sequence' | 'inspection';
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
		uom: string;
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
		stepGroupId?: number; // Only for sequence steps
		stepId?: number; // Only for sequence steps
		stepType?: string; // Measurement, Check, Operation, Inspection (only for sequence steps)
		targetValueType?: string; // range, exact value, ok/not ok (only for sequence steps)
		uom?: string; // Only for sequence steps
		minValue?: string; // Only for sequence steps
		maxValue?: string; // Only for sequence steps
		minimumAcceptanceValue?: string; // Only for sequence steps
		maximumAcceptanceValue?: string; // Only for sequence steps
		multipleMeasurements?: boolean; // Only for sequence steps
		multipleMeasurementMaxCount?: number; // Only for sequence steps
		notes?: string; // Only for sequence steps
		parameterDescription?: string; // Only for sequence steps
		evaluationMethod?: string; // Only for sequence steps
		allowAttachments?: boolean; // Only for sequence steps
		stepNumber?: number; // Only for sequence steps
		responsiblePerson?: boolean; // Only for sequence steps
	};
	// For inspection steps
	inspectionParameters?: Array<{
		id: number;
		parameterName: string;
		type: string; // number, image, text
		ctq: boolean;
		role: string;
		columns: Array<{
			name: string;
			type: string;
			defaultValue?: string;
			tolerance?: string;
		}>;
		specification: string;
		order: number;
		tolerance?: string;
		files?: Array<{
			fileName: string;
			filePath: string;
			originalFileName: string;
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
	};
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
	prcAggregatedSteps?: Record<string, unknown>;
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
	// Support for responsible person data
	responsiblePersonData?: {
		role: 'l1' | 'l2' | 'l3' | 'l4';
		employeeName: string;
		employeeCode: string;
	};
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

export interface AggregatedData {
	prcAggregatedSteps: Record<string, unknown>;
	stepStartEndTime: Record<string, unknown>;
}
