import {
	Box,
	Checkbox,
	Chip,
	FormControlLabel,
	MenuItem,
	Radio,
	RadioGroup,
	TextField,
	Typography
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import {
	OperationalDatePicker,
	OperationalDateTimePicker
} from '../../../../../components/common/OperationalDatePicker';
import type { ListItemConfig, ListValueState, ListValues } from '../../../../../types/list-config.types';
import { LIST_SHIFT_OPTIONS, getListItemRangeStatus, listErrorKeys } from '../../../../../utils/listConfig';
import { formatAcceptanceRange } from '../../../../../components/masters/acceptanceRange';
import { formatDateColumnStorageValue, formatTableCellDisplay } from '../../../../../utils/formatTableCellDisplay';
import {
	OK_NOT_OK_OPTIONS,
	OK_NOT_OK_TYPE_KEY,
	acceptsOkNotOkComment,
	getOkNotOkCommentFieldLabel,
	getOkNotOkCommentPlaceholder,
	requiresOkNotOkComment
} from '../../../../../utils/okNotOkLabels';
import { ERROR_ANCHOR_CLASS } from '../../../utils/scrollToFirstError';
import { useFetchWorkstationsComboQuery } from '../../../../../store/api/business/prc-execution/prc-execution.api';

export interface ListValueInputProps {
	items: readonly ListItemConfig[];
	values: ListValues;
	onChange: (item: ListItemConfig, patch: Partial<ListValueState>) => void;
	errors: Record<string, string | undefined>;
	/** Prefix the caller used when validating, so error keys line up (see `validateListValues`). */
	errorPrefix: string;
	disabled?: boolean;
	workstationOptions?: ReadonlyArray<{ value: string | number; label: string }>;
	plantCode?: string | number;
}

const RANGE_CHIP_COLOR = { InRange: 'success', Lesser: 'warning', Greater: 'error' } as const;
const RANGE_CHIP_LABEL = { InRange: 'In range', Lesser: 'Below range', Greater: 'Above range' } as const;

/**
 * Execution-side renderer for the "list" input type: a two-column sheet, label on the left and
 * the value the operator enters on the right. The widget per row follows the item's configured
 * type, matching the cells of the table input.
 */
const ListValueInput = ({
	items,
	values,
	onChange,
	errors,
	errorPrefix,
	disabled = false,
	workstationOptions = [],
	plantCode = ''
}: ListValueInputProps) => {
	const renderValueField = (item: ListItemConfig, state: ListValueState, error: string | undefined) => {
		const setValue = (value: string) => onChange(item, { value });
		const fieldProps = {
			size: 'small' as const,
			fullWidth: true,
			error: !!error,
			helperText: error,
			sx: { '& .MuiOutlinedInput-root': { borderRadius: '4px', backgroundColor: 'white' } }
		};

		if (item.type === OK_NOT_OK_TYPE_KEY) {
			return (
				<>
					<RadioGroup
						row
						value={state.value}
						onChange={e => setValue(e.target.value)}
						sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
					>
						{OK_NOT_OK_OPTIONS.map(option => (
							<FormControlLabel
								key={option.value}
								value={option.value}
								disabled={disabled}
								control={<Radio size="small" color={option.color} />}
								label={option.label}
							/>
						))}
					</RadioGroup>
					{error && (
						<Typography variant="caption" color="error" className={ERROR_ANCHOR_CLASS}>
							{error}
						</Typography>
					)}
				</>
			);
		}

		if (item.type === 'date') {
			return (
				<OperationalDatePicker
					value={state.value ? dayjs(state.value) : null}
					onChange={newValue => setValue(formatDateColumnStorageValue(newValue))}
					disabled={disabled}
					slotProps={{ textField: fieldProps }}
				/>
			);
		}

		if (item.type === 'datetime') {
			return (
				<OperationalDateTimePicker
					value={state.value ? dayjs(state.value) : null}
					onChange={newValue => setValue(newValue ? newValue.format('YYYY-MM-DDTHH:mm') : '')}
					disabled={disabled}
					slotProps={{ textField: fieldProps }}
				/>
			);
		}

		if (item.type === 'shift') {
			return (
				<TextField
					{...fieldProps}
					select
					value={state.value}
					disabled={disabled}
					onChange={e => setValue(e.target.value)}
				>
					{LIST_SHIFT_OPTIONS.map(option => (
						<MenuItem key={option} value={option}>
							{option}
						</MenuItem>
					))}
				</TextField>
			);
		}

		if (item.type === 'workstation') {
			return (
				<TextField
					{...fieldProps}
					select
					value={state.value}
					disabled={disabled || !plantCode}
					helperText={error || (!plantCode ? 'No plant configured' : undefined)}
					onChange={e => setValue(e.target.value)}
				>
					{workstationOptions.map(option => (
						<MenuItem key={String(option.value)} value={String(option.value)}>
							{option.label}
						</MenuItem>
					))}
				</TextField>
			);
		}

		return (
			<TextField
				{...fieldProps}
				type={item.type === 'number' ? 'number' : 'text'}
				value={state.value}
				disabled={disabled}
				onChange={e => setValue(e.target.value)}
			/>
		);
	};

	return (
		<Box
			component="table"
			sx={{
				width: '100%',
				borderCollapse: 'collapse',
				'& td': { border: '1px solid #e0e0e0', p: 1, fontSize: '0.875rem', verticalAlign: 'top' }
			}}
		>
			<tbody>
				{items.map(item => {
					const state = values[item.id] ?? { value: '', comments: '', acknowledged: false };
					const keys = listErrorKeys(errorPrefix, item.id);
					const valueError = errors[keys.value] || undefined;
					const commentError = errors[keys.comments] || undefined;
					const ackError = errors[keys.acknowledge] || undefined;
					const range =
						item.type === 'number'
							? formatAcceptanceRange(item.minimumAcceptanceValue, item.maximumAcceptanceValue)
							: null;
					const status = getListItemRangeStatus(item, state.value);
					const isLocked = item.readOnly;

					return (
						<tr key={item.id} data-list-item-id={item.id}>
							<Box component="td" sx={{ width: '40%', backgroundColor: '#f5f5f5' }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{item.label}
									{item.required && !isLocked && (
										<Box component="span" sx={{ color: 'error.main' }}>
											{' '}
											*
										</Box>
									)}
								</Typography>
								{range && (
									<Typography variant="caption" sx={{ color: '#5e35b1' }}>
										Range: {range}
									</Typography>
								)}
							</Box>
							<td>
								{isLocked ? (
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
										<LockIcon sx={{ fontSize: 14, color: '#1976d2' }} />
										<Typography variant="body2" sx={{ color: '#333' }}>
											{formatTableCellDisplay(item.type, item.defaultValue)}
										</Typography>
									</Box>
								) : (
									renderValueField(item, state, valueError)
								)}

								{!isLocked && status && (
									<Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
										<Chip
											size="small"
											variant="outlined"
											color={RANGE_CHIP_COLOR[status]}
											label={RANGE_CHIP_LABEL[status]}
										/>
										{status !== 'InRange' && (
											<FormControlLabel
												control={
													<Checkbox
														size="small"
														checked={state.acknowledged}
														disabled={disabled}
														onChange={e => onChange(item, { acknowledged: e.target.checked })}
													/>
												}
												label={<Typography variant="caption">I acknowledge this deviation</Typography>}
											/>
										)}
									</Box>
								)}
								{ackError && (
									<Typography variant="caption" color="error" className={ERROR_ANCHOR_CLASS} sx={{ display: 'block' }}>
										{ackError}
									</Typography>
								)}

								{!isLocked && item.type === OK_NOT_OK_TYPE_KEY && acceptsOkNotOkComment(state.value) && (
									<TextField
										size="small"
										fullWidth
										multiline
										minRows={2}
										sx={{ mt: 1 }}
										label={getOkNotOkCommentFieldLabel(state.value)}
										placeholder={getOkNotOkCommentPlaceholder(state.value)}
										required={requiresOkNotOkComment(state.value)}
										value={state.comments}
										disabled={disabled}
										error={!!commentError}
										helperText={commentError}
										onChange={e => onChange(item, { comments: e.target.value })}
									/>
								)}
							</td>
						</tr>
					);
				})}
			</tbody>
		</Box>
	);
};

export default ListValueInput;

/**
 * `ListValueInput` that loads the plant's workstations itself, for screens that do not already
 * have them. The lookup only runs when one of the items is a workstation.
 */
export const ListValueInputWithWorkstations = (props: Omit<ListValueInputProps, 'workstationOptions'>) => {
	const plantCode = props.plantCode ? String(props.plantCode) : '';
	const needsWorkstations = props.items.some(item => item.type === 'workstation');
	const { data: workstationOptions = [] } = useFetchWorkstationsComboQuery(
		{ plantCodes: plantCode ? [plantCode] : [] },
		{ skip: !plantCode || !needsWorkstations }
	);
	return <ListValueInput {...props} workstationOptions={workstationOptions} />;
};
