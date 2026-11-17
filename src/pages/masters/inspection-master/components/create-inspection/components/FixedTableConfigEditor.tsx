import { Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { FixedTableEditor } from '../../../../../../components/masters';
import type { TableConfig } from '../../../../../../types/table-config.types';
import { InspectionFormData } from '../schemas';

/** Fixed table configuration editor for the 'fixed-table' parameter type. */
const FixedTableConfigEditor = ({
	control,
	parameterIndex
}: {
	control: Control<InspectionFormData>;
	parameterIndex: number;
}) => {
	const { setValue } = useFormContext<InspectionFormData>();
	const parameterType = useWatch({ control, name: `inspectionParameters.${parameterIndex}.type` });
	const tableConfig = useWatch({
		control,
		name: `inspectionParameters.${parameterIndex}.tableConfig` as `inspectionParameters.${number}.tableConfig`
	});

	if (parameterType !== 'fixed-table') return null;

	return (
		<Grid size={{ xs: 12 }}>
			<Divider sx={{ my: 2 }} />
			<FixedTableEditor
				config={tableConfig as Partial<TableConfig> | null | undefined}
				onChange={config =>
					setValue(
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						`inspectionParameters.${parameterIndex}.tableConfig` as any,
						config,
						{ shouldDirty: true }
					)
				}
			/>
		</Grid>
	);
};

export default FixedTableConfigEditor;
