import { describe, expect, it, vi } from 'vitest';
import { parseSapConfirmationLogsResponse, parseSapJobRunsResponse } from './sap-job-runs.validators';

describe('parseSapConfirmationLogsResponse', () => {
	it('keeps rows whose nullable columns came back null', () => {
		const logs = parseSapConfirmationLogsResponse({
			data: [
				{
					id: 1,
					prcExecutionId: 37247,
					operationId: null,
					operationText: null,
					requestUrl: null,
					requestBody: null,
					httpStatus: null,
					success: false,
					errorMessage: null,
					errorDescription: null,
					triggeredAt: '2026-09-24T05:00:00.000Z'
				}
			]
		});

		expect(logs).toHaveLength(1);
		expect(logs[0]).toMatchObject({
			id: 1,
			operationId: '',
			operationText: '',
			requestUrl: '',
			requestBody: null,
			httpStatus: null,
			success: false,
			errorMessage: null
		});
	});

	it('coerces stringified numbers, booleans and JSON payloads', () => {
		const [log] = parseSapConfirmationLogsResponse([
			{
				id: '4',
				prcExecutionId: '37247',
				operationId: 10,
				requestBody: '{"OrderID":"123"}',
				httpStatus: '201',
				success: 'true',
				errorMessage: { code: 'E1' },
				triggeredAt: '2026-09-24T05:00:00.000Z'
			}
		]);

		expect(log.id).toBe(4);
		expect(log.prcExecutionId).toBe(37247);
		expect(log.operationId).toBe('10');
		expect(log.requestBody).toEqual({ OrderID: '123' });
		expect(log.httpStatus).toBe(201);
		expect(log.success).toBe(true);
		expect(log.errorMessage).toBe('{"code":"E1"}');
	});

	it('preserves unknown extra fields and drops only non-object entries', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const logs = parseSapConfirmationLogsResponse({
			data: [{ id: 1, type: 'GR_POST', somethingNew: 'x' }, 'not-a-row', null]
		});

		expect(logs).toHaveLength(1);
		expect(logs[0].type).toBe('GR_POST');
		expect(logs[0].somethingNew).toBe('x');
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it('returns an empty list instead of throwing on an unrecognised envelope', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(parseSapConfirmationLogsResponse({ message: 'no logs' })).toEqual([]);
		expect(parseSapConfirmationLogsResponse(null)).toEqual([]);
		warn.mockRestore();
	});
});

describe('parseSapJobRunsResponse', () => {
	it('tolerates missing optional columns', () => {
		const [run] = parseSapJobRunsResponse({ data: [{ id: 2, jobKey: 'SYNC_ORDERS' }] });

		expect(run).toMatchObject({
			id: 2,
			jobKey: 'SYNC_ORDERS',
			runEnd: null,
			status: '',
			recordsProcessed: 0,
			endpointUrl: null,
			errorMessage: null
		});
	});
});
