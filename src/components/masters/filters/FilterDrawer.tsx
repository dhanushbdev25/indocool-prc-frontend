import { useMemo, useState } from 'react';
import {
	Box,
	Button,
	Divider,
	Drawer,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Typography,
	useMediaQuery
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import FilterAutocomplete from './FilterAutocomplete';
import FilterDateRange from './FilterDateRange';
import { EMPTY_DATE_RANGE, isDateRangeValue, isStringArrayValue, type FilterFieldConfig, type FilterValue } from './types';
import { countActiveFilters } from './filterHelpers';

interface FilterDrawerProps {
	open: boolean;
	onClose: () => void;
	title?: string;
	searchPlaceholder: string;
	searchTerm: string;
	fields: FilterFieldConfig[];
	values: Record<string, FilterValue | undefined>;
	onApply: (next: { searchTerm: string; values: Record<string, FilterValue> }) => void;
	onReset: () => void;
}

interface FilterDrawerFormProps {
	title: string;
	searchPlaceholder: string;
	initialSearch: string;
	fields: FilterFieldConfig[];
	initialValues: Record<string, FilterValue | undefined>;
	onApply: (next: { searchTerm: string; values: Record<string, FilterValue> }) => void;
	onReset: () => void;
	onClose: () => void;
}

const buildInitialDraftValues = (
	fields: FilterFieldConfig[],
	values: Record<string, FilterValue | undefined>
): Record<string, FilterValue> => {
	const init: Record<string, FilterValue> = {};
	for (const field of fields) {
		const current = values[field.key];
		if (field.kind === 'autocomplete') {
			init[field.key] = isStringArrayValue(current) ? current : [];
		} else if (field.kind === 'dateRange') {
			init[field.key] = isDateRangeValue(current) ? current : EMPTY_DATE_RANGE;
		}
	}
	return init;
};

const FilterDrawerForm = ({
	title,
	searchPlaceholder,
	initialSearch,
	fields,
	initialValues,
	onApply,
	onReset,
	onClose
}: FilterDrawerFormProps) => {
	const theme = useTheme();
	const [draftSearch, setDraftSearch] = useState(initialSearch);
	const [draftValues, setDraftValues] = useState<Record<string, FilterValue>>(() =>
		buildInitialDraftValues(fields, initialValues)
	);

	const draftActiveCount = useMemo(
		() => countActiveFilters(draftValues) + (draftSearch.trim() ? 1 : 0),
		[draftValues, draftSearch]
	);

	const clearDraft = () => {
		setDraftSearch('');
		const cleared: Record<string, FilterValue> = {};
		for (const field of fields) {
			cleared[field.key] = field.kind === 'autocomplete' ? [] : EMPTY_DATE_RANGE;
		}
		setDraftValues(cleared);
	};

	const handleApply = () => {
		onApply({ searchTerm: draftSearch.trim(), values: draftValues });
		onClose();
	};

	const handleClearAndApply = () => {
		clearDraft();
		onReset();
		onClose();
	};

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					px: 2.5,
					py: 2,
					borderBottom: 1,
					borderBottomColor: 'divider'
				}}
			>
				<Stack direction="row" spacing={1.25} alignItems="center">
					<Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '0.01em' }}>
						{title}
					</Typography>
					{draftActiveCount > 0 ? (
						<Box
							sx={{
								px: 1,
								py: 0.25,
								borderRadius: 1,
								backgroundColor: alpha(theme.palette.primary.main, 0.1),
								color: 'primary.main',
								fontSize: '0.75rem',
								fontWeight: 700
							}}
						>
							{draftActiveCount}
						</Box>
					) : null}
				</Stack>
				<IconButton size="small" onClick={onClose} aria-label="Close filters">
					<CloseIcon fontSize="small" />
				</IconButton>
			</Box>

			<Box sx={{ px: 2.5, py: 2.5, overflowY: 'auto', flex: 1 }}>
				<Stack spacing={2.5}>
					<Box>
						<Typography
							variant="caption"
							sx={{
								display: 'block',
								color: 'text.secondary',
								fontWeight: 600,
								mb: 0.75,
								letterSpacing: '0.02em'
							}}
						>
							Search
						</Typography>
						<TextField
							placeholder={searchPlaceholder}
							value={draftSearch}
							onChange={e => setDraftSearch(e.target.value)}
							size="small"
							fullWidth
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} aria-hidden />
									</InputAdornment>
								),
								endAdornment: draftSearch ? (
									<InputAdornment position="end">
										<IconButton size="small" onClick={() => setDraftSearch('')} aria-label="Clear search">
											<CloseIcon fontSize="small" />
										</IconButton>
									</InputAdornment>
								) : null
							}}
							sx={{
								'& .MuiOutlinedInput-root': { borderRadius: 1.5 }
							}}
						/>
					</Box>

					<Divider sx={{ borderColor: 'divider' }} />

					{fields.map(field => {
						if (field.kind === 'autocomplete') {
							const current = draftValues[field.key];
							const value = isStringArrayValue(current) ? current : [];
							return (
								<FilterAutocomplete
									key={field.key}
									label={field.label}
									placeholder={field.placeholder}
									options={field.options}
									value={value}
									onChange={next => setDraftValues(prev => ({ ...prev, [field.key]: next }))}
								/>
							);
						}
						if (field.kind === 'dateRange') {
							const current = draftValues[field.key];
							const value = isDateRangeValue(current) ? current : EMPTY_DATE_RANGE;
							return (
								<FilterDateRange
									key={field.key}
									label={field.label}
									value={value}
									onChange={next => setDraftValues(prev => ({ ...prev, [field.key]: next }))}
								/>
							);
						}
						return null;
					})}
				</Stack>
			</Box>

			<Box
				sx={{
					px: 2.5,
					py: 2,
					borderTop: 1,
					borderTopColor: 'divider',
					backgroundColor: theme.palette.background.paper,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: 1.5
				}}
			>
				<Button
					size="small"
					variant="text"
					color="inherit"
					onClick={handleClearAndApply}
					sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
				>
					Clear all
				</Button>
				<Stack direction="row" spacing={1.25}>
					<Button
						size="small"
						variant="outlined"
						color="inherit"
						onClick={clearDraft}
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderColor: 'divider',
							color: 'text.primary'
						}}
					>
						Reset
					</Button>
					<Button
						size="small"
						variant="contained"
						color="primary"
						onClick={handleApply}
						sx={{ textTransform: 'none', fontWeight: 700, px: 2.5, borderRadius: 1.5 }}
					>
						Apply
					</Button>
				</Stack>
			</Box>
		</>
	);
};

const FilterDrawer = ({
	open,
	onClose,
	title = 'Filters',
	searchPlaceholder,
	searchTerm,
	fields,
	values,
	onApply,
	onReset
}: FilterDrawerProps) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

	const drawerWidth = isSmall ? '100vw' : 420;

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: drawerWidth,
					maxWidth: '100vw',
					backgroundColor: theme.palette.background.paper
				}
			}}
		>
			{open ? (
				<FilterDrawerForm
					title={title}
					searchPlaceholder={searchPlaceholder}
					initialSearch={searchTerm}
					fields={fields}
					initialValues={values}
					onApply={onApply}
					onReset={onReset}
					onClose={onClose}
				/>
			) : null}
		</Drawer>
	);
};

export default FilterDrawer;
