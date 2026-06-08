import { useMemo, useState, useCallback } from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import FilterDrawer from './FilterDrawer';
import {
	EMPTY_DATE_RANGE,
	isDateRangeValue,
	isFilterValueEmpty,
	isStringArrayValue,
	type FilterFieldConfig,
	type FilterValue
} from './types';

interface MasterFilterToolbarProps {
	title?: string;
	searchPlaceholder: string;
	searchTerm: string;
	fields: FilterFieldConfig[];
	values: Record<string, FilterValue | undefined>;
	/** Page actions (Add, Refresh, etc.) rendered inline at the far right. */
	actions?: React.ReactNode;
	onSearchChange: (term: string) => void;
	onFiltersChange: (next: Record<string, FilterValue>) => void;
}

const formatDateLabel = (iso: string | null): string => {
	if (!iso) return '';
	const d = dayjs(iso);
	return d.isValid() ? d.format('DD MMM YYYY') : '';
};

interface ChipDescriptor {
	id: string;
	field: string;
	value: string;
	onDelete: () => void;
}

/**
 * Inline filter rail inspired by Linear / Stripe / Vercel:
 * - No card, no shadow, no badge — a single 32px row separated by a hairline divider.
 * - Active filters render as text pills: muted label + bold value + hover-revealed ×.
 * - "+ Filter" trigger sits at the end of the chip row, becomes "Filter · N" when active.
 */
const MasterFilterToolbar = ({
	title,
	searchPlaceholder,
	searchTerm,
	fields,
	values,
	actions,
	onSearchChange,
	onFiltersChange
}: MasterFilterToolbarProps) => {
	const theme = useTheme();
	const [open, setOpen] = useState(false);

	const handleApply = useCallback(
		({ searchTerm: nextSearch, values: nextValues }: { searchTerm: string; values: Record<string, FilterValue> }) => {
			onSearchChange(nextSearch);
			onFiltersChange(nextValues);
		},
		[onSearchChange, onFiltersChange]
	);

	const handleResetAll = useCallback(() => {
		onSearchChange('');
		const cleared: Record<string, FilterValue> = {};
		for (const field of fields) {
			cleared[field.key] = field.kind === 'autocomplete' ? [] : EMPTY_DATE_RANGE;
		}
		onFiltersChange(cleared);
	}, [fields, onSearchChange, onFiltersChange]);

	const handleClearSearch = useCallback(() => {
		onSearchChange('');
	}, [onSearchChange]);

	const handleRemoveChip = useCallback(
		(key: string, valueToRemove?: string) => {
			const field = fields.find(f => f.key === key);
			if (!field) return;
			const next = { ...values };
			if (field.kind === 'autocomplete' && valueToRemove !== undefined) {
				const current = values[key];
				const arr = isStringArrayValue(current) ? current : [];
				next[key] = arr.filter(v => v !== valueToRemove);
			} else if (field.kind === 'dateRange') {
				next[key] = EMPTY_DATE_RANGE;
			} else {
				next[key] = [];
			}
			onFiltersChange(next as Record<string, FilterValue>);
		},
		[fields, values, onFiltersChange]
	);

	const chips = useMemo<ChipDescriptor[]>(() => {
		const out: ChipDescriptor[] = [];

		if (searchTerm.trim()) {
			out.push({
				id: '__search__',
				field: 'Search',
				value: searchTerm.trim(),
				onDelete: handleClearSearch
			});
		}

		for (const field of fields) {
			const v = values[field.key];
			if (isFilterValueEmpty(v)) continue;

			if (field.kind === 'autocomplete' && isStringArrayValue(v)) {
				for (const item of v) {
					out.push({
						id: `${field.key}:${item}`,
						field: field.label,
						value: item,
						onDelete: () => handleRemoveChip(field.key, item)
					});
				}
			} else if (field.kind === 'dateRange' && isDateRangeValue(v)) {
				const from = formatDateLabel(v.from);
				const to = formatDateLabel(v.to);
				const valueLabel = from && to ? `${from} – ${to}` : from ? `from ${from}` : `until ${to}`;
				out.push({
					id: field.key,
					field: field.label,
					value: valueLabel,
					onDelete: () => handleRemoveChip(field.key)
				});
			}
		}

		return out;
	}, [fields, values, searchTerm, handleClearSearch, handleRemoveChip]);

	const hasChips = chips.length > 0;
	const mutedText = alpha(theme.palette.text.primary, 0.55);
	const hairlineHover = alpha(theme.palette.text.primary, 0.04);

	return (
		<Box
			sx={{
				position: 'sticky',
				top: 0,
				zIndex: 11,
				backgroundColor: theme.palette.background.default,
				borderBottom: 1,
				borderBottomColor: 'divider'
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				sx={{
					px: { xs: 1.25, sm: 1.5 },
					height: 36,
					gap: 0
				}}
			>
				<Box
					sx={{
						flex: 1,
						minWidth: 0,
						display: 'flex',
						alignItems: 'center',
						gap: 0.25,
						overflowX: 'auto',
						scrollbarWidth: 'none',
						'&::-webkit-scrollbar': { display: 'none' }
					}}
				>
					{chips.map(chip => (
						<Box
							key={chip.id}
							sx={{
								display: 'inline-flex',
								alignItems: 'center',
								flexShrink: 0,
								height: 22,
								borderRadius: 0.5,
								pl: 0.75,
								pr: 0.25,
								gap: 0.5,
								color: 'text.primary',
								'&:hover': { backgroundColor: hairlineHover },
								'&:hover .chip-x': { opacity: 1 }
							}}
						>
							<Typography component="span" sx={{ fontSize: '0.75rem', color: mutedText, lineHeight: 1 }}>
								{chip.field}
							</Typography>
							<Typography
								component="span"
								sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}
							>
								{chip.value}
							</Typography>
							<ButtonBase
								className="chip-x"
								onClick={chip.onDelete}
								aria-label={`Remove ${chip.field} ${chip.value}`}
								sx={{
									width: 14,
									height: 14,
									borderRadius: '50%',
									opacity: 0.55,
									color: mutedText,
									transition: 'opacity 80ms ease, color 80ms ease',
									'&:hover': { color: 'text.primary', opacity: 1 }
								}}
							>
								<CloseIcon sx={{ fontSize: '0.75rem' }} />
							</ButtonBase>
						</Box>
					))}

					<ButtonBase
						onClick={() => setOpen(true)}
						aria-label={`Open ${title?.toLowerCase() ?? 'filters'}`}
						sx={{
							ml: hasChips ? 0.5 : 0,
							height: 22,
							px: 0.75,
							borderRadius: 0.5,
							color: mutedText,
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.25,
							fontSize: '0.75rem',
							fontWeight: 500,
							letterSpacing: '0.005em',
							flexShrink: 0,
							'&:hover': { color: 'text.primary', backgroundColor: hairlineHover }
						}}
					>
						<AddIcon sx={{ fontSize: '0.875rem' }} />
						{hasChips ? 'Filter' : (title ?? 'Filter')}
					</ButtonBase>
				</Box>

				{hasChips ? (
					<ButtonBase
						onClick={handleResetAll}
						aria-label="Clear all filters"
						sx={{
							ml: 1,
							height: 22,
							px: 0.75,
							borderRadius: 0.5,
							color: mutedText,
							fontSize: '0.75rem',
							fontWeight: 500,
							flexShrink: 0,
							'&:hover': { color: 'text.primary', backgroundColor: hairlineHover }
						}}
					>
						Clear
					</ButtonBase>
				) : null}

				{actions ? (
					<Box sx={{ ml: 1.5, display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>{actions}</Box>
				) : null}
			</Stack>

			<FilterDrawer
				open={open}
				onClose={() => setOpen(false)}
				title={title}
				searchPlaceholder={searchPlaceholder}
				searchTerm={searchTerm}
				fields={fields}
				values={values}
				onApply={handleApply}
				onReset={handleResetAll}
			/>
		</Box>
	);
};

export default MasterFilterToolbar;
