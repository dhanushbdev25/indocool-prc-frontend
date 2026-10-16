import { describe, expect, it } from 'vitest';
import type { ExecutionData } from '../types/execution.types';
import { buildTimelineSteps } from './buildTimelineSteps';

// Lists keep their config in the existing tableConfig column, so a template snapshot carries it there.
const storedList = {
	items: [{ id: 'op', label: 'Operator', type: 'text', required: true, readOnly: false, defaultValue: '' }]
};

const execution = {
	id: 1,
	prcAggregatedSteps: { prcmetadata: { prcSetId: '1' } },
	prcCurrentTemplate: {
		prcTemplate: { id: 1, templateId: 'T-1', templateName: 'T', version: 1, status: 'ACTIVE' },
		prcTemplateSteps: [
			{
				id: 100,
				type: 'sequence',
				sequence: 1,
				data: {
					stepGroups: [
						{
							id: 900,
							sequence: 1,
							processName: '60.1',
							processDescription: 'Gel coat',
							sequenceTiming: 60,
							steps: [
								{
									id: 9001,
									ctq: false,
									targetValueType: 'list',
									tableConfig: storedList,
									uom: '',
									multipleMeasurements: false,
									notes: '',
									parameterDescription: 'Details',
									evaluationMethod: 'Visual',
									allowAttachments: false
								},
								{
									id: 9002,
									ctq: false,
									targetValueType: 'range',
									uom: '',
									multipleMeasurements: false,
									notes: '',
									parameterDescription: 'Thickness',
									evaluationMethod: 'Measure',
									allowAttachments: false
								}
							]
						}
					]
				}
			},
			{
				id: 200,
				type: 'inspection',
				sequence: 2,
				data: {
					inspection: { inspectionName: 'Final' },
					inspectionParameters: [
						{
							id: 7,
							parameterName: 'Readings',
							type: 'list',
							tableConfig: storedList,
							ctq: false,
							role: 'Q',
							columns: [],
							specification: '',
							order: 1
						},
						{
							id: 8,
							parameterName: 'Notes',
							type: 'text',
							ctq: false,
							role: 'Q',
							columns: [],
							specification: '',
							order: 2
						}
					]
				}
			}
		]
	}
} as unknown as ExecutionData;

describe('buildTimelineSteps list config', () => {
	const steps = buildTimelineSteps(execution, { omitStepTypes: ['bom', 'rawMaterials', 'sapConfirmations'] });

	it('reads a sequence list step config out of tableConfig', () => {
		const sequence = steps.find(s => s.type === 'sequence');
		const [listStep, rangeStep] = sequence!.stepGroup!.steps;
		expect(listStep.listConfig?.items.map(i => i.label)).toEqual(['Operator']);
		expect(rangeStep.listConfig).toBeNull();
	});

	it('reads an inspection list parameter config out of tableConfig', () => {
		const inspection = steps.find(s => s.type === 'inspection');
		const [listParam, textParam] = inspection!.inspectionParameters!;
		expect(listParam.listConfig?.items.map(i => i.label)).toEqual(['Operator']);
		expect(textParam.listConfig).toBeNull();
	});
});
