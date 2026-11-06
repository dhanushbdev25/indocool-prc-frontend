import { useEffect } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { TableConfig } from '../../../../../../types/table-config.types';
import type { InspectionFormData } from '../schemas';
import FixedTableConfigEditor from './FixedTableConfigEditor';

vi.mock('@mui/icons-material', () => ({
	Add: () => null,
	Delete: () => null,
	Lock: () => null,
	LockOpen: () => null,
	ArrowUpward: () => null,
	ArrowDownward: () => null
}));

const initialConfig: TableConfig = {
	columns: [{ name: 'Reading', type: 'number', minimumAcceptanceValue: '5', maximumAcceptanceValue: '10' }],
	rows: [{ cells: { Reading: { value: '', readOnly: false } } }]
};

let latest: TableConfig | undefined;

/** Hosts the editor in a form and reports the table config after every change. */
const Harness = ({ onConfig }: { onConfig: (config: TableConfig) => void }) => {
	const methods = useForm<InspectionFormData>({
		defaultValues: {
			inspectionParameters: [{ type: 'fixed-table', tableConfig: initialConfig }]
		} as unknown as InspectionFormData
	});
	const config = useWatch({ control: methods.control, name: 'inspectionParameters.0.tableConfig' });
	useEffect(() => {
		onConfig(config as unknown as TableConfig);
	}, [config, onConfig]);
	return (
		<FormProvider {...methods}>
			<FixedTableConfigEditor control={methods.control} parameterIndex={0} />
		</FormProvider>
	);
};

describe('FixedTableConfigEditor per-cell data types', () => {
	it('seeds every cell from its column when the toggle is turned on, and lets a cell change type', () => {
		render(
			<Harness
				onConfig={config => {
					latest = config;
				}}
			/>
		);
		// Off: the column carries the type select.
		expect(screen.getAllByRole('combobox', { name: 'Data type' })).toHaveLength(1);

		fireEvent.click(screen.getByRole('switch', { name: /set data type per cell/i }));

		expect(latest?.cellTypes).toBe(true);
		expect(latest?.rows[0].cells.Reading).toMatchObject({
			type: 'number',
			minimumAcceptanceValue: '5',
			maximumAcceptanceValue: '10'
		});

		// On: the column loses its select and the cell gets one.
		const cellType = screen.getByRole('combobox', { name: 'Data type' });
		fireEvent.mouseDown(cellType);
		fireEvent.click(within(screen.getByRole('listbox')).getByText('Boolean'));

		expect(latest?.rows[0].cells.Reading).toEqual({ value: '', readOnly: false, type: 'boolean' });
	});

	it('keeps showing a saved number column, while new types leave number and integer out', () => {
		render(<Harness onConfig={() => {}} />);
		const columnType = screen.getByRole('combobox', { name: 'Data type' });
		expect(columnType).toHaveTextContent('Number');

		fireEvent.mouseDown(columnType);
		const options = within(screen.getByRole('listbox'));
		expect(options.getByText('Number')).toBeInTheDocument();
		expect(options.queryByText('Integer')).not.toBeInTheDocument();
		fireEvent.click(options.getByText('Text'));

		fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Data type' }));
		const afterChange = within(screen.getByRole('listbox'));
		expect(afterChange.queryByText('Number')).not.toBeInTheDocument();
		expect(afterChange.queryByText('Integer')).not.toBeInTheDocument();
	});

	it('drops the cell types again when the toggle is turned off', () => {
		render(
			<Harness
				onConfig={config => {
					latest = config;
				}}
			/>
		);
		const toggle = screen.getByRole('switch', { name: /set data type per cell/i });
		fireEvent.click(toggle);
		fireEvent.click(toggle);

		expect(latest?.cellTypes).toBeUndefined();
		expect(latest?.rows[0].cells.Reading).toEqual({ value: '', readOnly: false });
	});
});
