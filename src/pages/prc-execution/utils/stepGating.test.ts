import { describe, expect, it } from 'vitest';
import type { ExecutionData, TimelineStep } from '../types/execution.types';
import { buildTimelineSteps } from './buildTimelineSteps';
import {
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
