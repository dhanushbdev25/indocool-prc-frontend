import { describe, expect, it } from 'vitest';
import { defaultProcessStep, defaultProcessStepGroup, processStepGroupSchema, processStepSchema } from './schemas';

describe('sequence processStepSchema table columns', () => {
	it('accepts date column type in tableConfig', async () => {
		await expect(
			processStepSchema.validate({
				...defaultProcessStep,
				parameterDescription: 'Manufacturing log',
				evaluationMethod: 'Visual',
				targetValueType: 'table',
				tableConfig: {
					columns: [{ name: 'Manufactured', type: 'date' }],
					rows: [{ cells: { Manufactured: { value: '', readOnly: false } } }]
				}
			})
		).resolves.toBeDefined();
	});

	it('rejects unknown column type in tableConfig', async () => {
		await expect(
			processStepSchema.validate({
				...defaultProcessStep,
				parameterDescription: 'Test',
				evaluationMethod: 'Visual',
				targetValueType: 'table',
				tableConfig: {
					columns: [{ name: 'X', type: 'timestamp' }],
					rows: [{ cells: { X: { value: '', readOnly: false } } }]
				}
			})
		).rejects.toThrow(/Invalid column type/);
	});
});

const tableStep = (tableConfig: unknown) => ({
	...defaultProcessStep,
	parameterDescription: 'Readings',
	evaluationMethod: 'Visual',
	targetValueType: 'table',
	tableConfig
});

describe('sequence processStepSchema table data types', () => {
	it('accepts a range column with its min and max', async () => {
		await expect(
			processStepSchema.validate(
				tableStep({
					columns: [{ name: 'Temp', type: 'range', minimumAcceptanceValue: 20, maximumAcceptanceValue: 30 }],
					rows: [{ cells: { Temp: { value: '', readOnly: false } } }]
				})
			)
		).resolves.toBeDefined();
	});

	it('still accepts a saved number column', async () => {
		await expect(
			processStepSchema.validate(
				tableStep({
					columns: [{ name: 'Qty', type: 'number' }],
					rows: [{ cells: { Qty: { value: '', readOnly: false } } }]
				})
			)
		).resolves.toBeDefined();
	});

	it('rejects a range column without a maximum', async () => {
		await expect(
			processStepSchema.validate(
				tableStep({
					columns: [{ name: 'Temp', type: 'range', minimumAcceptanceValue: 20 }],
					rows: [{ cells: { Temp: { value: '', readOnly: false } } }]
				})
			)
		).rejects.toThrow(/Temp: Range needs a minimum and maximum/);
	});

	it('checks each cell when per-cell types are on', async () => {
		const config = {
			cellTypes: true,
			columns: [{ name: 'Reading', type: 'text' }],
			rows: [
				{ cells: { Reading: { value: '', readOnly: false, type: 'boolean' } } },
				{
					cells: {
						Reading: { value: '', readOnly: false, type: 'range', minimumAcceptanceValue: 9, maximumAcceptanceValue: 1 }
					}
				}
			]
		};
		await expect(processStepSchema.validate(tableStep(config))).rejects.toThrow(
			/Row 2, Reading: Minimum value cannot be greater than maximum value/
		);
		config.rows[1].cells.Reading.maximumAcceptanceValue = 12;
		const result = await processStepSchema.validate(tableStep(config));
		expect(result.tableConfig?.cellTypes).toBe(true);
	});
});

describe('sequence processStepGroupSchema ordering', () => {
	it('requires a positive integer sequence', async () => {
		await expect(
			processStepGroupSchema.validate({
				...defaultProcessStepGroup,
				processName: '30',
				processDescription: 'Gel coat application',
				sequence: 2
			})
		).resolves.toMatchObject({ sequence: 2 });

		await expect(
			processStepGroupSchema.validate({
				...defaultProcessStepGroup,
				processName: '30',
				processDescription: 'Gel coat application',
				sequence: 0
			})
		).rejects.toThrow();
	});
});

describe('sequence processStepSchema list config', () => {
	const listStep = (items: unknown[]) => ({
		...defaultProcessStep,
		parameterDescription: 'Mould readings',
		evaluationMethod: 'Visual',
		targetValueType: 'list',
		listConfig: { items }
	});
	const listItem = (overrides: Record<string, unknown> = {}) => ({
		id: 'li_1',
		label: 'Mould temperature',
		type: 'number',
		required: true,
		readOnly: false,
		defaultValue: '',
		minimumAcceptanceValue: '20',
		maximumAcceptanceValue: '30',
		...overrides
	});

	it('accepts a list with valid items', async () => {
		await expect(processStepSchema.validate(listStep([listItem()]))).resolves.toBeDefined();
	});

	it('requires at least one item', async () => {
		await expect(processStepSchema.validate(listStep([]))).rejects.toThrow(/At least one list item is required/);
	});

	it('names the first invalid item', async () => {
		await expect(
			processStepSchema.validate(listStep([listItem(), listItem({ id: 'li_2', label: '' })]))
		).rejects.toThrow(/Item 2: Label is required/);
	});

	it('ignores list config on other types', async () => {
		await expect(
			processStepSchema.validate({
				...listStep([]),
				targetValueType: 'ok/not ok'
			})
		).resolves.toBeDefined();
	});
});
