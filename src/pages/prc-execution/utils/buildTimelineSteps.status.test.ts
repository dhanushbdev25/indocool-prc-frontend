import { describe, expect, it } from 'vitest';
import type { ExecutionData, TimelineStep } from '../types/execution.types';
import { buildTimelineSteps } from './buildTimelineSteps';

/**
 * The execution page hides Bill of Material Validation and Catalyst Mixing (they open as dialogs),
 * the report page hides SAP confirmations. Both then read the same statuses off the same execution,
 * so a step's chip must not depend on which types the caller asked to omit.
 */
function executionWithUnfinishedMaterials(): ExecutionData {
	return {
		id: 1,
		rawMaterials: [
			{
				id: 1,
				materialCode: 'RM-1',
				materialName: 'Resin',
				quantity: '10',
				uom: 'kg',
				batching: false
				// no actualQuantity -> Bill of Material Validation is not complete
			}
		],
		bom: [
			{
				id: 2,
				uom: 'kg',
				order: 1,
				partId: 1,
				version: 1,
				batching: false,
				isLatest: true,
				quantity: '5',
				createdAt: '',
				splitting: false,
				updatedAt: '',
				materialCode: 'BOM-1',
				materialName: 'Catalyst',
				splitQuantity: '0',
				splittingConfiguration: null
			}
		],
		prcAggregatedSteps: {
			prcmetadata: { prcSetId: '165' },
			// group 900 is filled and fully approved; group 901 has nothing yet
			'100': {
				'900': {
					'9001': { data: '430', stepId: 9001, stepGroupId: 900, prcTemplateStepId: 100 },
					stepCompleted: true,
					productionApproved: true
				}
			}
		},
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
								processDescription: 'Gel coat application',
								sequenceTiming: 120,
								steps: [
									{
										id: 9001,
										ctq: false,
										targetValueType: 'range',
										uom: 'micron',
										multipleMeasurements: false,
										notes: '',
										parameterDescription: 'Coat thickness',
										evaluationMethod: 'Measure',
										allowAttachments: false
									}
								]
							},
							{
								id: 901,
								sequence: 2,
								processName: '60.3',
								processDescription: 'Mat placement',
								sequenceTiming: 120,
								steps: [
									{
										id: 9002,
										ctq: false,
										targetValueType: 'range',
										uom: '%',
										multipleMeasurements: false,
										notes: '',
										parameterDescription: 'Coverage',
										evaluationMethod: 'Measure',
										allowAttachments: false
									}
								]
							}
						]
					}
				}
			]
		}
	} as unknown as ExecutionData;
}

const statusOf = (steps: TimelineStep[], title: string) => steps.find(s => s.title.startsWith(title))?.status;

describe('buildTimelineSteps status derivation', () => {
	it('gives the execution and report pages the same status for every shared step', () => {
		const execution = executionWithUnfinishedMaterials();

		const executeSteps = buildTimelineSteps(execution, { omitStepTypes: ['bom', 'rawMaterials'] });
		const reportSteps = buildTimelineSteps(execution, { omitStepTypes: ['sapConfirmations'] });

		const sharedTypes: TimelineStep['type'][] = ['setup', 'sequence'];
		const pick = (steps: TimelineStep[]) =>
			steps.filter(s => sharedTypes.includes(s.type)).map(s => `${s.reportStepIndex}:${s.status}`);

		expect(pick(reportSteps)).toEqual(pick(executeSteps));
	});

	it('keeps an approved step completed when only the out-of-band material steps are unfinished', () => {
		const reportSteps = buildTimelineSteps(executionWithUnfinishedMaterials(), {
			omitStepTypes: ['sapConfirmations']
		});

		expect(statusOf(reportSteps, '60.1')).toBe('completed');
	});

	it('marks the first unfinished flow step in progress, not the out-of-band material steps', () => {
		const reportSteps = buildTimelineSteps(executionWithUnfinishedMaterials(), {
			omitStepTypes: ['sapConfirmations']
		});

		expect(statusOf(reportSteps, '60.3')).toBe('in-progress');
		expect(statusOf(reportSteps, 'Bill of Material Validation')).toBe('pending');
		expect(statusOf(reportSteps, 'Catalyst Mixing')).toBe('pending');
	});

	it('leaves the execution page timeline unchanged', () => {
		const executeSteps = buildTimelineSteps(executionWithUnfinishedMaterials(), {
			omitStepTypes: ['bom', 'rawMaterials']
		});

		expect(executeSteps.map(s => `${s.type}:${s.status}`)).toEqual([
			'setup:completed',
			'sequence:completed',
			'sequence:in-progress',
			'sapConfirmations:pending'
		]);
	});
});
