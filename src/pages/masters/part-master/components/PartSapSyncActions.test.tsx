import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const syncSapBom = vi.fn();
const syncSapOperations = vi.fn();
const hasPermission = vi.fn();

vi.mock('@mui/icons-material', () => ({
	AccountTree: () => null,
	Sync: () => null
}));

vi.mock('../../../../hooks/useCurrentRole', () => ({
	useCurrentRole: () => ({
		hasPermission
	})
}));

vi.mock('../../../../store/api/business/sap-job-runs/sap-job-runs.api', () => ({
	useSyncSapBomMutation: () => [syncSapBom, { isLoading: false }],
	useSyncSapOperationsMutation: () => [syncSapOperations, { isLoading: false }]
}));

import PartSapSyncActions from './PartSapSyncActions';

describe('PartSapSyncActions', () => {
	beforeEach(() => {
		hasPermission.mockReset();
		syncSapBom.mockReset();
		syncSapOperations.mockReset();
		hasPermission.mockReturnValue(true);
		syncSapBom.mockReturnValue({ unwrap: () => Promise.resolve({}) });
		syncSapOperations.mockReturnValue({ unwrap: () => Promise.resolve({}) });
	});

	it('hides controls without PART_MASTER_EDIT', () => {
		hasPermission.mockReturnValue(false);
		const { container } = render(<PartSapSyncActions partId={993} />);
		expect(container).toBeEmptyDOMElement();
		expect(hasPermission).toHaveBeenCalledWith('PART_MASTER_EDIT');
	});

	it('calls sync-bom with the part id and shows BOM synced', async () => {
		const onSynced = vi.fn();
		render(<PartSapSyncActions partId={993} onSynced={onSynced} />);

		fireEvent.click(screen.getByRole('button', { name: 'Sync SAP BOM' }));

		await waitFor(() => {
			expect(syncSapBom).toHaveBeenCalledWith({ partId: 993 });
		});
		expect(await screen.findByRole('status')).toHaveTextContent('BOM synced');
		expect(onSynced).toHaveBeenCalledWith('bom');
	});

	it('calls sync-routing with the part id and shows Operations synced', async () => {
		const onSynced = vi.fn();
		render(<PartSapSyncActions partId={993} onSynced={onSynced} />);

		fireEvent.click(screen.getByRole('button', { name: 'Sync SAP Operations' }));

		await waitFor(() => {
			expect(syncSapOperations).toHaveBeenCalledWith({ partId: 993 });
		});
		expect(await screen.findByRole('status')).toHaveTextContent('Operations synced');
		expect(onSynced).toHaveBeenCalledWith('operations');
	});

	it('does not show synced text when the mutation fails', async () => {
		syncSapBom.mockReturnValue({ unwrap: () => Promise.reject(new Error('fail')) });
		const onSynced = vi.fn();
		render(<PartSapSyncActions partId={993} onSynced={onSynced} />);

		fireEvent.click(screen.getByRole('button', { name: 'Sync SAP BOM' }));

		await waitFor(() => {
			expect(syncSapBom).toHaveBeenCalled();
		});
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		expect(onSynced).not.toHaveBeenCalled();
	});
});
