import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TimelineStep } from '../types/execution.types';

vi.mock('@mui/icons-material', () => ({
	WarningAmberRounded: () => null
}));

import StepExecutionMetaSummary from './StepExecutionMetaSummary';

const approver = { name: 'Priya Quality', employeeNo: 'Q-17' };

const inspectionStep = (flags: { approveByProduction?: boolean; approveByQuality?: boolean }) =>
	({
		stepNumber: 3,
		title: 'FIR (Copy)',
		type: 'inspection',
		status: 'completed',
		stepData: { prcTemplateStepId: 42 },
		inspectionMetadata: { id: 1, type: 'FIR', status: 'ACTIVE', version: 1, ...flags }
	}) as unknown as TimelineStep;

const timingRoot = (bucket: Record<string, unknown>) => ({ 42: bucket });

describe('StepExecutionMetaSummary approver labels', () => {
	it('labels a quality-only inspection approval as quality, even though it is stored as production', () => {
		render(
			<StepExecutionMetaSummary
				step={inspectionStep({ approveByQuality: true, approveByProduction: false })}
				stepStartEndTime={timingRoot({ productionApprovedBy: approver })}
				variant="report"
			/>
		);

		expect(screen.getByText('Quality approved by')).toBeInTheDocument();
		expect(screen.queryByText('Production approved by')).not.toBeInTheDocument();
	});

	it('shows a quality-only inspection approver once when both keys are present', () => {
		render(
			<StepExecutionMetaSummary
				step={inspectionStep({ approveByQuality: true })}
				stepStartEndTime={timingRoot({ productionApprovedBy: approver, qualityApprovedBy: approver })}
				variant="report"
			/>
		);

		expect(screen.getAllByText('Quality approved by')).toHaveLength(1);
	});

	it('keeps the production label for a production-approved inspection', () => {
		render(
			<StepExecutionMetaSummary
				step={inspectionStep({ approveByProduction: true, approveByQuality: false })}
				stepStartEndTime={timingRoot({ productionApprovedBy: approver })}
				variant="report"
			/>
		);

		expect(screen.getByText('Production approved by')).toBeInTheDocument();
		expect(screen.queryByText('Quality approved by')).not.toBeInTheDocument();
	});

	it('uses the short Quality label on the sidebar card too', () => {
		render(
			<StepExecutionMetaSummary
				step={inspectionStep({ approveByQuality: true })}
				stepStartEndTime={timingRoot({ productionApprovedBy: approver })}
			/>
		);

		expect(screen.getByText('Quality')).toBeInTheDocument();
		expect(screen.queryByText('Production')).not.toBeInTheDocument();
	});
});
