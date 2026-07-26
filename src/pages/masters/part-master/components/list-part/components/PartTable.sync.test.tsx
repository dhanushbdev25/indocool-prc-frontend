import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const hasPermission = vi.fn();

vi.mock('@mui/icons-material', () => ({
	MoreVert: () => null,
	Visibility: () => null,
	Edit: () => null,
	Delete: () => null,
	Build: () => null,
	CheckCircle: () => null,
	History: () => null,
	Sync: () => null,
	AccountTree: () => null
}));

vi.mock('../../../../../../hooks/useCurrentRole', () => ({
	useCurrentRole: () => ({
		hasPermission
	})
}));

vi.mock('../../../../../../components/table/TableComponent', () => ({
	default: ({
		data,
		tableColumns
	}: {
		data: Array<{ id: number; partNumber: string }>;
		tableColumns: Array<{
			id?: string;
			Cell?: (args: { row: { original: { id: number; partNumber: string } } }) => ReactNode;
		}>;
	}) => {
		const actionsColumn = tableColumns.find(column => column.id === 'actions');
		return (
			<div>
				{data.map(row => (
					<div key={row.id}>
						<span>{row.partNumber}</span>
						{actionsColumn?.Cell?.({ row: { original: row } })}
					</div>
				))}
			</div>
		);
	}
}));

import PartTable, { type PartData } from './PartTable';

const samplePart: PartData = {
	id: 993,
	partNumber: 'P-993',
	drawingNumber: 'D-1',
	status: 'ACTIVE',
	customer: 'C1',
	customerName: 'Customer',
	description: 'Sample',
	version: 1,
	totalRawMaterials: 0,
	totalDrilling: 0,
	totalCutting: 0,
	createdAt: '',
	updatedAt: ''
};

describe('PartTable SAP sync menu', () => {
	beforeEach(() => {
		hasPermission.mockReset();
		hasPermission.mockReturnValue(true);
	});

	it('exposes sync actions for editors and passes the row part id', () => {
		const onSyncBom = vi.fn();
		const onSyncOperations = vi.fn();

		render(
			<PartTable
				data={[samplePart]}
				onActionClick={vi.fn()}
				onEdit={vi.fn()}
				onView={vi.fn()}
				onAuditLogs={vi.fn()}
				onSyncBom={onSyncBom}
				onSyncOperations={onSyncOperations}
			/>
		);

		fireEvent.click(screen.getByRole('button'));
		fireEvent.click(screen.getByText('Sync SAP BOM'));
		expect(onSyncBom).toHaveBeenCalledWith(993);

		fireEvent.click(screen.getByRole('button'));
		fireEvent.click(screen.getByText('Sync SAP Operations'));
		expect(onSyncOperations).toHaveBeenCalledWith(993);
	});

	it('hides sync actions without PART_MASTER_EDIT', () => {
		hasPermission.mockImplementation((permission: string) => permission !== 'PART_MASTER_EDIT');

		render(
			<PartTable
				data={[samplePart]}
				onActionClick={vi.fn()}
				onEdit={vi.fn()}
				onView={vi.fn()}
				onAuditLogs={vi.fn()}
				onSyncBom={vi.fn()}
				onSyncOperations={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByRole('button'));
		expect(screen.queryByText('Sync SAP BOM')).not.toBeInTheDocument();
		expect(screen.queryByText('Sync SAP Operations')).not.toBeInTheDocument();
	});

	it('disables sync menu items while a sync is in progress', () => {
		render(
			<PartTable
				data={[samplePart]}
				onActionClick={vi.fn()}
				onEdit={vi.fn()}
				onView={vi.fn()}
				onAuditLogs={vi.fn()}
				onSyncBom={vi.fn()}
				onSyncOperations={vi.fn()}
				isSyncingBom
				isSyncingOperations
			/>
		);

		fireEvent.click(screen.getByRole('button'));
		expect(screen.getByText('Sync SAP BOM').closest('li')).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByText('Sync SAP Operations').closest('li')).toHaveAttribute('aria-disabled', 'true');
	});
});
