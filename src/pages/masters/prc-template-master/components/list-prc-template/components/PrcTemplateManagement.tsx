import { useState, useMemo, useCallback } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { MasterListToolbar } from '../../../../../../components/masters';

/** Sentinel for toolbar: no filter by template `isActive`. */
export const PRC_TEMPLATE_ALL_CATALOGUE = 'All';

interface PrcTemplateManagementProps {
	onSearchChange?: (searchTerm: string) => void;
	onFilterChange?: (filter: string) => void;
	onCatalogueActiveFilterChange?: (value: string) => void;
	appliedSearchTerm?: string;
	listSummary?: string | null;
	searchAriaLabel?: string;
}

const PrcTemplateManagement = ({
	onSearchChange,
	onFilterChange,
	onCatalogueActiveFilterChange,
	appliedSearchTerm = '',
	listSummary,
	searchAriaLabel
}: PrcTemplateManagementProps) => {
	const [activeFilter, setActiveFilter] = useState('All Templates');
	const [catalogueFilter, setCatalogueFilter] = useState(PRC_TEMPLATE_ALL_CATALOGUE);

	const statusOptions = ['All Templates', 'ACTIVE', 'NEW', 'INACTIVE'];
	const catalogueOptions = [PRC_TEMPLATE_ALL_CATALOGUE, 'In catalogue', 'Out of catalogue'];

	const handleStatusChange = (filter: string) => {
		setActiveFilter(filter);
		onFilterChange?.(filter);
	};

	const handleCatalogueChange = (value: string) => {
		setCatalogueFilter(value);
		onCatalogueActiveFilterChange?.(value);
	};

	const handleReset = useCallback(() => {
		setActiveFilter('All Templates');
		setCatalogueFilter(PRC_TEMPLATE_ALL_CATALOGUE);
		onFilterChange?.('All Templates');
		onCatalogueActiveFilterChange?.(PRC_TEMPLATE_ALL_CATALOGUE);
	}, [onCatalogueActiveFilterChange, onFilterChange]);

	const filterDirty = useMemo(
		() =>
			Boolean(appliedSearchTerm.trim()) ||
			activeFilter !== 'All Templates' ||
			catalogueFilter !== PRC_TEMPLATE_ALL_CATALOGUE,
		[activeFilter, appliedSearchTerm, catalogueFilter]
	);

	const selectSx = { minWidth: 180, borderRadius: 1 };

	return (
		<Box>
			<MasterListToolbar
				searchPlaceholder="Search by Template ID or name"
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
					<InputLabel shrink>Catalogue</InputLabel>
					<Select value={catalogueFilter} label="Catalogue" onChange={e => handleCatalogueChange(e.target.value)}>
						{catalogueOptions.map(opt => (
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

export default PrcTemplateManagement;
