import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuditHistoryEntry } from '../../../store/api/business/audit-history/audit-history.validators';
import { AuditHistoryPanel } from './AuditHistoryPanel';

const entry: AuditHistoryEntry = {
	id: 10,
	version: 3,
	changeType: 'UPDATE',
	changedAt: '2026-07-24T20:00:00.000Z',
	changedBy: 1,
	changedByName: 'Dev Admin',
	changes: [
		{
			field: 'inspection.inspectionName',
			type: 'MODIFIED',
			oldValue: 'Before',
			newValue: 'After'
		}
	],
	parameterChanges: [
		{
			changeType: 'ADDED',
			parameterName: 'Temperature',
			order: 1,
			type: 'number'
		}
	]
};

describe('AuditHistoryPanel', () => {
	it('renders loading, error, and empty states', () => {
		const { rerender } = render(<AuditHistoryPanel isLoading />);
		expect(screen.queryByText('No audit logs are available for this record.')).not.toBeInTheDocument();

		rerender(<AuditHistoryPanel isError />);
		expect(screen.getByText('Failed to load audit logs.')).toBeInTheDocument();

		rerender(<AuditHistoryPanel history={[]} />);
		expect(screen.getByText('No audit logs are available for this record.')).toBeInTheDocument();
	});

	it('shows entry metadata and expandable returned changes', () => {
		render(<AuditHistoryPanel history={[entry]} />);

		expect(screen.getByText('UPDATE')).toBeInTheDocument();
		expect(screen.getByText('Version 3')).toBeInTheDocument();
		expect(screen.getByText('Dev Admin')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /UPDATE Version 3 Dev Admin/i }));

		expect(screen.getByText('Inspection / Inspection Name')).toBeInTheDocument();
		expect(screen.getByText('Before')).toBeInTheDocument();
		expect(screen.getByText('After')).toBeInTheDocument();
		expect(screen.getByText('Temperature')).toBeInTheDocument();
	});

	it('for prcTemplate domain shows only stepChanges, not field changes', () => {
		const prcEntry: AuditHistoryEntry = {
			id: 11,
			version: 2,
			changeType: 'UPDATE',
			changedAt: '2026-07-24T20:00:00.000Z',
			changedBy: 1,
			changedByName: 'Dev Admin',
			changes: [
				{
					field: 'prcTemplate.templateName',
					type: 'MODIFIED',
					oldValue: 'Old Name',
					newValue: 'New Name'
				}
			],
			stepChanges: [
				{
					changeType: 'ADDED',
					stepName: 'Layup Sequence',
					stepType: 'sequence',
					stepId: 42
				}
			]
		};

		render(<AuditHistoryPanel history={[prcEntry]} domain="prcTemplate" />);
		fireEvent.click(screen.getByRole('button', { name: /UPDATE Version 2 Dev Admin/i }));

		expect(screen.getByText('Step changes')).toBeInTheDocument();
		expect(screen.getByText('Layup Sequence')).toBeInTheDocument();
		expect(screen.queryByText('Field changes')).not.toBeInTheDocument();
		expect(screen.queryByText('Old Name')).not.toBeInTheDocument();
		expect(screen.queryByText('New Name')).not.toBeInTheDocument();
	});
});
