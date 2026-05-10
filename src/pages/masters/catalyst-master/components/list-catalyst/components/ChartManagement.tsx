import { useState, useMemo, useCallback } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { MasterListToolbar } from '../../../../../../components/masters';

export const CHART_ALL_SUPPLIERS = 'All suppliers';

interface ChartManagementProps {
	onSearchChange?: (searchTerm: string) => void;
	onFilterChange?: (filter: string) => void;
	onSupplierFilterChange?: (supplier: string) => void;
	appliedSearchTerm?: string;
	supplierOptions?: string[];
	listSummary?: string | null;
	searchAriaLabel?: string;
}

const ChartManagement = ({
	onSearchChange,
	onFilterChange,
	onSupplierFilterChange,
	appliedSearchTerm = '',
	supplierOptions = [],
	listSummary,
	searchAriaLabel
}: ChartManagementProps) => {
	const [activeFilter, setActiveFilter] = useState('All Charts');
	const [activeSupplier, setActiveSupplier] = useState(CHART_ALL_SUPPLIERS);

	const statusOptions = ['All Charts', 'ACTIVE', 'INACTIVE'];
	const supplierChoices = [CHART_ALL_SUPPLIERS, ...supplierOptions];

	const handleStatusChange = (filter: string) => {
		setActiveFilter(filter);
		onFilterChange?.(filter);
	};

	const handleSupplierChange = (value: string) => {
		setActiveSupplier(value);
		onSupplierFilterChange?.(value);
	};

	const handleReset = useCallback(() => {
		setActiveFilter('All Charts');
		setActiveSupplier(CHART_ALL_SUPPLIERS);
		onFilterChange?.('All Charts');
		onSupplierFilterChange?.(CHART_ALL_SUPPLIERS);
	}, [onFilterChange, onSupplierFilterChange]);

	const filterDirty = useMemo(
		() =>
			Boolean(appliedSearchTerm.trim()) || activeFilter !== 'All Charts' || activeSupplier !== CHART_ALL_SUPPLIERS,
		[activeFilter, activeSupplier, appliedSearchTerm]
	);

	const selectSx = { minWidth: 180, borderRadius: 1 };

	return (
		<Box>
			<MasterListToolbar
				searchPlaceholder="Search by Chart ID or notes"
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
				<FormControl size="small" sx={{ ...selectSx, minWidth: 200 }}>
					<InputLabel shrink>Chart supplier</InputLabel>
					<Select value={activeSupplier} label="Chart supplier" onChange={e => handleSupplierChange(e.target.value)}>
						{supplierChoices.map(opt => (
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

export default ChartManagement;
