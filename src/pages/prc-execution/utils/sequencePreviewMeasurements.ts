import type { StepGroup } from '../types/execution.types';

/** Strip approval/timing metadata keys from a sequence step-group aggregate bucket */
export function filterMeasurementSteps(groupData: Record<string, unknown>): Array<[string, unknown]> {
	const metadataFields = [
		'stepCompleted',
		'productionApproved',
		'ctqApproved',
		'partialCtqApprove',
		'timingExceeded',
		'timingExceededRemarks',
		'timingExceededReasonCode',
		'timingExceededReasonLabel'
	];
	return Object.entries(groupData).filter(([stepId]) => !metadataFields.includes(stepId));
}

export type SequenceStepDefinition = StepGroup['steps'][number];

/** Build the same `detailedMeasurements` array used by StepPreview for sequence groups */
export function buildSequenceDetailedMeasurements(
	groupData: Record<string, unknown>,
	stepDefinitions: SequenceStepDefinition[]
): Record<string, unknown>[] {
	const detailedMeasurements: Record<string, unknown>[] = [];
	const filteredSteps = filterMeasurementSteps(groupData);

	for (const [stepId, rawStepData] of filteredSteps) {
		const stepData = rawStepData as Record<string, unknown>;
		const stepDefinition = stepDefinitions.find(s => s.id.toString() === stepId);

		if (stepDefinition?.targetValueType === 'table') {
			const tableValue = stepData.data ?? stepData.value;
			const measurementData: Record<string, unknown> = {
				stepId,
				value: tableValue,
				parameterDescription: stepDefinition.parameterDescription || `Step ${stepId}`,
				targetValueType: 'table',
				tableConfig: stepDefinition.tableConfig,
				evaluationMethod: stepDefinition.evaluationMethod || 'Unknown',
				uom: stepDefinition.uom || '',
				notes: stepDefinition.notes || '',
				ctq: stepDefinition.ctq || false,
				criticalityTag: stepDefinition.criticalityTag ?? null,
				stepNumber: stepDefinition.stepNumber || 0,
				instrumentId: (stepData.instrumentId || (stepData.data as Record<string, unknown>)?.instrumentId || '') as string,
				responsiblePersons: [] as Array<{ role: string; employeeName: string; employeeCode: string }>
			};
			const rp = stepData.responsiblePersons || (stepData.data as Record<string, unknown>)?.responsiblePersons;
			if (Array.isArray(rp)) measurementData.responsiblePersons = rp;
			detailedMeasurements.push(measurementData);
			continue;
		}

		if (stepDefinition?.targetValueType === 'ok/not ok') {
			const okNotOkValue = stepData.value ?? stepData.data;
			const measurementData: Record<string, unknown> = {
				stepId,
				value: okNotOkValue,
				parameterDescription: stepDefinition.parameterDescription || `Step ${stepId}`,
				targetValueType: 'ok/not ok',
				evaluationMethod: stepDefinition.evaluationMethod || 'Unknown',
				uom: stepDefinition.uom || '',
				notes: stepDefinition.notes || '',
				ctq: stepDefinition.ctq || false,
				criticalityTag: stepDefinition.criticalityTag ?? null,
				stepNumber: stepDefinition.stepNumber || 0,
				instrumentId: (stepData.instrumentId || (stepData.data as Record<string, unknown>)?.instrumentId || '') as string,
				responsiblePersons: [] as Array<{ role: string; employeeName: string; employeeCode: string }>
			};
			let responsiblePersons: unknown = null;
			if (Array.isArray(stepData.responsiblePersons)) {
				responsiblePersons = stepData.responsiblePersons;
			} else if (
				stepData.data &&
				typeof stepData.data === 'object' &&
				'responsiblePersons' in stepData.data &&
				Array.isArray((stepData.data as Record<string, unknown>).responsiblePersons)
			) {
				responsiblePersons = (stepData.data as Record<string, unknown>).responsiblePersons;
			}
			if (Array.isArray(responsiblePersons)) measurementData.responsiblePersons = responsiblePersons;
			detailedMeasurements.push(measurementData);
			continue;
		}

		let value: unknown = stepData.value ?? stepData.data;
		let extractedMinimumAcceptanceValue = stepData.minimumAcceptanceValue;
		let extractedMaximumAcceptanceValue = stepData.maximumAcceptanceValue;
		let extractedValidationStatus = stepData.validationStatus;

		if (
			Array.isArray(value) &&
			value.length > 0 &&
			typeof value[0] === 'object' &&
			value[0] !== null &&
			'value' in (value[0] as object)
		) {
			const firstItem = value[0] as Record<string, unknown>;
			value = (value as Array<Record<string, unknown>>).map(item => item.value);
			if (firstItem.validationStatus) {
				extractedValidationStatus = firstItem.validationStatus;
				extractedMinimumAcceptanceValue = firstItem.minimumAcceptanceValue as string | undefined;
				extractedMaximumAcceptanceValue = firstItem.maximumAcceptanceValue as string | undefined;
			}
		} else if (typeof value === 'object' && value !== null && 'value' in value) {
			const valueObj = value as Record<string, unknown>;
			value = valueObj.value;
			extractedMinimumAcceptanceValue = (valueObj.minimumAcceptanceValue as string) || extractedMinimumAcceptanceValue;
			extractedMaximumAcceptanceValue = (valueObj.maximumAcceptanceValue as string) || extractedMaximumAcceptanceValue;
			extractedValidationStatus = (valueObj.validationStatus as string) || extractedValidationStatus;
		}

		const measurementData: Record<string, unknown> = {
			stepId,
			value,
			parameterDescription: stepDefinition?.parameterDescription || `Step ${stepId}`,
			targetValueType: stepDefinition?.targetValueType || 'range',
			evaluationMethod: stepDefinition?.evaluationMethod || 'Unknown',
			uom: stepDefinition?.uom || '',
			notes: stepDefinition?.notes || '',
			ctq: stepDefinition?.ctq || false,
			criticalityTag: stepDefinition?.criticalityTag ?? null,
			stepNumber: stepDefinition?.stepNumber || 0,
			instrumentId: (stepData.instrumentId || (stepData.data as Record<string, unknown>)?.instrumentId || '') as string,
			minimumAcceptanceValue: extractedMinimumAcceptanceValue ?? stepDefinition?.minimumAcceptanceValue,
			maximumAcceptanceValue: extractedMaximumAcceptanceValue ?? stepDefinition?.maximumAcceptanceValue,
			validationStatus: extractedValidationStatus,
			responsiblePersons: [] as Array<{ role: string; employeeName: string; employeeCode: string }>
		};

		let responsiblePersons: unknown = null;
		if (Array.isArray(stepData.responsiblePersons)) {
			responsiblePersons = stepData.responsiblePersons;
		} else if (
			stepData.data &&
			typeof stepData.data === 'object' &&
			'responsiblePersons' in stepData.data &&
			Array.isArray((stepData.data as Record<string, unknown>).responsiblePersons)
		) {
			responsiblePersons = (stepData.data as Record<string, unknown>).responsiblePersons;
		}
		if (Array.isArray(responsiblePersons)) {
			measurementData.responsiblePersons = responsiblePersons;
		}

		detailedMeasurements.push(measurementData);
	}

	return detailedMeasurements;
}
