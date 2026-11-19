import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../../../../types/execution.types';
import RawMaterialsStep from './RawMaterialsStep';

const step = {
	stepNumber: 2,
	title: 'Bill of Material Validation',
	description: 'Validate bill of material quantities and batch tracking',
	type: 'rawMaterials',
	status: 'completed',
	items: []
} as unknown as TimelineStep;

describe('RawMaterialsStep heading', () => {
	it('leaves out the title and instruction text in the printed report, where the section header shows the title', () => {
		render(<RawMaterialsStep step={step} readOnlyOverride hideHeading />);

		expect(screen.queryByText('Bill of Material Validation')).not.toBeInTheDocument();
		expect(screen.queryByText('Validate bill of material quantities and batch tracking')).not.toBeInTheDocument();
	});

	it('keeps them on the execution screen', () => {
		render(<RawMaterialsStep step={step} readOnlyOverride />);

		expect(screen.getByText('Bill of Material Validation')).toBeInTheDocument();
		expect(screen.getByText('Validate bill of material quantities and batch tracking')).toBeInTheDocument();
	});
});
