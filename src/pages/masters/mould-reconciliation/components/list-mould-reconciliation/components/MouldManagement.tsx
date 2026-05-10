import { useMemo, useCallback } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { MasterListToolbar } from '../../../../../../components/masters';

export const MOULD_ALL_PART_NUMBERS = 'All part numbers';

interface MouldManagementProps {
	activeFilter: string;
	partNumberFilter: string;
	partNumberOptions: string[];
	appliedSearchTerm?: string;
	onSearchChange: (searchTerm: string) => void;
	onFilterChange: (filter: string) => void;
	onPartNumberFilterChange: (partNumber: string) => void;
	listSummary?: string | null;
	searchAriaLabel?: string;
}

const MouldManagement = ({
	activeFilter,
	partNumberFilter,
	partNumberOptions,
	appliedSearchTerm = '',
	onSearchChange,
	onFilterChange,
	onPartNumberFilterChange,
	listSummary,
	searchAriaLabel
}: MouldManagementProps) => {
	const dueOptions = ['All Moulds', 'Due', 'Not due'];
	const partChoices = [MOULD_ALL_PART_NUMBERS, ...partNumberOptions];
	const partValue = partChoices.includes(partNumberFilter) ? partNumberFilter : MOULD_ALL_PART_NUMBERS;

	const handleReset = useCallback(() => {
		onFilterChange('All Moulds');
		onPartNumberFilterChange(MOULD_ALL_PART_NUMBERS);
	}, [onFilterChange, onPartNumberFilterChange]);

	const filterDirty = useMemo(
		() =>
			Boolean(appliedSearchTerm.trim()) ||
			activeFilter !== 'All Moulds' ||
			partNumberFilter !== MOULD_ALL_PART_NUMBERS,
		[activeFilter, appliedSearchTerm, partNumberFilter]
	);

	const selectSx = { minWidth: 200, borderRadius: 1 };

	return (
		<Box>
			<MasterListToolbar
				searchPlaceholder="Part code, mould ID, or SAP reference"
				searchAriaLabel={searchAriaLabel}
				listSummary={listSummary}
				onSearchChange={onSearchChange}
				filterDirty={filterDirty}
				onReset={handleReset}
			>
				<FormControl size="small" sx={{ ...selectSx, minWidth: 220 }}>
					<InputLabel shrink>Part number</InputLabel>
					<Select value={partValue} label="Part number" onChange={e => onPartNumberFilterChange(e.target.value)}>
						{partChoices.map(opt => (
							<MenuItem key={opt} value={opt}>
								{opt}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={selectSx}>
					<InputLabel shrink>Due status</InputLabel>
					<Select value={activeFilter} label="Due status" onChange={e => onFilterChange(e.target.value)}>
						{dueOptions.map(opt => (
							<MenuItem key={opt} value={opt}>
								{opt}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</MasterListToolbar>
		</Box>
	);
};

export default MouldManagement;
