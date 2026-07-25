import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { defaultInspectionFormData, defaultInspectionParameter, type InspectionFormData } from '../schemas';
import InspectionParameters from './InspectionParameters';

vi.mock('@mui/icons-material', () => ({
	Add: () => null,
	Delete: () => null,
	KeyboardArrowUp: () => null,
	KeyboardArrowDown: () => null,
	Settings: () => null,
	ExpandMore: () => null,
	ExpandLess: () => null,
	Assignment: () => null,
	Lock: () => null,
	LockOpen: () => null
}));

vi.mock('../../../../../../components/common/OperationalDatePicker', () => ({
	OperationalDatePicker: () => null,
	OperationalDateTimePicker: () => null
}));

function InspectionParametersHarness() {
	const methods = useForm<InspectionFormData>({
		defaultValues: {
			...defaultInspectionFormData,
			inspectionParameters: [
				{ ...defaultInspectionParameter, parameterName: 'First', order: 1 },
				{ ...defaultInspectionParameter, parameterName: 'Second', order: 2 }
			]
		}
	});
	const parameters = useWatch({ control: methods.control, name: 'inspectionParameters' });

	return (
		<FormProvider {...methods}>
			<InspectionParameters control={methods.control} errors={{}} />
			<output data-testid="parameter-state">
				{JSON.stringify(parameters?.map(parameter => ({ name: parameter.parameterName, order: parameter.order })))}
			</output>
		</FormProvider>
	);
}

describe('InspectionParameters ordering controls', () => {
	it('moves and removes parameters while keeping contiguous order values', async () => {
		const user = userEvent.setup();
		render(<InspectionParametersHarness />);

		await user.click(screen.getByRole('button', { name: 'Move parameter 1 down' }));

		await waitFor(() => {
			expect(JSON.parse(screen.getByTestId('parameter-state').textContent || '[]')).toEqual([
				{ name: 'Second', order: 1 },
				{ name: 'First', order: 2 }
			]);
		});

		await user.click(screen.getByRole('button', { name: 'Delete parameter 1' }));

		await waitFor(() => {
			expect(JSON.parse(screen.getByTestId('parameter-state').textContent || '[]')).toEqual([
				{ name: 'First', order: 1 }
			]);
		});
	});
});
