import { Box, Chip, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import type { FilterFieldConfig, FilterValue } from './types';
import { isDateRangeValue, isFilterValueEmpty, isStringArrayValue } from './types';

interface ActiveFilterChipsProps {
	searchTerm: string;
	fields: FilterFieldConfig[];
	values: Record<string, FilterValue | undefined>;
	onClearSearch: () => void;
	onRemove: (key: string, valueToRemove?: string) => void;
	onClearAll: () => void;
}

const formatDateLabel = (iso: string | null): string => {
	if (!iso) return '';
	const d = dayjs(iso);
	return d.isValid() ? d.format('DD MMM YYYY') : '';
};

const ActiveFilterChips = ({ searchTerm, fields, values, onClearSearch, onRemove, onClearAll }: ActiveFilterChipsProps) => {
	const chips: React.ReactNode[] = [];

	if (searchTerm.trim()) {
		chips.push(
			<Chip
				key="__search__"
				label={`Search: "${searchTerm}"`}
				size="small"
				onDelete={onClearSearch}
				sx={{ borderRadius: 1, fontWeight: 500 }}
			/>
		);
	}

	for (const field of fields) {
		const v = values[field.key];
		if (isFilterValueEmpty(v)) continue;

		if (field.kind === 'autocomplete' && isStringArrayValue(v)) {
			for (const item of v) {
				chips.push(
					<Chip
						key={`${field.key}:${item}`}
						label={`${field.label}: ${item}`}
						size="small"
						onDelete={() => onRemove(field.key, item)}
						sx={{ borderRadius: 1, fontWeight: 500 }}
					/>
				);
			}
		} else if (field.kind === 'dateRange' && isDateRangeValue(v)) {
			const from = formatDateLabel(v.from);
			const to = formatDateLabel(v.to);
			const label =
				from && to
					? `${field.label}: ${from} – ${to}`
					: from
						? `${field.label}: from ${from}`
						: `${field.label}: until ${to}`;
			chips.push(
				<Chip
					key={field.key}
					label={label}
					size="small"
					onDelete={() => onRemove(field.key)}
					sx={{ borderRadius: 1, fontWeight: 500 }}
				/>
			);
		}
	}

	if (chips.length === 0) return null;

	return (
		<Box sx={{ py: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
			<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ flex: 1, minWidth: 0 }}>
				{chips}
			</Stack>
			<Typography
				component="button"
				type="button"
				onClick={onClearAll}
				sx={{
					all: 'unset',
					cursor: 'pointer',
					fontSize: '0.8125rem',
					fontWeight: 600,
					color: 'primary.main',
					'&:hover': { textDecoration: 'underline' }
				}}
			>
				Clear all
			</Typography>
		</Box>
	);
};

export default ActiveFilterChips;
