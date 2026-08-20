import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExecutionData } from '../../../../types/execution.types';
import SapConfirmationStep from './SapConfirmationStep';

const grSuccessLog = {
	id: 1,
	operationId: 'GR',
	operationText: 'Goods Receipt',
	requestUrl: 'https://sap.example/confirm',
	requestBody: {},
	httpStatus: 200,
	success: true,
	errorMessage: null,
	triggeredAt: '2026-08-20T10:00:00.000Z'
};

vi.mock('@mui/icons-material', () => ({
	KeyboardArrowDown: () => <span>down</span>,
	KeyboardArrowUp: () => <span>up</span>,
	Refresh: () => <span>refresh</span>
}));
vi.mock('../../../../../../components/common/FullScreenFormSavingOverlay', () => ({
	FullScreenFormSavingOverlay: () => null
}));
vi.mock('../../../../../../hooks/useCurrentRole', () => ({
	useCurrentRole: () => ({ hasPermission: () => true })
}));
vi.mock('../../../../../../store/api/business/sap-job-runs/sap-job-runs.api', () => ({
	useFetchSapConfirmationLogsQuery: () => ({
		data: [grSuccessLog],
		isLoading: false,
		isError: false,
		error: undefined,
		refetch: vi.fn()
	}),
	useRetriggerSapConfirmationsMutation: () => [vi.fn(), { isLoading: false }]
}));

const executionData = { id: 7, prcAggregatedSteps: {} } as unknown as ExecutionData;

const renderStep = (allOtherStepsComplete: boolean) =>
	render(
		<SapConfirmationStep
			executionData={executionData}
			onStepComplete={vi.fn()}
			allOtherStepsComplete={allOtherStepsComplete}
		/>
	);

describe('SAP confirmations Complete PRC gate', () => {
	it('disables Complete PRC while other steps are open, even after GR succeeds', () => {
		renderStep(false);

		expect(screen.getByRole('button', { name: /complete prc/i })).toBeDisabled();
		expect(screen.getByText(/all other execution steps must be completed/i)).toBeInTheDocument();
	});

	it('enables Complete PRC once other steps are complete and GR succeeded', () => {
		renderStep(true);

		expect(screen.getByRole('button', { name: /complete prc/i })).toBeEnabled();
		expect(screen.queryByText(/all other execution steps must be completed/i)).not.toBeInTheDocument();
	});

	it('still shows the confirmation log while other steps are open', () => {
		renderStep(false);

		expect(screen.getAllByText(/Goods Receipt/).length).toBeGreaterThan(0);
		expect(screen.getByRole('button', { name: /retry failed confirmations/i })).toBeEnabled();
	});
});
