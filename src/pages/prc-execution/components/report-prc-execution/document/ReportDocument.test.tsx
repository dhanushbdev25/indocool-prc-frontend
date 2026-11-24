import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../types/execution.types';

const fileUrl = vi.hoisted(() => ({ result: { src: 'blob:photo', loading: false, error: false } }));
vi.mock('../../../../../hooks/useAuthenticatedFileUrl', () => ({
	useAuthenticatedFileUrl: () => fileUrl.result
}));

import { ReportDocument } from './ReportDocument';

const execution = {
	id: 73658,
	orderId: 1000123,
	date: '2026-11-21',
	partNumber: 'FG-20418',
	partDescription: 'Nacelle cover',
	customer: 'Vestas',
	status: 'in-progress',
	prcAggregatedSteps: {
		31: {
			4: {
				value: 'ok',
				annotations: [
					{
						imageFileName: 'top.jpg',
						imageUrl: 'files/top.jpg',
						regions: [{ type: 'point', id: 'p', x: 0.5, y: 0.5, cls: '', comment: 'Pin hole' }]
					}
				]
			}
		}
	},
	stepStartEndTime: {}
} as unknown as ExecutionData;

const inspection = {
	stepNumber: 2,
	title: 'Final inspection',
	type: 'inspection',
	status: 'completed',
	stepData: { prcTemplateStepId: 31 },
	inspectionParameters: [
		{ id: 4, order: 1, parameterName: 'Surface', type: 'ok/not ok', ctq: true, columns: [], files: [] }
	]
} as unknown as TimelineStep;

const pendingInspection = {
	...inspection,
	stepNumber: 3,
	title: 'Trim inspection',
	status: 'pending',
	stepData: { prcTemplateStepId: 99 }
} as unknown as TimelineStep;

const brokenSequence = {
	stepNumber: 4,
	title: 'Lamination',
	type: 'sequence',
	status: 'pending'
} as unknown as TimelineStep;

describe('ReportDocument', () => {
	it('renders the header, sections with status, and nothing interactive', () => {
		const { container } = render(
			<ReportDocument execution={execution} steps={[inspection, pendingInspection, brokenSequence]} />
		);
		const sheet = container.querySelector('.prc-doc-sheet') as HTMLElement;
		expect(within(sheet).queryByText('Process Record Card')).not.toBeInTheDocument();
		expect(within(sheet).getByText('Order no.')).toBeInTheDocument();
		expect(within(sheet).getByText('FG-20418')).toBeInTheDocument();
		expect(within(sheet).getByText('2. Final inspection')).toBeInTheDocument();
		expect(within(sheet).getByText('Completed')).toBeInTheDocument();
		expect(within(sheet).getAllByText('Pending')).toHaveLength(2);
		expect(within(sheet).getByText('Not started — no data recorded')).toBeInTheDocument();
		expect(within(sheet).getByText('Data not available for this step.')).toBeInTheDocument();
		expect(sheet.querySelectorAll('input, button, select, textarea')).toHaveLength(0);
	});

	it('prints photos under their parameter row and reports when they have loaded', () => {
		const onPending = vi.fn();
		const { container } = render(
			<ReportDocument execution={execution} steps={[inspection]} onPendingPhotosChange={onPending} />
		);
		const detailRow = container.querySelector('tr.prc-doc-detail') as HTMLElement;
		expect(detailRow.previousElementSibling?.textContent).toContain('Surface');
		const img = within(detailRow).getByRole('img', { name: /Photo 1\.1/ });
		expect(onPending).toHaveBeenLastCalledWith(1);
		fireEvent.load(img);
		expect(onPending).toHaveBeenLastCalledWith(0);
		expect(within(detailRow).getByText('1. Pin hole')).toBeInTheDocument();
	});

	it('says when a photo could not be loaded and stops waiting for it', () => {
		fileUrl.result = { src: '', loading: false, error: true };
		const onPending = vi.fn();
		render(<ReportDocument execution={execution} steps={[inspection]} onPendingPhotosChange={onPending} />);
		expect(screen.getByText(/Image could not be loaded: top\.jpg/)).toBeInTheDocument();
		expect(onPending).toHaveBeenLastCalledWith(0);
		fileUrl.result = { src: 'blob:photo', loading: false, error: false };
	});
	it('prints timing and the approver side by side in the row under the title', () => {
		const setup = {
			stepNumber: 1,
			title: 'Execution setup',
			type: 'setup',
			status: 'completed'
		} as unknown as TimelineStep;
		const withTiming = {
			...execution,
			stepStartEndTime: {
				prcmetadata: {
					startTime: '2026-11-14T13:33:00Z',
					dataEnteredBy: { name: 'Sathoshkumar A', employeeNo: '1577' }
				}
			}
		} as unknown as ExecutionData;
		const { container } = render(<ReportDocument execution={withTiming} steps={[setup]} />);
		const strips = container.querySelectorAll('.prc-doc-strip');
		expect(strips).toHaveLength(1);
		expect(strips[0].textContent).toContain('Start time');
		expect(strips[0].textContent).toContain('Recorded by');
		expect(strips[0].textContent).toContain('Sathoshkumar A (1577)');
		expect(container.querySelector('.prc-doc-approvals')).toBeNull();
	});
});
