import { useState, useMemo, useCallback } from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { MasterListToolbar } from '../../../../../../components/masters';

export const INSPECTION_ALL_TYPES = 'All types';
export const INSPECTION_ALL_APPROVE = 'All';

interface InspectionManagementProps {
	onSearchChange?: (searchTerm: string) => void;
	onFilterChange?: (filter: string) => void;
	onTypeFilterChange?: (typeFilter: string) => void;
	onApproveByProductionFilterChange?: (value: string) => void;
	/** Debounced term applied in parent (for dirty indicator + reset). */
	appliedSearchTerm?: string;
	/** Distinct inspection types from loaded data (excluding empty). */
	typeOptions?: string[];
	listSummary?: string | null;
	searchAriaLabel?: string;
}

const InspectionManagement = ({
	onSearchChange,
	onFilterChange,
	onTypeFilterChange,
	onApproveByProductionFilterChange,
	appliedSearchTerm = '',
	typeOptions = [],
	listSummary,
	searchAriaLabel
}: InspectionManagementProps) => {
	const [activeFilter, setActiveFilter] = useState('All Inspections');
	const [activeType, setActiveType] = useState(INSPECTION_ALL_TYPES);
	const [activeApprove, setActiveApprove] = useState(INSPECTION_ALL_APPROVE);

	const statusOptions = ['All Inspections', 'ACTIVE', 'INACTIVE'];
	const typeChoices = [INSPECTION_ALL_TYPES, ...typeOptions];
	const approveOptions = [INSPECTION_ALL_APPROVE, 'Yes', 'No'];

	const handleStatusChange = (filter: string) => {
		setActiveFilter(filter);
		onFilterChange?.(filter);
	};

	const handleTypeChange = (value: string) => {
		setActiveType(value);
		onTypeFilterChange?.(value);
	};

	const handleApproveChange = (value: string) => {
		setActiveApprove(value);
		onApproveByProductionFilterChange?.(value);
	};

	const handleReset = useCallback(() => {
		setActiveFilter('All Inspections');
		setActiveType(INSPECTION_ALL_TYPES);
		setActiveApprove(INSPECTION_ALL_APPROVE);
		onFilterChange?.('All Inspections');
		onTypeFilterChange?.(INSPECTION_ALL_TYPES);
		onApproveByProductionFilterChange?.(INSPECTION_ALL_APPROVE);
	}, [onApproveByProductionFilterChange, onFilterChange, onTypeFilterChange]);

	const filterDirty = useMemo(
		() =>
			Boolean(appliedSearchTerm.trim()) ||
			activeFilter !== 'All Inspections' ||
			activeType !== INSPECTION_ALL_TYPES ||
			activeApprove !== INSPECTION_ALL_APPROVE,
		[appliedSearchTerm, activeApprove, activeFilter, activeType]
	);

	const selectSx = { minWidth: 180, borderRadius: 1 };

	return (
		<MasterListToolbar
				searchPlaceholder="Search by Inspection ID, name, or type"
				searchAriaLabel={searchAriaLabel}
				listSummary={listSummary}
				onSearchChange={onSearchChange}
				filterDirty={filterDirty}
				onReset={handleReset}
			>
				<FormControl size="small" sx={selectSx}>
					<InputLabel shrink>Status</InputLabel>
					<Select value={activeFilter} label="Status" onChange={e => handleStatusChange(e.target.value)}>
						{statusOptions.map(opt => (
							<MenuItem key={opt} value={opt}>
								{opt}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={selectSx}>
					<InputLabel shrink>Type</InputLabel>
					<Select value={activeType} label="Type" onChange={e => handleTypeChange(e.target.value)}>
						{typeChoices.map(opt => (
							<MenuItem key={opt} value={opt}>
								{opt}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ ...selectSx, minWidth: 200 }}>
					<InputLabel shrink>Approve by production</InputLabel>
					<Select value={activeApprove} label="Approve by production" onChange={e => handleApproveChange(e.target.value)}>
						{approveOptions.map(opt => (
							<MenuItem key={opt} value={opt}>
								{opt}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</MasterListToolbar>
	);
};

export default InspectionManagement;
