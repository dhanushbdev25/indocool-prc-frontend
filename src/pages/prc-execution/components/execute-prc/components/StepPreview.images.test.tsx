import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const imageDisplayCalls: Array<{ imageUrl: string; annotations: unknown[] }> = [];
vi.mock('./ImageDisplay', () => ({
	default: (props: { imageUrl: string; annotations: unknown[] }) => {
		imageDisplayCalls.push({ imageUrl: props.imageUrl, annotations: props.annotations });
		return null;
	}
}));

vi.mock('../../../../../hooks/useCurrentRole', () => ({
	useCurrentRole: () => ({ hasPermission: () => true, role: 'OPERATOR' })
}));

vi.mock('../../../../../store/api/business/prc-execution/prc-execution.api', () => ({
	useFetchOperationDelayReasonComboQuery: () => ({ data: [], isLoading: false })
}));

import StepPreview from './StepPreview';

const noop = () => {};

const parameter = (id: number, files: Array<{ fileName: string; filePath: string }>) => ({
	id,
	parameterName: `Parameter ${id}`,
	type: 'ok/not ok',
	ctq: false,
	role: 'Quality',
	columns: [],
	specification: '',
	order: id,
	version: 1,
	isLatest: true,
	createdAt: '',
	updatedAt: '',
	inspectionId: 1,
	files
});

const renderPreview = (data: Record<string, unknown>, inspectionParameters: unknown[]) =>
	render(
		<StepPreview
			previewData={
				{
					stepNumber: 3,
					title: 'Demoulding Inspection',
					type: 'inspection',
					ctq: false,
					data,
					inspectionParameters
				} as unknown as StepPreviewData
			}
			onBackToStep={noop}
			onApproveProduction={noop}
			onApproveCTQ={noop}
			onPartialApproveCTQ={noop}
			onProceedToNext={noop}
			embeddedReportMode
		/>
	);

describe('StepPreview inspection images', () => {
	beforeEach(() => {
		imageDisplayCalls.length = 0;
	});

	it('shows attached images even when the operator did not annotate them', () => {
		renderPreview({ 1: { value: 'ok' } }, [
			parameter(1, [{ fileName: 'a.jpg', filePath: 'files/part_drawings/a.jpg' }])
		]);

		expect(imageDisplayCalls).toHaveLength(1);
		expect(imageDisplayCalls[0].imageUrl).toMatch(/\/files\/part_drawings\/a\.jpg$/);
		expect(imageDisplayCalls[0].annotations).toEqual([]);
	});

	it('loads annotated images from the stored file path, not the URL saved with the annotation', () => {
		const region = { id: 'c1', type: 'circle', cx: 0.5, cy: 0.5, radius: 0.1, category: 'Mould damages' };
		renderPreview(
			{
				1: {
					value: 'not ok',
					annotations: [
						{
							imageFileName: 'a.jpg',
							imageUrl: 'http://43.205.188.89:8080/web/files/part_drawings/a.jpg',
							regions: [region]
						}
					]
				}
			},
			[parameter(1, [{ fileName: 'a.jpg', filePath: 'files/part_drawings/a.jpg' }])]
		);

		expect(imageDisplayCalls).toHaveLength(1);
		expect(imageDisplayCalls[0].imageUrl).not.toContain('43.205.188.89');
		expect(imageDisplayCalls[0].imageUrl).toMatch(/\/files\/part_drawings\/a\.jpg$/);
		expect(imageDisplayCalls[0].annotations).toEqual([region]);
	});
});
