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
import dayjs from 'dayjs';
import {
	OperationalDatePicker,
	OperationalDateTimePicker
} from '../../../../../components/common/OperationalDatePicker';
import { formatAcceptanceRange } from '../../../../../components/masters/acceptanceRange';
import { useFetchWorkstationsComboQuery } from '../../../../../store/api/business/prc-execution/prc-execution.api';
import {
	BOOLEAN_CELL_OPTIONS,
	formatExactTarget,
	isNumericCellType,
	type FixedTableCellSpec
} from '../../../../../utils/fixedTableCellSpec';
import { formatDateColumnStorageValue } from '../../../../../utils/formatTableCellDisplay';
import { LIST_SHIFT_OPTIONS } from '../../../../../utils/listConfig';
import { OK_NOT_OK_OPTIONS } from '../../../../../utils/okNotOkLabels';
import { getRangeStatus, isRangeExemptValue } from '../../../utils/fixedTableExecution';
import { ERROR_ANCHOR_CLASS } from '../../../utils/scrollToFirstError';

/** Fixed-table cell select for a choice type; a workstation cell loads the plant's workstations itself. */
const FixedTableChoiceCell = ({
	type,
	plantCode,
	value,
	onChange,
	error,
	disabled
}: {
	type: 'boolean' | 'workstation';
	plantCode: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	disabled: boolean;
}) => {
	const { data: workstationOptions = [] } = useFetchWorkstationsComboQuery(
		{ plantCodes: plantCode ? [plantCode] : [] },
		{ skip: type !== 'workstation' || !plantCode }
	);
	const choices =
		type === 'boolean'
			? BOOLEAN_CELL_OPTIONS.map(option => ({ value: option, label: option }))
			: workstationOptions.map(option => ({ value: String(option.value), label: option.label }));
	return (
		<TextField
			select
			value={value}
			onChange={e => onChange(e.target.value)}
			error={!!error}
			helperText={error || (type === 'workstation' && !plantCode ? 'No plant configured' : undefined)}
			size="small"
			disabled={disabled || (type === 'workstation' && !plantCode)}
			variant="outlined"
			fullWidth
		>
			{choices.map(choice => (
				<MenuItem key={choice.value} value={choice.value}>
					{choice.label}
				</MenuItem>
			))}
		</TextField>
	);
};

export interface FixedTableCellInputProps {
	/** The cell's resolved data type and range (see resolveFixedTableCellSpec). */
	spec: FixedTableCellSpec;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	/** Shown under the acknowledge checkbox when a deviation is left unacknowledged. */
	ackError?: string;
	acknowledged: boolean;
	onAcknowledgeChange: (acknowledged: boolean) => void;
	disabled: boolean;
	plantCode: string;
}

/**
 * The operator's input for one editable fixed-table cell, chosen by the cell's data type. A
 * numeric cell shows its range or target and, when the reading falls outside it, the deviation
 * with an acknowledge checkbox. Shared by inspection and sequence steps.
 */
const FixedTableCellInput = ({
	spec,
	value,
	onChange,
	error,
	ackError,
	acknowledged,
	onAcknowledgeChange,
	disabled,
	plantCode
}: FixedTableCellInputProps) => {
	if (spec.type === 'boolean' || spec.type === 'workstation') {
		return (
			<FixedTableChoiceCell
				type={spec.type}
				plantCode={plantCode}
				value={value}
				onChange={onChange}
				error={error}
				disabled={disabled}
			/>
		);
	}

	if (spec.type === 'ok/not ok') {
		return (
			<>
				<RadioGroup
					row
					value={value}
					onChange={e => onChange(e.target.value)}
					sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
				>
					{OK_NOT_OK_OPTIONS.map(option => (
						<FormControlLabel
							key={option.value}
							value={option.value}
							control={<Radio size="small" color={option.color} />}
							label={option.label}
							disabled={disabled}
						/>
					))}
				</RadioGroup>
				{error && (
					<Typography variant="caption" color="error" className={ERROR_ANCHOR_CLASS} sx={{ mt: 0.5, display: 'block' }}>
						{error}
					</Typography>
				)}
			</>
		);
	}

	if (spec.type === 'date' || spec.type === 'datetime') {
		const Picker = spec.type === 'date' ? OperationalDatePicker : OperationalDateTimePicker;
		return (
			<Picker
				value={value ? dayjs(value) : null}
				onChange={newValue =>
					onChange(
						spec.type === 'date'
							? formatDateColumnStorageValue(newValue)
							: newValue
								? newValue.format('YYYY-MM-DDTHH:mm')
								: ''
					)
				}
				disabled={disabled}
				slotProps={{
					textField: {
						size: 'small',
						error: !!error,
						helperText: error,
						variant: 'outlined',
						fullWidth: true
					}
				}}
			/>
		);
	}

	if (spec.type === 'shift') {
		return (
			<TextField
				select
				value={value}
				onChange={e => onChange(e.target.value)}
				error={!!error}
				helperText={error}
				size="small"
				disabled={disabled}
				variant="outlined"
				fullWidth
			>
				{LIST_SHIFT_OPTIONS.map(option => (
					<MenuItem key={option} value={option}>
						{option}
					</MenuItem>
				))}
			</TextField>
		);
	}

	const isNumericCell = isNumericCellType(spec.type);
	const rangeStatus =
		isNumericCell && !isRangeExemptValue(value)
			? getRangeStatus(parseFloat(String(value)), spec.minimumAcceptanceValue, spec.maximumAcceptanceValue)
			: null;
	const rangeLabel = isNumericCell
		? spec.type === 'exact value'
			? formatExactTarget(spec.minimumAcceptanceValue)
			: formatAcceptanceRange(spec.minimumAcceptanceValue, spec.maximumAcceptanceValue)
		: null;
	const isDeviation = !!rangeStatus && rangeStatus !== 'InRange';

	return (
		<>
			<TextField
				type={isNumericCell ? 'number' : 'text'}
				value={value}
				onChange={e => onChange(e.target.value)}
				error={!!error}
				helperText={error}
				size="small"
				disabled={disabled}
				variant="outlined"
				fullWidth
				inputProps={{
					min: 0,
					step: spec.type === 'integer' ? 1 : isNumericCell ? 0.01 : undefined
				}}
			/>
			{rangeLabel && (
				<Typography variant="caption" sx={{ display: 'block', color: '#666', mt: 0.25 }}>
					{spec.type === 'exact value' ? 'Target' : 'Range'}: {rangeLabel}
				</Typography>
			)}
			{isDeviation && (
				<Box sx={{ mt: 0.5 }}>
					<Chip
						label={rangeStatus}
						size="small"
						color={rangeStatus === 'Lesser' ? 'warning' : 'error'}
						sx={{ fontSize: '0.7rem', height: 20 }}
					/>
					<FormControlLabel
						control={
							<Checkbox
								size="small"
								checked={acknowledged}
								onChange={e => onAcknowledgeChange(e.target.checked)}
								disabled={disabled}
							/>
						}
						label="Acknowledge deviation"
						sx={{ display: 'block', mt: 0.25 }}
					/>
					{ackError && (
						<Typography
							variant="caption"
							color="error"
							className={ERROR_ANCHOR_CLASS}
							sx={{ mt: 0.5, display: 'block' }}
						>
							{ackError}
						</Typography>
					)}
				</Box>
			)}
		</>
	);
};

export default FixedTableCellInput;
