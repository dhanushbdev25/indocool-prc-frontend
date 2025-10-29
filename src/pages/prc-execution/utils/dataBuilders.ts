import { type TimelineStep, type FormData } from '../types/execution.types';

export function buildAggregatedData(step: TimelineStep, formData: FormData): Record<string, unknown> {
	if (step.type === 'rawMaterials') {
		return { rawMaterials: formData };
	}

	if (step.type === 'bom') {
		// Handle catalyst mixing data structure using material ID hierarchy
		// Structure: { materialId: { order: { data } } }
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const simplifiedData: Record<string, Record<string, any>> = {};

		if (formData.entries && Array.isArray(formData.entries)) {
			formData.entries.forEach(entry => {
				// Use materialId and order directly from entry
				const materialId = entry.materialId.toString();
				const order = entry.order || 0;

				// Initialize material group if not exists
				if (!simplifiedData[materialId]) {
					simplifiedData[materialId] = {};
				}

				// Store data under order key
				simplifiedData[materialId][order.toString()] = {
					calculatedMax: entry.calculatedMax,
					calculatedMin: entry.calculatedMin,
					catalystQuantity: entry.catalystQuantity,
					validationStatus: entry.validationStatus,
					humidity: entry.humidity,
					temperature: entry.temperature,
					actualQuantity: entry.actualQuantity,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					acknowledged: (formData as any).acknowledgments?.[entry.id] || false
				};
			});
		}

		return { bom: simplifiedData };
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

		// Process each parameter with simplified structure
		for (const param of step.inspectionParameters) {
			const paramData: Record<string, unknown> = {};

			if (param.columns && param.columns.length > 0) {
				// Multi-column parameter: collect all column values
				const valueObj: Record<string, unknown> = {};
				param.columns.forEach(column => {
					const key = `${param.id}_${column.name}`;
					const value = formData[key];
					if (value !== undefined && value !== null) {
						valueObj[column.name] = value;
					}
				});

				if (Object.keys(valueObj).length > 0) {
					paramData.value = valueObj;
				}
			} else {
				// Single value parameter
				const key = param.id.toString();
				const formValue = formData[key];

				if (typeof formValue === 'object' && formValue !== null) {
					// Already in object format: { "value": "ok", "annotations": [...] }
					paramData.value = (formValue as Record<string, unknown>).value;
					if ((formValue as Record<string, unknown>).annotations) {
						paramData.annotations = (formValue as Record<string, unknown>).annotations;
					}
				} else {
					// Direct value
					paramData.value = formValue;
				}
			}

			// Handle annotations for this parameter
			if (formData[param.id.toString()] && typeof formData[param.id.toString()] === 'object') {
				const paramFormData = formData[param.id.toString()] as Record<string, unknown>;
				if (paramFormData.annotations && Array.isArray(paramFormData.annotations)) {
					paramData.annotations = paramFormData.annotations;
				}
			}

			if (Object.keys(paramData).length > 0) {
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
			// Special handling for sequence step data to preserve responsiblePersons
			if (isSequenceStepData(merged[key], value)) {
				merged[key] = mergeSequenceStepData(merged[key] as Record<string, unknown>, value as Record<string, unknown>);
			} else {
				// Recursively merge nested objects
				merged[key] = mergeAggregatedData(merged[key] as Record<string, unknown>, value as Record<string, unknown>);
			}
		} else {
			// Overwrite or add new value
			merged[key] = value;
		}
	}

	return merged;
}

// Helper function to check if this is sequence step data
function isSequenceStepData(existing: unknown, newData: unknown): boolean {
	if (typeof existing !== 'object' || typeof newData !== 'object' || !existing || !newData) {
		return false;
	}

	const existingObj = existing as Record<string, unknown>;
	const newObj = newData as Record<string, unknown>;

	// Check if both objects have numeric keys (stepGroupIds) with nested objects that have numeric keys (stepIds)
	const existingKeys = Object.keys(existingObj);
	const newKeys = Object.keys(newObj);

	// If both have numeric keys and the nested objects also have numeric keys, this is likely sequence step data
	return (
		existingKeys.every(key => !isNaN(Number(key))) &&
		newKeys.every(key => !isNaN(Number(key))) &&
		existingKeys.length > 0 &&
		newKeys.length > 0
	);
}

// Helper function to merge sequence step data while preserving responsiblePersons
function mergeSequenceStepData(
	existing: Record<string, unknown>,
	newData: Record<string, unknown>
): Record<string, unknown> {
	const merged = { ...existing };

	for (const [stepGroupId, stepGroupData] of Object.entries(newData)) {
		if (merged[stepGroupId] && typeof merged[stepGroupId] === 'object' && typeof stepGroupData === 'object') {
			const existingGroup = merged[stepGroupId] as Record<string, unknown>;
			const newGroup = stepGroupData as Record<string, unknown>;

			// Merge step group data
			const mergedGroup = { ...existingGroup };

			for (const [stepId, stepData] of Object.entries(newGroup)) {
				if (mergedGroup[stepId] && typeof mergedGroup[stepId] === 'object' && typeof stepData === 'object') {
					const existingStep = mergedGroup[stepId] as Record<string, unknown>;
					const newStep = stepData as Record<string, unknown>;

					// Merge step data while preserving responsiblePersons
					mergedGroup[stepId] = {
						...existingStep,
						...newStep,
						// Preserve responsiblePersons from existing data if not in new data
						responsiblePersons: newStep.responsiblePersons || existingStep.responsiblePersons
					};
				} else {
					mergedGroup[stepId] = stepData;
				}
			}

			merged[stepGroupId] = mergedGroup;
		} else {
			merged[stepGroupId] = stepGroupData;
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

// New function to build approval action timing data
export function buildApprovalActionTimingData(
	step: TimelineStep,
	actionType: 'productionApproved' | 'ctqApproved' | 'stepCompleted',
	timestamp: string
): Record<string, unknown> {
	if (step.type === 'rawMaterials') {
		return {
			rawMaterials: {
				[actionType]: timestamp
			}
		};
	}

	if (step.type === 'bom') {
		return {
			bom: {
				[actionType]: timestamp
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
							[actionType]: timestamp
						}
					}
				}
			};
		} else if (step.stepGroup && step.prcTemplateStepId) {
			// Step group approval timing
			return {
				[step.prcTemplateStepId.toString()]: {
					[step.stepGroup.id.toString()]: {
						[actionType]: timestamp
					}
				}
			};
		}
	}

	if (step.type === 'inspection' && step.stepData) {
		// Build structure: { "82": { [actionType]: timestamp } }
		const prcTemplateStepId = step.stepData.prcTemplateStepId;

		return {
			[prcTemplateStepId.toString()]: {
				[actionType]: timestamp
			}
		};
	}

	return {};
}

// New function to build user approval data
export function buildUserApprovalData(
	step: TimelineStep,
	actionType: 'dataEnteredBy' | 'productionApprovedBy' | 'ctqApprovedBy' | 'stepCompletedBy',
	userId: number
): Record<string, unknown> {
	if (step.type === 'rawMaterials') {
		return {
			rawMaterials: {
				[actionType]: userId
			}
		};
	}

	if (step.type === 'bom') {
		return {
			bom: {
				[actionType]: userId
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
							[actionType]: userId
						}
					}
				}
			};
		} else if (step.stepGroup && step.prcTemplateStepId) {
			// Step group approval
			return {
				[step.prcTemplateStepId.toString()]: {
					[step.stepGroup.id.toString()]: {
						[actionType]: userId
					}
				}
			};
		}
	}

	if (step.type === 'inspection' && step.stepData) {
		// Build structure: { "82": { [actionType]: userId } }
		const prcTemplateStepId = step.stepData.prcTemplateStepId;

		return {
			[prcTemplateStepId.toString()]: {
				[actionType]: userId
			}
		};
	}

	return {};
}

// Function to merge user approval data
export function mergeUserApprovalData(
	existingData: Record<string, unknown> | undefined,
	newData: Record<string, unknown>
): Record<string, unknown> {
	// Same logic as mergeAggregatedData but for user approval data
	return mergeAggregatedData(existingData, newData);
}
