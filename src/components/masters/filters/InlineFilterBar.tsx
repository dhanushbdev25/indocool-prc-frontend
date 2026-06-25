import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import {
	Box,
	Button,
	ButtonBase,
	Collapse,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
	Close as CloseIcon,
	ExpandLess as ExpandLessIcon,
	ExpandMore as ExpandMoreIcon,
	FilterAltOutlined as FilterIcon,
	Search as SearchIcon
} from '@mui/icons-material';
import FilterAutocomplete from './FilterAutocomplete';
import FilterDateRange from './FilterDateRange';
import FilterDateRangePreset from './FilterDateRangePreset';
import { EMPTY_DATE_RANGE, isDateRangeValue, isStringArrayValue, type FilterFieldConfig, type FilterValue } from './types';
import { areFiltersEqual, buildClearedValues, buildInitialDraftValues, countActiveFilters } from './filterHelpers';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { dashboardFilterField } from '../../../pages/dashboard/constants/dashboardTokens';

export interface InlineFilterBarProps {
	title?: string;
	searchPlaceholder: string;
	/** Applied search term (controlled by parent). */
	searchTerm: string;
	fields: FilterFieldConfig[];
	/** Applied filter values (controlled by parent). */
	values: Record<string, FilterValue | undefined>;
	/** Called when the debounced search input changes — bypasses Apply. */
	onSearchChange: (term: string) => void;
	/** Called when the user clicks Apply or presses Enter inside the bar. */
	onApply: (next: { values: Record<string, FilterValue> }) => void;
	/** Called when the user clicks Reset — clears all applied + draft filters and search. */
	onReset: () => void;
	/** Hide the search field when the screen has no full-text search. */
	hideSearch?: boolean;
	/** Search debounce delay. */
	debounceMs?: number;
}

const CONTROL_HEIGHT = 40;

const InlineFilterBar = ({
	title = 'Filters',
	searchPlaceholder,
	searchTerm,
	fields,
	values,
	onSearchChange,
	onApply,
	onReset,
	hideSearch = false,
	debounceMs = 280
}: InlineFilterBarProps) => {
	const theme = useTheme();
	const hairlineHover = alpha(theme.palette.text.primary, 0.04);
	const mutedText = alpha(theme.palette.text.primary, 0.6);

	const [isExpanded, setIsExpanded] = useState(true);

	const [searchDraft, setSearchDraft] = useState(searchTerm);
	useEffect(() => {
		setSearchDraft(searchTerm);
	}, [searchTerm]);
	const debouncedSearch = useDebouncedValue(searchDraft, debounceMs);
	useEffect(() => {
		if (debouncedSearch !== searchTerm) {
			onSearchChange(debouncedSearch);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch]);

	const [draftValues, setDraftValues] = useState<Record<string, FilterValue>>(() =>
		buildInitialDraftValues(fields, values)
	);

	useEffect(() => {
		setDraftValues(buildInitialDraftValues(fields, values));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [values]);

	const isDirty = useMemo(() => !areFiltersEqual(draftValues, values), [draftValues, values]);

	const activeCount = useMemo(
		() => countActiveFilters(values) + (searchTerm.trim() ? 1 : 0),
		[values, searchTerm]
	);

	const hasAppliedFilters = useMemo(() => {
		for (const field of fields) {
			const v = values[field.key];
			if (v === undefined || v === null) continue;
			if (isStringArrayValue(v) && v.length > 0) return true;
			if (isDateRangeValue(v) && (v.from || v.to)) return true;
			if (typeof v === 'string' && v.trim()) return true;
		}
		return Boolean(searchTerm.trim());
	}, [fields, values, searchTerm]);

	const handleApply = useCallback(() => {
		if (!isDirty) return;
		onApply({ values: draftValues });
	}, [isDirty, draftValues, onApply]);

	const handleReset = useCallback(() => {
		const cleared = buildClearedValues(fields);
		setDraftValues(cleared);
		setSearchDraft('');
		onReset();
	}, [fields, onReset]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLDivElement>) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				handleApply();
			}
		},
		[handleApply]
	);

	const renderField = (field: FilterFieldConfig) => {
		if (field.kind === 'autocomplete') {
			const current = draftValues[field.key];
			const value = isStringArrayValue(current) ? current : [];
			return (
				<FilterAutocomplete
					label={field.label}
					placeholder={field.placeholder}
					options={field.options}
					value={value}
					onChange={next => setDraftValues(prev => ({ ...prev, [field.key]: next }))}
					compactDisplay
					sx={dashboardFilterField}
				/>
			);
		}
		if (field.kind === 'dateRange') {
			const current = draftValues[field.key];
			const value = isDateRangeValue(current) ? current : EMPTY_DATE_RANGE;
			return (
				<FilterDateRange
					label={field.label}
					value={value}
					onChange={next => setDraftValues(prev => ({ ...prev, [field.key]: next }))}
				/>
			);
		}
		if (field.kind === 'dateRangePreset') {
			const current = draftValues[field.key];
			const value = isDateRangeValue(current) ? current : EMPTY_DATE_RANGE;
			const rawPresetId = draftValues[field.presetKey];
			const customId = field.customPresetId ?? 'custom';
			const presetId =
				typeof rawPresetId === 'string' && rawPresetId ? rawPresetId : (field.defaultPresetId ?? customId);
			return (
				<FilterDateRangePreset
					label={field.label}
					value={value}
					presetId={presetId}
					presets={field.presets}
					customPresetId={customId}
					onChange={next =>
						setDraftValues(prev => ({
							...prev,
							[field.key]: next.value,
							[field.presetKey]: next.presetId
						}))
					}
				/>
			);
		}
		return null;
	};

	const panelSx = {
		borderRadius: '12px',
		border: `1px solid ${theme.palette.divider}`,
		backgroundColor: theme.palette.background.paper,
		boxShadow:
			theme.palette.mode === 'dark'
				? 'none'
				: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`
	};

	return (
		<Box
			role="search"
			aria-label={`${title} filter bar`}
			onKeyDown={handleKeyDown}
			sx={panelSx}
		>
			{/* Accordion header — click strip toggles the body */}
			<ButtonBase
				onClick={() => setIsExpanded(open => !open)}
				aria-expanded={isExpanded}
				aria-controls="inline-filter-bar-body"
				sx={{
					width: '100%',
					px: { xs: 2, sm: 2.5 },
					py: 1.25,
					borderBottom: isExpanded ? 1 : 0,
					borderBottomColor: 'divider',
					justifyContent: 'space-between',
					transition: 'background-color 0.15s ease',
					'&:hover': { backgroundColor: hairlineHover }
				}}
			>
				<Stack direction="row" alignItems="center" spacing={1} sx={{ color: mutedText }}>
					<FilterIcon sx={{ fontSize: '1.125rem' }} />
					<Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', letterSpacing: '-0.005em' }}>
						{title}
					</Typography>
					{activeCount > 0 ? (
						<Box
							component="span"
							sx={{
								ml: 0.5,
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								minWidth: 20,
								height: 20,
								px: 0.75,
								borderRadius: '999px',
								fontSize: '0.6875rem',
								fontWeight: 700,
								color: 'primary.main',
								backgroundColor: alpha(theme.palette.primary.main, 0.1)
							}}
						>
							{activeCount}
						</Box>
					) : null}
				</Stack>
				{isExpanded ? (
					<ExpandLessIcon sx={{ fontSize: '1.25rem', color: mutedText }} aria-hidden />
				) : (
					<ExpandMoreIcon sx={{ fontSize: '1.25rem', color: mutedText }} aria-hidden />
				)}
			</ButtonBase>

			<Collapse in={isExpanded} id="inline-filter-bar-body" unmountOnExit={false}>
			<form
				onSubmit={e => {
					e.preventDefault();
					handleApply();
				}}
				style={{ display: 'block' }}
			>
				<Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 } }}>
					{/* Row 1: search */}
					{!hideSearch ? (
						<TextField
							placeholder={searchPlaceholder}
							value={searchDraft}
							onChange={e => setSearchDraft(e.target.value)}
							size="small"
							fullWidth
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} aria-hidden />
									</InputAdornment>
								),
								endAdornment: searchDraft ? (
									<InputAdornment position="end">
										<Tooltip title="Clear search">
											<IconButton
												size="small"
												aria-label="Clear search"
												onClick={() => setSearchDraft('')}
												edge="end"
											>
												<CloseIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									</InputAdornment>
								) : null
							}}
							inputProps={{ 'aria-label': searchPlaceholder, autoComplete: 'off' }}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '10px',
									minHeight: CONTROL_HEIGHT,
									backgroundColor: theme.palette.background.paper,
									boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
									'& fieldset': { borderColor: alpha(theme.palette.divider, 0.9) },
									'&:hover fieldset': { borderColor: alpha(theme.palette.grey[500], 0.35) },
									'&.Mui-focused': {
										boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)}, 0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
										'& fieldset': {
											borderColor: alpha(theme.palette.primary.main, 0.35),
											borderWidth: 1
										}
									}
								},
								'& .MuiOutlinedInput-input': {
									py: 1,
									fontSize: '0.875rem',
									fontWeight: 500
								}
							}}
						/>
					) : null}

					{/* Row 2: filter grid */}
					{fields.length > 0 ? (
						<Box
							sx={{
								mt: !hideSearch ? { xs: 1.5, sm: 1.75 } : 0,
								display: 'grid',
								gridTemplateColumns: {
									xs: '1fr',
									sm: 'repeat(2, minmax(0, 1fr))',
									md: 'repeat(3, minmax(0, 1fr))',
									lg: 'repeat(4, minmax(0, 1fr))'
								},
								gap: { xs: 1.25, sm: 1.5 }
							}}
						>
							{fields.map(field => (
								<Box key={field.key}>{renderField(field)}</Box>
							))}
						</Box>
					) : null}

					{/* Row 3: Reset / Apply right-aligned */}
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="flex-end"
						spacing={1}
						sx={{ mt: { xs: 1.5, sm: 1.75 }, flexWrap: 'wrap', rowGap: 1 }}
					>
						<Button
							size="small"
							variant="outlined"
							color="inherit"
							onClick={handleReset}
							disabled={!isDirty && !hasAppliedFilters}
							sx={{
								textTransform: 'none',
								fontWeight: 600,
								fontSize: '0.8125rem',
								borderColor: 'divider',
								color: 'text.primary',
								height: CONTROL_HEIGHT,
								px: 2,
								borderRadius: '10px',
								'&:hover': {
									borderColor: 'text.secondary',
									backgroundColor: hairlineHover
								}
							}}
						>
							Reset
						</Button>
						<Button
							type="submit"
							size="small"
							variant="contained"
							color="primary"
							onClick={handleApply}
							disabled={!isDirty}
							aria-label="Apply filters"
							sx={{
								textTransform: 'none',
								fontWeight: 700,
								fontSize: '0.8125rem',
								height: CONTROL_HEIGHT,
								px: 2.5,
								borderRadius: '10px',
								boxShadow: 'none',
								'&:hover': { boxShadow: 'none' }
							}}
						>
							Apply
						</Button>
					</Stack>
				</Box>
			</form>
			</Collapse>
		</Box>
	);
};

export default InlineFilterBar;
