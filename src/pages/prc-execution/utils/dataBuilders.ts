import { type TimelineStep, type FormData } from '../types/execution.types';

export function buildAggregatedData(step: TimelineStep, formData: FormData): Record<string, unknown> {
	if (step.type === 'rawMaterials') {
		return { rawMaterials: formData };
	}

	if (step.type === 'bom') {
		return { bom: formData };
	}

	if (step.type === 'sequence') {
		// Handle both individual sequence steps and step groups
		if (step.stepData) {
			// Individual sequence step within a step group
			const { prcTemplateStepId, stepGroupId, stepId } = step.stepData;

			return {
				[prcTemplateStepId.toString()]: {
					[stepGroupId?.toString() || '']: {
						[stepId?.toString() || '']: formData
					}
				}
			};
		} else if (step.stepGroup && step.prcTemplateStepId) {
			// This is a step group - we need to extract the sub-step data from formData
			// The formData should contain the stepId and stepGroupId
			if (formData.stepId && formData.stepGroupId) {
				// Extract the actual data value, excluding the metadata
				const {
					stepId: _stepId,
					stepGroupId: _stepGroupId,
					prcTemplateStepId: _prcTemplateStepId,
					...actualData
				} = formData;

				return {
					[step.prcTemplateStepId.toString()]: {
						[formData.stepGroupId.toString()]: {
							[formData.stepId.toString()]: actualData
						}
					}
				};
			}
			return {};
		}
	}

	if (step.type === 'inspection' && step.inspectionParameters && step.stepData) {
		// Build structure: { "82": { "28": { "UPLOAD-TEST-INSPEC-1-PAR-1": { "UPLOAD-TEST-INSPEC-1-PAR-1": "value", "annotations": [...] } } } }
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
					// Single value parameter - extract the actual value from the object structure
					if (typeof value === 'object' && value !== null && 'value' in value) {
						// Extract the actual value from {value: 'q'} structure
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						paramData['value'] = (value as any).value;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						console.log(`DataBuilder: Extracted value for parameter ${param.id}:`, (value as any).value);
					} else {
						// Direct value assignment
						paramData['value'] = value;
						console.log(`DataBuilder: Direct value for parameter ${param.id}:`, value);
					}
				}
			});

			// Handle annotations for this parameter - check if annotations exist in formData for this parameter
			if (formData[param.id.toString()] && typeof formData[param.id.toString()] === 'object') {
				const paramFormData = formData[param.id.toString()] as Record<string, unknown>;
				if (paramFormData.annotations && Array.isArray(paramFormData.annotations)) {
					paramData.annotations = paramFormData.annotations;
					console.log(`DataBuilder: Added annotations for parameter ${param.id}:`, paramFormData.annotations);
				}
			}

			if (Object.keys(paramData).length > 0) {
				// Store directly with parameter ID as key
				inspectionData[param.id.toString()] = paramData;
				console.log(`DataBuilder: Final paramData for parameter ${param.id}:`, paramData);
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

	if (step.type === 'sequence') {
		if (step.stepData) {
			// Individual sequence step within a step group
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
		} else if (step.stepGroup && step.prcTemplateStepId) {
			// Step group timing - this would be called when all steps in the group are completed
			return {};
		}
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
