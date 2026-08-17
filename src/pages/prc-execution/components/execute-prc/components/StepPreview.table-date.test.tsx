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

const inspectionPreview: StepPreviewData = {
	stepNumber: 1,
	title: 'Final inspection',
	type: 'inspection',
	ctq: false,
	data: {
		5: { value: 'orphan' },
		10: { value: 'second', annotations: [{ imageFileName: 'second.png', regions: [] }] },
		20: { value: 'first', annotations: [{ imageFileName: 'first.png', regions: [] }] },
		partialCtqApprove: true,
		plannedTime: 60
	},
	inspectionParameters: [
		{
			id: 10,
			parameterName: 'Second parameter',
			type: 'text',
			ctq: false,
			role: 'Production',
			columns: [],
			specification: '',
			order: 2,
			version: 1,
			isLatest: true,
			createdAt: '',
			updatedAt: '',
			inspectionId: 1
		},
		{
			id: 20,
			parameterName: 'First parameter',
			type: 'text',
			ctq: false,
			role: 'Production',
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

		expect(screen.getByText('17/06/2026')).toBeInTheDocument();
	});

	it('renders inspection rows by metadata order and appends orphan data', () => {
		render(
			<StepPreview
				previewData={inspectionPreview}
				onBackToStep={noop}
				onApproveProduction={noop}
				onApproveCTQ={noop}
				onPartialApproveCTQ={noop}
				onProceedToNext={noop}
				embeddedReportMode
			/>
		);

		const rows = screen.getAllByRole('row');
		expect(rows).toHaveLength(4);
		expect(within(rows[1]).getByText('First parameter')).toBeInTheDocument();
		expect(within(rows[2]).getByText('Second parameter')).toBeInTheDocument();
		expect(within(rows[3]).getByText('Parameter 5')).toBeInTheDocument();
		expect(screen.queryByText('Parameter partialCtqApprove')).not.toBeInTheDocument();

		const annotationSection = screen.getByText('Image Annotations').parentElement;
		expect(annotationSection).not.toBeNull();
		expect(
			within(annotationSection as HTMLElement)
				.getAllByText(/parameter$/i)
				.map(node => node.textContent)
		).toEqual(['First parameter', 'Second parameter']);
	});
});
