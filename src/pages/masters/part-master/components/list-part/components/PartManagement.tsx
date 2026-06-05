import { useState, useMemo, useCallback } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { MasterListToolbar } from '../../../../../../components/masters';

export const PART_ALL_CUSTOMERS = 'All customers';

interface PartManagementProps {
	onSearchChange?: (searchTerm: string) => void;
	onFilterChange?: (filter: string) => void;
	onLayupFilterChange?: (value: string) => void;
	onModelFilterChange?: (value: string) => void;
	onCustomerFilterChange?: (value: string) => void;
	appliedSearchTerm?: string;
	layupOptions?: string[];
	modelOptions?: string[];
	customerOptions?: string[];
	listSummary?: string | null;
	searchAriaLabel?: string;
}

const PartManagement = ({
	onSearchChange,
	onFilterChange,
	onLayupFilterChange,
	onModelFilterChange,
	onCustomerFilterChange,
	appliedSearchTerm = '',
	layupOptions = [],
	modelOptions = [],
	customerOptions = [],
	listSummary,
	searchAriaLabel
}: PartManagementProps) => {
	const [activeFilter, setActiveFilter] = useState('All Parts');
	const [layup, setLayup] = useState('All layup types');
	const [model, setModel] = useState('All models');
	const [customer, setCustomer] = useState(PART_ALL_CUSTOMERS);

	const statusOptions = ['All Parts', 'ACTIVE', 'INACTIVE'];
	const layupChoices = ['All layup types', ...layupOptions];
	const modelChoices = ['All models', ...modelOptions];
	const customerChoices = [PART_ALL_CUSTOMERS, ...customerOptions];

	const handleStatusChange = (filter: string) => {
		setActiveFilter(filter);
		onFilterChange?.(filter);
	};

	const handleLayupChange = (value: string) => {
		setLayup(value);
		onLayupFilterChange?.(value);
	};

	const handleModelChange = (value: string) => {
		setModel(value);
		onModelFilterChange?.(value);
	};

	const handleCustomerChange = (value: string) => {
		setCustomer(value);
		onCustomerFilterChange?.(value);
	};

	const handleReset = useCallback(() => {
		setActiveFilter('All Parts');
		setLayup('All layup types');
		setModel('All models');
		setCustomer(PART_ALL_CUSTOMERS);
		onFilterChange?.('All Parts');
		onLayupFilterChange?.('All layup types');
		onModelFilterChange?.('All models');
		onCustomerFilterChange?.(PART_ALL_CUSTOMERS);
	}, [onCustomerFilterChange, onFilterChange, onLayupFilterChange, onModelFilterChange]);

	const filterDirty = useMemo(
		() =>
			Boolean(appliedSearchTerm.trim()) ||
			activeFilter !== 'All Parts' ||
			layup !== 'All layup types' ||
			model !== 'All models' ||
			customer !== PART_ALL_CUSTOMERS,
		[appliedSearchTerm, activeFilter, customer, layup, model]
	);

	const selectSx = { minWidth: 160, borderRadius: 1 };

	return (
		<Box>
			<MasterListToolbar
				searchPlaceholder="Part number, drawing, description, customer, SAP, layup, model"
				searchAriaLabel={searchAriaLabel}
				listSummary={listSummary}
				onSearchChange={onSearchChange}
				filterDirty={filterDirty}
				onReset={handleReset}
				filtersDefaultExpanded
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
					<InputLabel shrink>Layup type</InputLabel>
					<Select value={layup} label="Layup type" onChange={e => handleLayupChange(e.target.value as string)}>
						{layupChoices.map(o => (
							<MenuItem key={o} value={o}>
								{o}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={selectSx}>
					<InputLabel shrink>Model</InputLabel>
					<Select value={model} label="Model" onChange={e => handleModelChange(e.target.value as string)}>
						{modelChoices.map(o => (
							<MenuItem key={o} value={o}>
								{o}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ ...selectSx, minWidth: 200 }}>
					<InputLabel shrink>Customer</InputLabel>
					<Select value={customer} label="Customer" onChange={e => handleCustomerChange(e.target.value as string)}>
						{customerChoices.map(o => (
							<MenuItem key={o} value={o}>
								{o}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</MasterListToolbar>
		</Box>
	);
};

export default PartManagement;
