import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TableConfig } from '../../types/table-config.types';
import FixedTableEditor from './FixedTableEditor';

vi.mock('@mui/icons-material', () => ({
	Add: () => null,
	Delete: () => null,
	Lock: () => null,
	LockOpen: () => null,
	ArrowUpward: () => null,
	ArrowDownward: () => null
}));

describe('FixedTableEditor with tables saved before typed cell inputs', () => {
	it('shows every saved cell value, even ones its column type would not produce', () => {
		const saved: TableConfig = {
			columns: [
				{ name: 'Hole Diameter', type: 'number' },
				{ name: 'Made on', type: 'date' },
				{ name: 'Result', type: 'ok/not ok' }
			],
			rows: [
				{
					cells: {
						'Hole Diameter': { value: 'NA', readOnly: true },
						'Made on': { value: '17/11/2026', readOnly: true },
						Result: { value: 'Passed', readOnly: true }
					}
				}
			]
		};
		render(<FixedTableEditor config={saved} onChange={() => {}} />);

		expect(screen.getByDisplayValue('NA')).toBeInTheDocument();
		expect(screen.getByDisplayValue('17/11/2026')).toBeInTheDocument();
		expect(screen.getByText('Passed')).toBeInTheDocument();
	});
});
