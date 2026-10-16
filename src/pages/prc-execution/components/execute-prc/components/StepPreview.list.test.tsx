import { render, screen, within } from '@testing-library/react';
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

const savedList = [
	{
		id: 'temp',
		label: 'Mould temperature',
		type: 'number',
		value: '35',
		validationStatus: 'Greater',
		minimumAcceptanceValue: '20',
		maximumAcceptanceValue: '30',
		acknowledged: true
	},
	{ id: 'made', label: 'Made on', type: 'date', value: '2026-06-17' },
	{ id: 'surface', label: 'Surface', type: 'ok/not ok', value: 'not ok', comments: 'DV-12' }
];

const renderPreview = (previewData: StepPreviewData) =>
	render(
		<StepPreview
			previewData={previewData}
			onBackToStep={noop}
			onApproveProduction={noop}
			onApproveCTQ={noop}
			onPartialApproveCTQ={noop}
			onProceedToNext={noop}
			embeddedReportMode
		/>
	);

const expectListRendered = () => {
	const tempRow = screen.getByText('Mould temperature').closest('tr') as HTMLElement;
	expect(within(tempRow).getByText('35')).toBeInTheDocument();
	expect(within(tempRow).getByText('Above range')).toBeInTheDocument();
	expect(within(tempRow).getByText('Acknowledged')).toBeInTheDocument();
	expect(within(tempRow).getByText('Range: 20 to 30')).toBeInTheDocument();

	const madeRow = screen.getByText('Made on').closest('tr') as HTMLElement;
	expect(within(madeRow).getByText('17/06/2026')).toBeInTheDocument();

	const surfaceRow = screen.getByText('Surface').closest('tr') as HTMLElement;
	expect(within(surfaceRow).getByText('OK with deviation')).toBeInTheDocument();
	expect(within(surfaceRow).getByText(/DV-12/)).toBeInTheDocument();
};

describe('StepPreview list values', () => {
	it('renders a sequence list step as label / value rows', () => {
		renderPreview({
			stepNumber: 1,
			title: 'Mould prep',
			type: 'sequence',
			ctq: false,
			data: [{ parameterDescription: 'Mould readings', targetValueType: 'list', value: savedList }],
			productionApproved: false,
			ctqApproved: false,
			stepCompleted: false
		} as StepPreviewData);

		expectListRendered();
	});

	it('renders an inspection list parameter with its item count and an open detail row', () => {
		renderPreview({
			stepNumber: 2,
			title: 'Mould check',
			type: 'inspection',
			ctq: false,
			data: { 7: { value: savedList } },
			inspectionParameters: [
				{
					id: 7,
					parameterName: 'Mould readings',
					type: 'list',
					ctq: false,
					role: 'Quality',
					columns: [],
					specification: '',
					order: 1,
					version: 1,
					isLatest: true,
					createdAt: '',
					updatedAt: '',
					inspectionId: 1
				}
			],
			productionApproved: false,
			ctqApproved: false,
			stepCompleted: false
		} as unknown as StepPreviewData);

		expect(screen.getByText('3 items')).toBeInTheDocument();
		expect(screen.getByText('Mould readings - List')).toBeInTheDocument();
		expectListRendered();
	});
});
