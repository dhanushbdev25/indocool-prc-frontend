import { Box, Chip, Typography } from '@mui/material';
import type { ListConfig, ListSavedEntry } from '../../../../../types/list-config.types';
import { isListEntryDeviation, parseListSavedValue } from '../../../../../utils/listConfig';
import { formatAcceptanceRange } from '../../../../../components/masters/acceptanceRange';
import { formatTableCellDisplay } from '../../../../../utils/formatTableCellDisplay';
import {
	OK_NOT_OK_TYPE_KEY,
	formatOkNotOkValueForDisplay,
	getOkNotOkCommentPreviewLabel
} from '../../../../../utils/okNotOkLabels';

export interface ListValuePreviewProps {
	/** The saved answer: an array of entries (or the index-keyed object a re-save turns it into). */
	value: unknown;
	/** Master config, used only to order items and label ones saved without a label. */
	listConfig?: ListConfig | null;
}

const RANGE_LABEL = { InRange: 'In range', Lesser: 'Below range', Greater: 'Above range' } as const;

const displayValue = (entry: ListSavedEntry) =>
	entry.type === OK_NOT_OK_TYPE_KEY
		? formatOkNotOkValueForDisplay(entry.value) || '—'
		: formatTableCellDisplay(entry.type, entry.value);

/** Ordered by the master when available; entries for items since removed are kept at the end. */
const orderEntries = (entries: ListSavedEntry[], listConfig?: ListConfig | null): ListSavedEntry[] => {
	const items = listConfig?.items ?? [];
	if (items.length === 0) return entries;
	const byId = new Map(entries.map(entry => [entry.id, entry]));
	const ordered = items
		.map(item => {
			const entry = byId.get(item.id);
			return entry ? { ...entry, label: entry.label || item.label } : undefined;
		})
		.filter((entry): entry is ListSavedEntry => !!entry);
	const known = new Set(items.map(item => item.id));
	return [...ordered, ...entries.filter(entry => !known.has(entry.id))];
};

/** Read-only two-column rendering of a saved list, for the step preview and the report/PDF. */
const ListValuePreview = ({ value, listConfig }: ListValuePreviewProps) => {
	const entries = orderEntries(parseListSavedValue(value), listConfig);

	if (entries.length === 0) {
		return (
			<Typography variant="body2" sx={{ color: 'text.secondary' }}>
				No data
			</Typography>
		);
	}

	return (
		<Box
			component="table"
			className="list-value-preview"
			sx={{
				width: '100%',
				borderCollapse: 'collapse',
				'& td': { border: '1px solid #e0e0e0', px: 1, py: 0.75, fontSize: '0.8rem', verticalAlign: 'top' }
			}}
		>
			<tbody>
				{entries.map(entry => {
					const deviation = isListEntryDeviation(entry);
					const range =
						entry.type === 'number'
							? formatAcceptanceRange(entry.minimumAcceptanceValue, entry.maximumAcceptanceValue)
							: null;
					return (
						<tr key={entry.id}>
							<Box component="td" sx={{ width: '40%', fontWeight: 600, backgroundColor: '#f5f5f5' }}>
								{entry.label}
								{range && (
									<Typography variant="caption" sx={{ display: 'block', color: '#5e35b1', fontWeight: 400 }}>
										Range: {range}
									</Typography>
								)}
							</Box>
							<Box component="td" sx={deviation ? { backgroundColor: '#fff3e0' } : undefined}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
									<Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: deviation ? 600 : 400 }}>
										{displayValue(entry)}
									</Typography>
									{entry.validationStatus && (
										<Chip
											size="small"
											variant="outlined"
											color={entry.validationStatus === 'InRange' ? 'success' : 'warning'}
											label={RANGE_LABEL[entry.validationStatus]}
											sx={{ height: 20, fontSize: '0.65rem' }}
										/>
									)}
									{entry.validationStatus && entry.validationStatus !== 'InRange' && entry.acknowledged && (
										<Typography variant="caption" sx={{ color: 'text.secondary' }}>
											Acknowledged
										</Typography>
									)}
								</Box>
								{entry.comments && (
									<Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
										{getOkNotOkCommentPreviewLabel(entry.value)}: {entry.comments}
									</Typography>
								)}
							</Box>
						</tr>
					);
				})}
			</tbody>
		</Box>
	);
};

export default ListValuePreview;
