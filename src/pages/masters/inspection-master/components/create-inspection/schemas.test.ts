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
