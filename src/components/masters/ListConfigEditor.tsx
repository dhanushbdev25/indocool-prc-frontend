import {
	Alert,
	Box,
	Button,
	Chip,
	FormControlLabel,
	IconButton,
	MenuItem,
	Paper,
	Switch,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { ListConfig, ListItemConfig, ListItemType } from '../../types/list-config.types';
import { LIST_ITEM_TYPE_OPTIONS, LIST_SHIFT_OPTIONS, createListItem } from '../../utils/listConfig';
import { OK_NOT_OK_OPTIONS, OK_NOT_OK_TYPE_KEY } from '../../utils/okNotOkLabels';
import ReorderControls from './ReorderControls';

export interface ListConfigEditorProps {
	config?: ListConfig | null;
	onChange: (config: ListConfig) => void;
	/** Validation message for the list as a whole (e.g. "At least one item is required"). */
	errorMessage?: string;
	/** Validation messages per item, keyed by item index. */
	itemErrors?: Record<number, string | undefined>;
}

const inputSx = {
	'& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: 'white' },
	'& .MuiOutlinedInput-input': { py: '6px', fontSize: '0.875rem' }
};

/** Free-text default for most types; a fixed choice where the execution input is a choice too. */
const DefaultValueField = ({ item, onChange }: { item: ListItemConfig; onChange: (value: string) => void }) => {
	const common = {
		size: 'small' as const,
		label: item.readOnly ? 'Value' : 'Default value',
		value: item.defaultValue ?? '',
		onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
		sx: { ...inputSx, minWidth: 160, flex: 1 }
	};

	if (item.type === OK_NOT_OK_TYPE_KEY) {
		return (
			<TextField {...common} select>
				<MenuItem value="">
					<em>None</em>
				</MenuItem>
				{OK_NOT_OK_OPTIONS.map(option => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</TextField>
		);
	}

	if (item.type === 'shift') {
		return (
			<TextField {...common} select>
				<MenuItem value="">
					<em>None</em>
				</MenuItem>
				{LIST_SHIFT_OPTIONS.map(option => (
					<MenuItem key={option} value={option}>
						{option}
					</MenuItem>
				))}
			</TextField>
		);
	}

	if (item.type === 'date' || item.type === 'datetime') {
		return (
			<TextField
				{...common}
				type={item.type === 'date' ? 'date' : 'datetime-local'}
				slotProps={{ inputLabel: { shrink: true } }}
			/>
		);
	}

	return <TextField {...common} type={item.type === 'number' ? 'number' : 'text'} />;
};

/**
 * Master-side editor for the "list" input type: each row is a label the operator sees on the
 * left and the kind of value they enter on the right, with its required flag, default/locked
 * value and, for numbers, an acceptance range. Shared by the Process Sequence and Inspection
 * masters so both configure lists identically.
 */
const ListConfigEditor = ({ config, onChange, errorMessage, itemErrors }: ListConfigEditorProps) => {
	const items = config?.items ?? [];

	const setItems = (next: ListItemConfig[]) => onChange({ items: next });

	const updateItem = (index: number, patch: Partial<ListItemConfig>) => {
		setItems(
			items.map((item, i) => {
				if (i !== index) return item;
				const next = { ...item, ...patch };
				if (patch.type && patch.type !== item.type) {
					// A default typed for the old input rarely fits the new one.
					next.defaultValue = '';
					if (patch.type !== 'number') {
						next.minimumAcceptanceValue = '';
						next.maximumAcceptanceValue = '';
					}
				}
				return next;
			})
		);
	};

	const moveItem = (from: number, to: number) => {
		if (to < 0 || to >= items.length) return;
		const next = [...items];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		setItems(next);
	};

	return (
		<Paper
			sx={{
				p: 2.5,
				backgroundColor: '#f8f9fa',
				border: errorMessage ? '1px solid #f44336' : '1px solid #e0e0e0',
				borderRadius: '12px'
			}}
		>
			{errorMessage && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{errorMessage}
				</Alert>
			)}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
				<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
					List Configuration
				</Typography>
				<Chip
					label={`${items.length} item${items.length !== 1 ? 's' : ''}`}
					size="small"
					sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontWeight: 500 }}
				/>
			</Box>
			<Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1.5 }}>
				Each item shows its label on the left and the value to enter on the right during execution.
			</Typography>

			{items.map((item, index) => (
				<Paper key={item.id} variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
					<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
						<Typography variant="caption" sx={{ color: '#999', minWidth: 20, textAlign: 'right' }}>
							{index + 1}.
						</Typography>
						<TextField
							size="small"
							label="Label"
							placeholder="e.g. Mould temperature"
							value={item.label}
							onChange={e => updateItem(index, { label: e.target.value })}
							error={!!itemErrors?.[index]}
							sx={{ ...inputSx, flex: 2, minWidth: 180 }}
						/>
						<TextField
							select
							size="small"
							label="Input type"
							value={item.type}
							onChange={e => updateItem(index, { type: e.target.value as ListItemType })}
							sx={{ ...inputSx, minWidth: 160 }}
						>
							{LIST_ITEM_TYPE_OPTIONS.map(option => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</TextField>
						<ReorderControls
							itemLabel="list item"
							position={index + 1}
							canMoveUp={index > 0}
							canMoveDown={index < items.length - 1}
							onMoveUp={() => moveItem(index, index - 1)}
							onMoveDown={() => moveItem(index, index + 1)}
						/>
						<Tooltip title="Remove item" arrow>
							<IconButton
								size="small"
								aria-label={`Remove list item ${index + 1}`}
								onClick={() => setItems(items.filter((_, i) => i !== index))}
								sx={{ color: '#bbb', '&:hover': { color: '#f44336' } }}
							>
								<DeleteIcon sx={{ fontSize: 18 }} />
							</IconButton>
						</Tooltip>
					</Box>

					<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1.5, pl: 3.5 }}>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={item.required}
									disabled={item.readOnly}
									onChange={e => updateItem(index, { required: e.target.checked })}
								/>
							}
							label={<Typography variant="body2">Required</Typography>}
						/>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={item.readOnly}
									onChange={e => updateItem(index, { readOnly: e.target.checked })}
								/>
							}
							label={<Typography variant="body2">Read-only</Typography>}
						/>
						<DefaultValueField item={item} onChange={value => updateItem(index, { defaultValue: value })} />
						{item.type === 'number' && !item.readOnly && (
							<>
								<TextField
									size="small"
									type="number"
									label="Min"
									value={item.minimumAcceptanceValue ?? ''}
									onChange={e => updateItem(index, { minimumAcceptanceValue: e.target.value })}
									sx={{ ...inputSx, width: 110 }}
								/>
								<TextField
									size="small"
									type="number"
									label="Max"
									value={item.maximumAcceptanceValue ?? ''}
									onChange={e => updateItem(index, { maximumAcceptanceValue: e.target.value })}
									sx={{ ...inputSx, width: 110 }}
								/>
							</>
						)}
					</Box>
					{itemErrors?.[index] && (
						<Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, pl: 3.5 }}>
							{itemErrors[index]}
						</Typography>
					)}
				</Paper>
			))}

			{items.length === 0 && (
				<Box sx={{ textAlign: 'center', py: 2, color: '#aaa' }}>
					<Typography variant="body2">No items yet. Add the first one below.</Typography>
				</Box>
			)}

			<Button
				size="small"
				startIcon={<AddIcon />}
				onClick={() => setItems([...items, createListItem()])}
				sx={{ textTransform: 'none', color: '#1976d2' }}
			>
				Add Item
			</Button>
		</Paper>
	);
};

export default ListConfigEditor;
