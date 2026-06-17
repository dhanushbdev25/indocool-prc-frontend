import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { StepPreviewData } from '../../../types/execution.types';

vi.mock('@mui/icons-material', () => ({
	ArrowBack: () => null,
	CheckCircle: () => null,
	Visibility: () => null,
	Check: () => null,
	ArrowForward: () => null,
	AccessTime: () => null,
	ArrowDropDown: () => null,
	ExpandMore: () => null,
	ExpandLess: () => null,
	Warning: () => null,
	Error: () => null
}));

vi.mock('./ImageDisplay', () => ({
	default: () => null
}));

vi.mock('../../../../../hooks/useCurrentRole', () => ({
	useCurrentRole: () => ({
		hasPermission: () => true,
		role: 'OPERATOR'
	})
}));

vi.mock('../../../../../store/api/business/prc-execution/prc-execution.api', () => ({
	useFetchOperationDelayReasonComboQuery: () => ({ data: [], isLoading: false })
}));

import StepPreview from './StepPreview';

const noop = () => {};

const sequenceTablePreview: StepPreviewData = {
	stepNumber: 1,
	title: 'Table step',
	type: 'sequence',
	ctq: false,
	data: [
		{
			parameterDescription: 'Manufacturing log',
			targetValueType: 'table',
			value: [{ 'Mfg Date': '2026-06-17' }],
			tableConfig: {
				columns: [{ name: 'Mfg Date', type: 'date' }],
				rows: [{ cells: { 'Mfg Date': { value: '', readOnly: false } } }]
			}
		}
	],
	productionApproved: false,
	ctqApproved: false,
	stepCompleted: false
};

describe('StepPreview table date display', () => {
	it('renders formatted date values in sequence table preview', () => {
		render(
			<StepPreview
				previewData={sequenceTablePreview}
				onBackToStep={noop}
				onApproveProduction={noop}
				onApproveCTQ={noop}
				onPartialApproveCTQ={noop}
				onProceedToNext={noop}
				embeddedReportMode
			/>
		);

		expect(screen.getByText('17 Jun 2026')).toBeInTheDocument();
	});
});
