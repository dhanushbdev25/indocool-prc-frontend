// TypeScript interfaces for PRC Execution screen

// Annotation types
export interface AnnotationPoint {
	type: 'point';
	id: string;
	x: number;
	y: number;
	cls: string;
	comment: string;
}

export interface AnnotationPolygon {
	type: 'polygon';
	id: string;
	points: Array<[number, number]>;
	cls: string;
	comment: string;
}

export type AnnotationRegion = AnnotationPoint | AnnotationPolygon;

export interface ImageAnnotation {
	imageFileName: string;
	imageUrl: string;
	regions: AnnotationRegion[];
}

export interface TimelineStep {
	stepNumber: number;
	type: 'rawMaterials' | 'bom' | 'sequence' | 'inspection';
	title: string;
	description: string;
	status: 'completed' | 'in-progress' | 'pending';
	ctq: boolean;
	// For raw materials/bom
	items?: Array<{
		id: number;
		name: string;
		quantity: string;
		uom: string;
		description?: string;
		materialType?: string;
	}>;
	// For sequence steps
	stepData?: {
		prcTemplateStepId: number;
		stepGroupId?: number; // Only for sequence steps
		stepId?: number; // Only for sequence steps
		stepType?: string; // Measurement, Check, Operation, Inspection (only for sequence steps)
		targetValueType?: string; // range, exact value, ok/not ok (only for sequence steps)
		uom?: string; // Only for sequence steps
		minValue?: string; // Only for sequence steps
		maxValue?: string; // Only for sequence steps
		multipleMeasurements?: boolean; // Only for sequence steps
		notes?: string; // Only for sequence steps
		parameterDescription?: string; // Only for sequence steps
		evaluationMethod?: string; // Only for sequence steps
		allowAttachments?: boolean; // Only for sequence steps
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
		files?: Array<{
			fileName: string;
			filePath: string;
			originalFileName: string;
		}>;
	}>;
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
	}>;
	bom?: Array<{
		id: number;
		description: string;
		materialType: string;
		bomQuantity: string;
	}>;
	prcAggregatedSteps?: Record<string, unknown>;
	stepStartEndTime?: Record<string, unknown>;
	catalystData?: {
		catalyst: {
			id: number;
			chartId: string;
			chartSupplier: string;
			notes: string;
		};
		catalystConfiguration: Array<{
			id: number;
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
			blockCatalystMixing: boolean;
			requestSupervisorApproval: boolean;
		}>;
	};
}

export interface FormData {
	[key: string]: unknown;
	// Support for annotation data
	annotations?: ImageAnnotation[];
}

export interface StepTiming {
	startTime: string;
	endTime: string;
}

export interface AggregatedData {
	prcAggregatedSteps: Record<string, unknown>;
	stepStartEndTime: Record<string, unknown>;
}
