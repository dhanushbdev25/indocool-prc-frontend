import { useState, useMemo, useCallback } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { MasterListToolbar } from '../../../../../../components/masters';

export const SEQUENCE_ALL_ITEMS = 'All items';

interface SequenceManagementProps {
	onSearchChange?: (searchTerm: string) => void;
	onFilterChange?: (filter: string) => void;
	onTypeFilterChange?: (typeFilter: string) => void;
	onCategoryFilterChange?: (category: string) => void;
	onItemFilterChange?: (item: string) => void;
	appliedSearchTerm?: string;
	categoryOptions?: string[];
	itemOptions?: string[];
	listSummary?: string | null;
	searchAriaLabel?: string;
}

const SequenceManagement = ({
	onSearchChange,
	onFilterChange,
	onTypeFilterChange,
	onCategoryFilterChange,
	onItemFilterChange,
	appliedSearchTerm = '',
	categoryOptions = [],
	itemOptions = [],
	listSummary,
	searchAriaLabel
}: SequenceManagementProps) => {
	const [activeFilter, setActiveFilter] = useState('All Sequences');
	const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
	const [activeCategory, setActiveCategory] = useState('All categories');
	const [activeItem, setActiveItem] = useState(SEQUENCE_ALL_ITEMS);

	const filterButtons = ['All Sequences', 'ACTIVE', 'INACTIVE'];
	const typeFilterButtons = ['All Types', 'Layout', 'ISP'];
	const categoryFilterButtons = ['All categories', ...categoryOptions];
	const itemFilterButtons = [SEQUENCE_ALL_ITEMS, ...itemOptions];

	const handleFilterClick = (filter: string) => {
		setActiveFilter(filter);
		onFilterChange?.(filter);
	};

	const handleTypeFilterClick = (typeFilter: string) => {
		setActiveTypeFilter(typeFilter);
		onTypeFilterChange?.(typeFilter);
	};

	const handleCategoryFilterClick = (category: string) => {
		setActiveCategory(category);
		onCategoryFilterChange?.(category);
	};

	const handleItemFilterClick = (item: string) => {
		setActiveItem(item);
		onItemFilterChange?.(item);
	};

	const handleReset = useCallback(() => {
		setActiveFilter('All Sequences');
		setActiveTypeFilter('All Types');
		setActiveCategory('All categories');
		setActiveItem(SEQUENCE_ALL_ITEMS);
		onFilterChange?.('All Sequences');
		onTypeFilterChange?.('All Types');
		onCategoryFilterChange?.('All categories');
		onItemFilterChange?.(SEQUENCE_ALL_ITEMS);
	}, [onCategoryFilterChange, onFilterChange, onItemFilterChange, onTypeFilterChange]);

	const filterDirty = useMemo(
		() =>
			Boolean(appliedSearchTerm.trim()) ||
			activeFilter !== 'All Sequences' ||
			activeTypeFilter !== 'All Types' ||
			activeCategory !== 'All categories' ||
			activeItem !== SEQUENCE_ALL_ITEMS,
		[appliedSearchTerm, activeCategory, activeFilter, activeItem, activeTypeFilter]
	);

	const selectSx = { minWidth: 140, borderRadius: 1 };

	return (
		<Box>
			<MasterListToolbar
				searchPlaceholder="Sequence ID, name, category, item, type, or notes"
				searchAriaLabel={searchAriaLabel}
				listSummary={listSummary}
				onSearchChange={onSearchChange}
				filterDirty={filterDirty}
				onReset={handleReset}
			>
				<FormControl size="small" sx={selectSx}>
					<InputLabel shrink>Category</InputLabel>
					<Select value={activeCategory} label="Category" onChange={e => handleCategoryFilterClick(e.target.value)}>
						{categoryFilterButtons.map(cat => (
							<MenuItem key={cat} value={cat}>
								{cat}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={selectSx}>
					<InputLabel shrink>Status</InputLabel>
					<Select value={activeFilter} label="Status" onChange={e => handleFilterClick(e.target.value)}>
						{filterButtons.map(filter => (
							<MenuItem key={filter} value={filter}>
								{filter}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={selectSx}>
					<InputLabel shrink>Type</InputLabel>
					<Select value={activeTypeFilter} label="Type" onChange={e => handleTypeFilterClick(e.target.value)}>
						{typeFilterButtons.map(typeFilter => (
							<MenuItem key={typeFilter} value={typeFilter}>
								{typeFilter}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ ...selectSx, minWidth: 160 }}>
					<InputLabel shrink>Item</InputLabel>
					<Select value={activeItem} label="Item" onChange={e => handleItemFilterClick(e.target.value)}>
						{itemFilterButtons.map(it => (
							<MenuItem key={it} value={it}>
								{it}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</MasterListToolbar>
		</Box>
	);
};

export default SequenceManagement;
