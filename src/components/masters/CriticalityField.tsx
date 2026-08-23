import { FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useFormContext, useWatch, type FieldValues, type Path } from 'react-hook-form';
import {
	resolveCriticality,
	toCriticalityFields,
	type CriticalityOption,
	type CriticalityValue
} from '../../utils/criticality';

export interface CriticalityFieldProps {
	/** Form path of the boolean `ctq` field. */
	ctqName: string;
	/** Form path of the nullable `criticalityTag` field. */
	tagName: string;
	options: readonly CriticalityOption[];
	label: string;
	helperText?: string;
}

/**
 * One dropdown backed by the two persisted criticality fields.
 *
 * The pair is only ever written through `toCriticalityFields`, so `ctq` and
 * `criticalityTag` cannot end up contradicting each other. Both are watched because
 * either one can be the field that changes — picking CTA leaves `ctq` untouched, and
 * picking CTQ leaves the tag untouched, so watching just one would miss half the edits.
 */
const CriticalityField = ({ ctqName, tagName, options, label, helperText }: CriticalityFieldProps) => {
	const { control, setValue } = useFormContext<FieldValues>();

	const ctq = useWatch({ control, name: ctqName as Path<FieldValues> });
	const criticalityTag = useWatch({ control, name: tagName as Path<FieldValues> });

	const value = resolveCriticality({ ctq: Boolean(ctq), criticalityTag });

	const handleChange = (next: CriticalityValue) => {
		const fields = toCriticalityFields(next);
		setValue(ctqName as Path<FieldValues>, fields.ctq, { shouldDirty: true, shouldValidate: true });
		setValue(tagName as Path<FieldValues>, fields.criticalityTag, { shouldDirty: true, shouldValidate: true });
	};

	return (
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select label={label} value={value} onChange={event => handleChange(event.target.value as CriticalityValue)}>
				{options.map(option => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
			{helperText && (
				<Typography variant="caption" sx={{ color: '#666', mt: 0.5, ml: 1.5 }}>
					{helperText}
				</Typography>
			)}
		</FormControl>
	);
};

export default CriticalityField;
