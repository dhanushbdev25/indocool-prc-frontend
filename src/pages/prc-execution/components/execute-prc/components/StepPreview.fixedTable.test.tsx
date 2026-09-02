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

vi.mock('./ImageDisplay', () => ({ default: () => null }));

vi.mock('../../../../../hooks/useCurrentRole', () => ({
	useCurrentRole: () => ({ hasPermission: () => true, role: 'OPERATOR' })
}));

vi.mock('../../../../../store/api/business/prc-execution/prc-execution.api', () => ({
	useFetchOperationDelayReasonComboQuery: () => ({ data: [], isLoading: false })
}));

import StepPreview from './StepPreview';

const noop = () => {};

const PARAM_ID = 17174;

const savedRow = {
	'Inspection Date': '2026-08-29',
	'Employee Code': '9946',
	'Employee Name': 'JAGADESHAN P'
};

const previewWith = (value: unknown): StepPreviewData =>
	({
		stepNumber: 3,
		title: 'Demoulding Inspection',
		type: 'inspection',
		ctq: false,
		data: { [PARAM_ID]: { value } },
		inspectionParameters: [
			{
				id: PARAM_ID,
				parameterName: 'Inspector details',
				type: 'fixed-table',
				ctq: false,
				role: 'Quality',
				columns: [],
				specification: '',
				order: 1,
				version: 1,
				isLatest: true,
				createdAt: '',
				updatedAt: '',
				inspectionId: 1,
				tableConfig: {
					columns: [
						{ name: 'Inspection Date', type: 'date' },
						{ name: 'Employee Code', type: 'number' },
						{ name: 'Employee Name', type: 'text' }
					],
					rows: [
						{
							cells: {
								'Inspection Date': { value: '', readOnly: false },
								'Employee Code': { value: '', readOnly: false },
								'Employee Name': { value: '', readOnly: false }
							}
						}
					]
				}
			}
		],
		productionApproved: false,
		ctqApproved: false,
		stepCompleted: true
	}) as unknown as StepPreviewData;

const renderPreview = (value: unknown) =>
	render(
		<StepPreview
			previewData={previewWith(value)}
			onBackToStep={noop}
			onApproveProduction={noop}
			onApproveCTQ={noop}
			onPartialApproveCTQ={noop}
			onProceedToNext={noop}
			embeddedReportMode
		/>
	);

describe('StepPreview fixed-table rows', () => {
	it('renders rows stored as an array', () => {
		renderPreview([savedRow]);

		expect(screen.getByText('1 row')).toBeInTheDocument();
		expect(screen.getByText('9946')).toBeInTheDocument();
		expect(screen.getByText('JAGADESHAN P')).toBeInTheDocument();
		expect(screen.getByText('29/08/2026')).toBeInTheDocument();
	});

	// Re-saving a step used to spread the row array into an index-keyed object, which is the shape
	// nearly every stored execution holds. The sheet read as empty — "0 rows" and no cells.
	it('renders rows stored as an index-keyed object', () => {
		renderPreview({ 0: savedRow });

		expect(screen.getByText('1 row')).toBeInTheDocument();
		expect(screen.getByText('9946')).toBeInTheDocument();
		expect(screen.getByText('JAGADESHAN P')).toBeInTheDocument();
		expect(screen.getByText('29/08/2026')).toBeInTheDocument();
	});
});
