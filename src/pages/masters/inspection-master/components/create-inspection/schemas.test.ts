import { describe, expect, it } from 'vitest';
import { columnSchema, defaultInspectionParameter, inspectionParameterSchema } from './schemas';

describe('inspection columnSchema', () => {
	it('accepts date column type', async () => {
		await expect(columnSchema.validate({ name: 'Manufactured', type: 'date' })).resolves.toBeDefined();
	});

	it('rejects unknown column type', async () => {
		await expect(columnSchema.validate({ name: 'X', type: 'timestamp' })).rejects.toThrow(/Invalid column type/);
	});
});

describe('inspection fixed-table tableConfig', () => {
	it('accepts date column type in tableConfig', async () => {
		await expect(
			inspectionParameterSchema.validate({
				...defaultInspectionParameter,
				parameterName: 'Fixed dates',
				type: 'fixed-table',
				tableConfig: {
					columns: [{ name: 'Mfg Date', type: 'date' }],
					rows: [{ cells: { 'Mfg Date': { value: '', readOnly: false } } }]
				}
			})
		).resolves.toBeDefined();
	});
});

describe('inspection fixed-table per-cell data types', () => {
	const withCells = (cell: Record<string, unknown>) =>
		inspectionParameterSchema.validate({
			...defaultInspectionParameter,
			parameterName: 'Per-cell types',
			type: 'fixed-table',
			tableConfig: {
				cellTypes: true,
				columns: [{ name: 'Reading', type: 'text' }],
				rows: [{ cells: { Reading: { value: '', readOnly: false, ...cell } } }]
			}
		});

	it('accepts every data type the portal offers', async () => {
		for (const type of ['integer', 'boolean', 'workstation', 'date', 'shift', 'ok/not ok']) {
			await expect(withCells({ type })).resolves.toBeDefined();
		}
		await expect(
			withCells({ type: 'range', minimumAcceptanceValue: '1', maximumAcceptanceValue: '4' })
		).resolves.toBeDefined();
	});

	it('rejects an unknown cell type', async () => {
		await expect(withCells({ type: 'timestamp' })).rejects.toThrow(/invalid data type/);
	});

	it('rejects a cell range whose minimum is above its maximum', async () => {
		await expect(
			withCells({ type: 'number', minimumAcceptanceValue: '9', maximumAcceptanceValue: '2' })
		).rejects.toThrow(/Row 1, Reading: Minimum value cannot be greater/);
	});

	it('needs the target of an exact value cell', async () => {
		await expect(withCells({ type: 'exact value' })).rejects.toThrow(/target value/);
	});

	it('accepts the new types on a column too', async () => {
		await expect(
			inspectionParameterSchema.validate({
				...defaultInspectionParameter,
				parameterName: 'Integer column',
				type: 'fixed-table',
				tableConfig: {
					columns: [{ name: 'Count', type: 'integer', minimumAcceptanceValue: '1', maximumAcceptanceValue: '9' }],
					rows: [{ cells: { Count: { value: '', readOnly: false } } }]
				}
			})
		).resolves.toBeDefined();
	});
});

describe('inspection parameter ordering', () => {
	it('requires order to be a positive integer', async () => {
		await expect(
			inspectionParameterSchema.validate({
				...defaultInspectionParameter,
				parameterName: 'Surface finish',
				order: 2
			})
		).resolves.toMatchObject({ order: 2 });

		await expect(
			inspectionParameterSchema.validate({
				...defaultInspectionParameter,
				parameterName: 'Surface finish',
				order: 0
			})
		).rejects.toThrow(/Order must be at least 1/);
	});
});

describe('inspection list parameter', () => {
	it('accepts a list with items and rejects an empty one', async () => {
		const base = { ...defaultInspectionParameter, parameterName: 'Readings', type: 'list' };
		await expect(
			inspectionParameterSchema.validate({
				...base,
				listConfig: {
					items: [{ id: 'li_1', label: 'Shift', type: 'shift', required: true, readOnly: false, defaultValue: '' }]
				}
			})
		).resolves.toBeDefined();
		await expect(inspectionParameterSchema.validate({ ...base, listConfig: { items: [] } })).rejects.toThrow(
			/At least one list item is required/
		);
	});
});
