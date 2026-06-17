import { describe, expect, it } from 'vitest';
import { defaultProcessStep, processStepSchema } from './schemas';

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
