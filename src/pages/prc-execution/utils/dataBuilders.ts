import { type TimelineStep, type FormData } from '../types/execution.types';

export function buildAggregatedData(step: TimelineStep, formData: FormData): Record<string, unknown> {
	if (step.type === 'rawMaterials') {
		return { rawMaterials: formData };
	}

	if (step.type === 'bom') {
		return { bom: formData };
	}

	if (step.type === 'sequence' && step.stepData) {
		// Build nested structure: { "23": { "7": { "13": value } } }
		const { prcTemplateStepId, stepGroupId, stepId } = step.stepData;

		return {
			[prcTemplateStepId.toString()]: {
				[stepGroupId?.toString() || '']: {
					[stepId?.toString() || '']: formData
				}
			}
		};
	}

	if (step.type === 'inspection' && step.inspectionParameters && step.stepData) {
		// Build structure: { "82": { "15": { "TEST": { "TEST1": "value", "TEST2": "value" } } } }
		const prcTemplateStepId = step.stepData.prcTemplateStepId;
		const inspectionData: Record<string, unknown> = {};

		// Group form data by parameter ID
		for (const param of step.inspectionParameters) {
			const paramData: Record<string, unknown> = {};

			// Handle multi-column parameters
			Object.entries(formData).forEach(([key, value]) => {
				if (key.startsWith(`${param.id}_`)) {
					const columnName = key.replace(`${param.id}_`, '');
					paramData[columnName] = value;
				} else if (key === param.id.toString()) {
					// Single value parameter
					paramData[param.parameterName] = value;
				}
			});

			if (Object.keys(paramData).length > 0) {
				// Wrap in parameter name level to match backend structure
				inspectionData[param.id.toString()] = {
					[param.parameterName]: paramData
				};
			}
		}

		return {
			[prcTemplateStepId.toString()]: inspectionData
		};
	}

	return {};
}

export function buildTimingData(step: TimelineStep, startTime: string, endTime: string): Record<string, unknown> {
	if (step.type === 'rawMaterials') {
		return {
			rawMaterials: {
				startTime,
				endTime
			}
		};
	}

	if (step.type === 'bom') {
		return {
			bom: {
				startTime,
				endTime
			}
		};
	}

	if (step.type === 'sequence' && step.stepData) {
		// Build nested structure: { "23": { "7": { "13": { startTime, endTime } } } }
		const { prcTemplateStepId, stepGroupId, stepId } = step.stepData;

		return {
			[prcTemplateStepId.toString()]: {
				[stepGroupId?.toString() || '']: {
					[stepId?.toString() || '']: {
						startTime,
						endTime
					}
				}
			}
		};
	}

	if (step.type === 'inspection' && step.stepData) {
		// Build structure: { "82": { startTime, endTime } }
		const prcTemplateStepId = step.stepData.prcTemplateStepId;

		return {
			[prcTemplateStepId.toString()]: {
				startTime,
				endTime
			}
		};
	}

	return {};
}

export function mergeAggregatedData(
	existingData: Record<string, unknown> | undefined,
	newData: Record<string, unknown>
): Record<string, unknown> {
	if (!existingData) {
		return newData;
	}

	// Deep merge the data structures
	const merged = { ...existingData };

	for (const [key, value] of Object.entries(newData)) {
		if (merged[key] && typeof merged[key] === 'object' && typeof value === 'object') {
			// Recursively merge nested objects
			merged[key] = mergeAggregatedData(merged[key] as Record<string, unknown>, value as Record<string, unknown>);
		} else {
			// Overwrite or add new value
			merged[key] = value;
		}
	}

	return merged;
}

export function mergeTimingData(
	existingData: Record<string, unknown> | undefined,
	newData: Record<string, unknown>
): Record<string, unknown> {
	// Same logic as mergeAggregatedData but for timing
	return mergeAggregatedData(existingData, newData);
}
