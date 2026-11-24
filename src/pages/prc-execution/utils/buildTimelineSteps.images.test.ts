import { describe, expect, it } from 'vitest';
import type { ExecutionData } from '../types/execution.types';
import { buildTimelineSteps } from './buildTimelineSteps';

const file = (name: string) => ({
	fileName: name,
	filePath: `files/part_drawings/${name}`,
	originalFileName: name
});

const tableConfig = {
	columns: [
		{ name: 'Characteristics', type: 'text' },
		{ name: 'Status', type: 'text' }
	],
	rows: [
		{ cells: { Characteristics: { value: 'Nut retainer', readOnly: true }, Status: { value: '', readOnly: false } } },
		{ cells: { Characteristics: { value: 'Holes', readOnly: true }, Status: { value: '', readOnly: false } } }
	]
};

// Parameters as the inspection master stores them: no images of their own (`files` is `{}`),
// so the part's inspection-image mapping supplies them.
const parameter = (id: number, type: string, order: number) => ({
	id,
	parameterName: `Parameter ${id}`,
	type,
	tableConfig: type === 'fixed-table' ? tableConfig : null,
	ctq: false,
	role: 'Q',
	columns: [],
	specification: '',
	order,
	files: {}
});

const executionWith = (diagramFiles: unknown[]) =>
	({
		id: 1,
		prcAggregatedSteps: { prcmetadata: { prcSetId: '1' } },
		inspectionDiagrams: { partId: 1, files: diagramFiles },
		prcCurrentTemplate: {
			prcTemplate: { id: 1, templateId: 'T-1', templateName: 'T', version: 1, status: 'ACTIVE' },
			prcTemplateSteps: [
				{
					id: 200,
					type: 'inspection',
					sequence: 1,
					data: {
						inspection: { inspectionName: 'Final' },
						inspectionParameters: [parameter(14692, 'fixed-table', 1), parameter(14693, 'ok/not ok', 2)]
					}
				}
			]
		}
	}) as unknown as ExecutionData;

const paramsOf = (execution: ExecutionData) =>
	buildTimelineSteps(execution, { omitStepTypes: ['bom', 'rawMaterials', 'sapConfirmations'] }).find(
		s => s.type === 'inspection'
	)!.inspectionParameters!;

describe('buildTimelineSteps inspection images', () => {
	// Part 29060050 on QA maps the same drawing to the parameter and to its first row. The execution
	// screen, the step preview and the printed report all showed it twice: in the row, and again
	// under the parameter.
	it('gives a fixed table with row images no parameter-level images', () => {
		const [fixedTable] = paramsOf(
			executionWith([
				{
					inspectionParameterId: 14692,
					fileName: [file('1.png')],
					rowMappings: [{ rowIndex: 0, fileName: [file('1.png')] }]
				}
			])
		);

		expect(fixedTable.files).toEqual([]);
		expect(fixedTable.rowMappings).toEqual([{ rowIndex: 0, fileName: [file('1.png')] }]);
	});

	it('keeps parameter-level images on a fixed table that has no row images', () => {
		const [fixedTable] = paramsOf(
			executionWith([
				{ inspectionParameterId: 14692, fileName: [file('1.png')], rowMappings: [{ rowIndex: 0, fileName: [] }] }
			])
		);

		expect(fixedTable.files).toEqual([file('1.png')]);
	});

	it('keeps parameter-level images on other parameter types', () => {
		const [, okNotOk] = paramsOf(executionWith([{ inspectionParameterId: 14693, fileName: [file('2.png')] }]));

		expect(okNotOk.files).toEqual([file('2.png')]);
	});
});
