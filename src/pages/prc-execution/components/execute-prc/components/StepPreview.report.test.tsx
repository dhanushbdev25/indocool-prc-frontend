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
	Error: () => null,
	RemoveCircleOutline: () => null
}));

vi.mock('./ImageDisplay', () => ({
	default: () => null
}));

vi.mock('../../../../../hooks/useCurrentRole', () => ({
	useCurrentRole: () => ({ hasPermission: () => true, role: 'OPERATOR' })
}));

vi.mock('../../../../../store/api/business/prc-execution/prc-execution.api', () => ({
	useFetchOperationDelayReasonComboQuery: () => ({ data: [], isLoading: false })
}));

import StepPreview from './StepPreview';

const noop = () => {};

const renderPreview = (previewData: StepPreviewData, embeddedReportMode: boolean) =>
	render(
		<StepPreview
			previewData={previewData}
			onBackToStep={noop}
			onApproveProduction={noop}
			onApproveCTQ={noop}
			onPartialApproveCTQ={noop}
			onProceedToNext={noop}
			embeddedReportMode={embeddedReportMode}
		/>
	);

const headerTexts = () =>
	screen
		.getAllByRole('columnheader')
		.map(cell => cell.textContent?.trim() ?? '')
		.filter(Boolean);

const inspectionPreview = {
	stepNumber: 2,
	title: 'FIR',
	type: 'inspection',
	ctq: false,
	data: {
		7: { value: [{ id: 'a', label: 'Reading', type: 'text', value: '12' }] },
		8: { value: 'ok' }
	},
	inspectionMetadata: {
		id: 1,
		type: 'FIR (Copy)',
		status: 'ACTIVE',
		version: 1,
		isLatest: true,
		createdAt: '',
		updatedAt: '',
		inspectionId: '1',
		inspectionName: 'FIR'
	},
	inspectionParameters: [
		{
			id: 7,
			parameterName: 'Template Inspection Characteristics',
			type: 'list',
			ctq: false,
			role: 'Quality',
			columns: [],
			specification: 'Spec for list',
			order: 1,
			version: 1,
			isLatest: true,
			createdAt: '',
			updatedAt: '',
			inspectionId: 1,
			files: [{ fileName: 'a.jpg', filePath: 'files/a.jpg' }]
		},
		{
			id: 8,
			parameterName: 'Surface finish',
			type: 'ok/not ok',
			ctq: false,
			role: 'Quality',
			columns: [],
			specification: 'No dents',
			order: 2,
			version: 1,
			isLatest: true,
			createdAt: '',
			updatedAt: '',
			inspectionId: 1
		}
	],
	productionApproved: true,
	ctqApproved: false,
	stepCompleted: true
} as unknown as StepPreviewData;

const sequencePreview = {
	stepNumber: 1,
	title: 'Moulding',
	type: 'sequence',
	ctq: true,
	data: [
		{
			stepNumber: 4,
			parameterDescription: 'Mould temperature',
			targetValueType: 'range',
			evaluationMethod: 'Thermometer',
			value: '25',
			minimumAcceptanceValue: '20',
			maximumAcceptanceValue: '30',
			ctq: true
		}
	],
	productionApproved: true,
	ctqApproved: true,
	stepCompleted: true
} as unknown as StepPreviewData;

describe('StepPreview in the printed report', () => {
	it('drops Specification, the Type/Status/Version box and the List / files chips from an inspection', () => {
		renderPreview(inspectionPreview, true);

		expect(headerTexts()).not.toContain('Specification');
		expect(screen.queryByText('Spec for list')).not.toBeInTheDocument();
		expect(screen.queryByText('No dents')).not.toBeInTheDocument();

		expect(screen.queryByText('FIR (Copy)')).not.toBeInTheDocument();
		expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument();
		expect(screen.queryByText('v1')).not.toBeInTheDocument();

		const paramRow = screen.getByText('Template Inspection Characteristics').closest('tr') as HTMLElement;
		expect(within(paramRow).queryByText('List')).not.toBeInTheDocument();
		expect(within(paramRow).queryByText('1 files')).not.toBeInTheDocument();
	});

	it('uses short sub-headings that span the narrower inspection table', () => {
		renderPreview(inspectionPreview, true);

		const subHeading = screen.getByText('List');
		expect(screen.queryByText('Template Inspection Characteristics - List')).not.toBeInTheDocument();
		// 6 columns once Specification is gone.
		expect(headerTexts()).toHaveLength(6);
		expect(subHeading.closest('td')).toHaveAttribute('colspan', '6');
	});

	it('keeps all inspection details on the execution screen', () => {
		renderPreview(inspectionPreview, false);

		expect(headerTexts()).toContain('Specification');
		expect(screen.getByText('FIR (Copy)')).toBeInTheDocument();
		expect(screen.getByText('1 files')).toBeInTheDocument();
		expect(screen.getByText('Template Inspection Characteristics - List')).toBeInTheDocument();
	});

	it('drops the Step and Target Value Type columns from a sequence but keeps its criticality', () => {
		renderPreview(sequencePreview, true);

		const headers = headerTexts();
		expect(headers).not.toContain('Step');
		expect(headers).not.toContain('Target Value Type');
		expect(headers[0]).toBe('Parameter');

		const row = screen.getByText('Mould temperature').closest('tr') as HTMLElement;
		expect(within(row).getByText('CTQ')).toBeInTheDocument();
	});

	it('keeps the Step and Target Value Type columns on the execution screen', () => {
		renderPreview(sequencePreview, false);

		const headers = headerTexts();
		expect(headers).toContain('Step');
		expect(headers).toContain('Target Value Type');
	});
});
