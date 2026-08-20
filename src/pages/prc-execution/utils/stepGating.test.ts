import { describe, expect, it } from 'vitest';
import type { ExecutionData, TimelineStep } from '../types/execution.types';
import { buildTimelineSteps } from './buildTimelineSteps';
import { extractSequenceStepGroupsFromExecution } from './operationWiseMerge';
import {
	areNonSapStepsComplete,
	canAccessStepIndex,
	getExecutionFrontierIndex,
	hasInspectionParameterData,
	isTimelineStepComplete
} from './stepGating';

const inspectionStep = (overrides: Partial<TimelineStep> = {}): TimelineStep => ({
	stepNumber: 2,
	type: 'inspection',
	title: 'Demoulding inspection',
	description: 'Demoulding inspection',
	status: 'pending',
	ctq: false,
	stepData: { prcTemplateStepId: 20 },
	inspectionParameters: [
		{
			id: 201,
			parameterName: 'Surface',
			type: 'text',
			ctq: false,
			role: 'Production',
			columns: [],
			specification: 'No damage',
			order: 1,
			version: 1,
			isLatest: true,
			createdAt: '',
			updatedAt: '',
			inspectionId: 20
		}
	],
	...overrides
});

describe('PRC execution step gating', () => {
	it('does not treat approval metadata as inspection parameter data', () => {
		const step = inspectionStep();
		const aggregated = {
			20: {
				productionApproved: true,
				stepCompleted: true
			}
		};

		expect(hasInspectionParameterData(step, aggregated)).toBe(false);
		expect(isTimelineStepComplete(step, aggregated)).toBe(false);
	});

	it('does not complete Demoulding after data entry until stepCompleted is true', () => {
		const step = inspectionStep();
		const aggregated = {
			20: {
				201: { value: 'OK' },
				productionApproved: true
			}
		};

		expect(hasInspectionParameterData(step, aggregated)).toBe(true);
		expect(isTimelineStepComplete(step, aggregated)).toBe(false);
	});

	it('requires CTQ approval but accepts partial CTQ approval', () => {
		const step = inspectionStep({
			ctq: true,
			inspectionParameters: inspectionStep().inspectionParameters?.map(parameter => ({ ...parameter, ctq: true }))
		});
		const baseBucket = {
			201: { value: 'OK' },
			productionApproved: true,
			stepCompleted: true
		};

		expect(isTimelineStepComplete(step, { 20: baseBucket })).toBe(false);
		expect(isTimelineStepComplete(step, { 20: { ...baseBucket, partialCtqApprove: true } })).toBe(true);
	});

	it('locks stale later-step data behind the first incomplete step', () => {
		const setup: TimelineStep = {
			stepNumber: 1,
			type: 'setup',
			title: 'Setup',
			description: 'Setup',
			status: 'completed',
			ctq: false
		};
		const demoulding = inspectionStep();
		const laterInspection = inspectionStep({
			stepNumber: 3,
			title: 'Final inspection',
			stepData: { prcTemplateStepId: 30 },
			inspectionParameters: inspectionStep().inspectionParameters?.map(parameter => ({ ...parameter, id: 301 }))
		});
		const aggregated = {
			prcmetadata: { shift: 'A' },
			20: { 201: { value: 'OK' }, productionApproved: true },
			30: {
				301: { value: 'OK' },
				productionApproved: true,
				stepCompleted: true
			}
		};
		const steps = [setup, demoulding, laterInspection];

		const frontier = getExecutionFrontierIndex(steps, aggregated);
		expect(frontier).toBe(1);
		expect(canAccessStepIndex(1, frontier)).toBe(true);
		expect(canAccessStepIndex(2, frontier)).toBe(false);
	});
});

describe('SAP confirmations step gating', () => {
	const sapStep: TimelineStep = {
		stepNumber: 3,
		type: 'sapConfirmations',
		title: 'SAP confirmations',
		description: 'Review SAP API confirmation calls and retry failures',
		status: 'pending',
		ctq: false
	};
	const setupStep: TimelineStep = {
		stepNumber: 1,
		type: 'setup',
		title: 'Setup',
		description: 'Setup',
		status: 'completed',
		ctq: false
	};

	it('keeps the SAP step reachable past the frontier while an earlier step is open', () => {
		const steps = [setupStep, inspectionStep(), sapStep];
		const aggregated = {
			prcmetadata: { shift: 'A' },
			20: { 201: { value: 'OK' }, productionApproved: true }
		};

		const frontier = getExecutionFrontierIndex(steps, aggregated);
		expect(frontier).toBe(1);
		// Other steps stay locked behind the frontier...
		expect(canAccessStepIndex(2, frontier, inspectionStep())).toBe(false);
		// ...but SAP confirmations is always reachable.
		expect(canAccessStepIndex(2, frontier, sapStep)).toBe(true);
	});

	it('reports other steps incomplete while an earlier step is open', () => {
		const steps = [setupStep, inspectionStep(), sapStep];
		const aggregated = {
			prcmetadata: { shift: 'A' },
			20: { 201: { value: 'OK' }, productionApproved: true }
		};

		expect(areNonSapStepsComplete(steps, aggregated)).toBe(false);
	});

	it('reports other steps complete once every non-SAP step is done', () => {
		const steps = [setupStep, inspectionStep(), sapStep];
		const aggregated = {
			prcmetadata: { shift: 'A' },
			20: { 201: { value: 'OK' }, productionApproved: true, stepCompleted: true }
		};

		expect(areNonSapStepsComplete(steps, aggregated)).toBe(true);
	});

	it('ignores the SAP step’s own completion when judging the other steps', () => {
		const steps = [setupStep, sapStep];
		const aggregated = {
			prcmetadata: { shift: 'A' }
		};

		// SAP itself is not complete, but that must not block its own Complete PRC gate.
		expect(isTimelineStepComplete(sapStep, aggregated)).toBe(false);
		expect(areNonSapStepsComplete(steps, aggregated)).toBe(true);
	});
});

describe('buildTimelineSteps sequential status', () => {
	it('keeps a later completed inspection pending while Demoulding is incomplete', () => {
		const executionData = {
			prcAggregatedSteps: {
				prcmetadata: { shift: 'A' },
				20: { 201: { value: 'OK' }, productionApproved: true },
				30: {
					301: { value: 'OK' },
					productionApproved: true,
					stepCompleted: true
				}
			},
			prcCurrentTemplate: {
				prcTemplateSteps: [
					{
						id: 20,
						sequence: 1,
						type: 'inspection',
						data: {
							inspection: { inspectionName: 'Demoulding inspection' },
							inspectionParameters: [
								{
									id: 201,
									parameterName: 'Surface',
									type: 'text',
									ctq: false,
									role: 'Production',
									columns: [],
									specification: '',
									order: 1
								}
							]
						}
					},
					{
						id: 30,
						sequence: 2,
						type: 'inspection',
						data: {
							inspection: { inspectionName: 'Final inspection' },
							inspectionParameters: [
								{
									id: 301,
									parameterName: 'Final result',
									type: 'text',
									ctq: false,
									role: 'Production',
									columns: [],
									specification: '',
									order: 1
								}
							]
						}
					}
				]
			}
		} as unknown as ExecutionData;

		const steps = buildTimelineSteps(executionData);

		expect(steps.map(step => [step.title, step.status])).toEqual([
			['Execution setup', 'completed'],
			['Demoulding inspection', 'in-progress'],
			['Final inspection', 'pending'],
			['SAP confirmations', 'pending']
		]);
	});
});

describe('process step group ordering', () => {
	const sequenceGroup = (id: number, processName: string, sequence?: number) => ({
		id,
		sequence,
		processName,
		processDescription: `${processName} description`,
		sequenceTiming: 60,
		steps: []
	});

	it('renders timeline and setup rows by group sequence', () => {
		const executionData = {
			prcCurrentTemplate: {
				prcTemplateSteps: [
					{
						id: 10,
						sequence: 1,
						type: 'sequence',
						data: {
							stepGroups: [sequenceGroup(102, 'Second', 2), sequenceGroup(101, 'First', 1)]
						}
					}
				]
			}
		} as unknown as ExecutionData;

		const timelineGroups = buildTimelineSteps(executionData).filter(step => step.type === 'sequence');
		const setupGroups = extractSequenceStepGroupsFromExecution(executionData);

		expect(timelineGroups.map(step => step.stepGroup?.id)).toEqual([101, 102]);
		expect(setupGroups.map(group => group.id)).toEqual(['101', '102']);
	});

	it('preserves API array order when a group sequence is missing', () => {
		const executionData = {
			prcCurrentTemplate: {
				prcTemplateSteps: [
					{
						id: 10,
						sequence: 1,
						type: 'sequence',
						data: {
							stepGroups: [sequenceGroup(102, 'Second'), sequenceGroup(101, 'First', 1)]
						}
					}
				]
			}
		} as unknown as ExecutionData;

		const timelineGroups = buildTimelineSteps(executionData).filter(step => step.type === 'sequence');

		expect(timelineGroups.map(step => step.stepGroup?.id)).toEqual([102, 101]);
	});
});

describe('inspection parameter ordering', () => {
	const inspectionParameter = (id: number, parameterName: string, order: number) => ({
		id,
		parameterName,
		order,
		type: 'text',
		ctq: false,
		role: 'Production',
		columns: [],
		specification: ''
	});

	it('orders timeline metadata while keeping completion data keyed by parameter id', () => {
		const executionData = {
			prcCurrentTemplate: {
				prcTemplateSteps: [
					{
						id: 20,
						sequence: 1,
						type: 'inspection',
						data: {
							inspection: { inspectionName: 'Final inspection' },
							inspectionParameters: [
								inspectionParameter(202, 'Second', 2),
								inspectionParameter(201, 'First', 1)
							]
						}
					}
				]
			}
		} as unknown as ExecutionData;

		const inspection = buildTimelineSteps(executionData).find(step => step.type === 'inspection');

		expect(inspection?.inspectionParameters?.map(parameter => parameter.id)).toEqual([201, 202]);
		expect(
			inspection &&
				hasInspectionParameterData(inspection, {
					20: {
						202: { value: 'second' },
						201: { value: 'first' }
					}
				})
		).toBe(true);
	});
});
