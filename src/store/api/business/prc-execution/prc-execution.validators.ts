// Type definitions for PRC Execution (without Zod validation)
// Since PRC Execution APIs are dynamic, we use flexible types

// Parts combo types
export interface PartsComboItem {
	label: string;
	value: number;
	data: {
		partNumber: string;
		drawingNumber: string;
		model?: string;
		description: string;
		version: number;
		prcTemplate: number;
		catalyst: number;
	};
}

// Plant combo types
export interface PlantComboItem {
	label: string;
	value: string;
	data: Record<string, unknown>;
}

export interface PartsComboResponse {
	data: PartsComboItem[];
}

export interface PlantComboResponse {
	data: PlantComboItem[];
}

// PRC Execution types (flexible to handle dynamic data)
export interface PrcExecution {
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
	progress: string | number; // Can be either string or number
	completedCtq: number;
	totalCtq: number;
	duration: string | number; // Can be either string or number
	stepsCompleted: number;
	totalSteps?: number; // Total number of steps in the process
	currentStage: number;
	nextStage: number;
	createdBy: number;
	updatedBy: number;
	createdAt: string;
	updatedAt: string;
	// Additional fields from API response
	mouldingInspectionParentId: number;
	mouldingInspectionId: number;
	ctqMap: unknown;
	sequenceIds: unknown;
	prcCurrentTemplate?: unknown;
	rawMaterials?: unknown[];
	bom?: unknown[];
	currentStep?: unknown;
	prcAggregatedSteps?: unknown;
	stepStartEndTime?: unknown;
	// Allow for additional dynamic fields
	[key: string]: unknown;
}

export interface PrcExecutionResponse {
	data: PrcExecution[];
}

// Create PRC Execution types
export interface CreatePrcExecutionRequest {
	data: {
		customer: string;
		partId: number;
		catalyst: number;
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
		plantCode: string;
	};
}

export interface CreatePrcExecutionResponse {
	message?: string;
	data?: PrcExecution;
}
