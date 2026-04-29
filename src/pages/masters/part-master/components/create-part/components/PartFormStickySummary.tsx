import { Box, Typography, Chip, Stack, Divider, useTheme } from '@mui/material';
import { useFormContext, useWatch } from 'react-hook-form';
import { PartMasterFormData } from '../schemas';
import { useFetchCustomersQuery } from '../../../../../../store/api/business/part-master/part.api';

function dash(s: unknown): string {
	if (s === undefined || s === null) return '—';
	if (typeof s === 'string') return s.trim() === '' ? '—' : s.trim();
	if (typeof s === 'number' && Number.isFinite(s)) return String(s);
	return '—';
}

function MetaField({
	label,
	value,
	monospace
}: {
	label: string;
	value: string;
	monospace?: boolean;
}) {
	return (
		<Stack spacing={0.35} sx={{ minWidth: 0, flex: '1 1 120px', maxWidth: { xs: '100%', sm: 220 } }}>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{
					fontWeight: 600,
					letterSpacing: '0.06em',
					textTransform: 'uppercase',
					fontSize: '0.65rem',
					lineHeight: 1.2
				}}
			>
				{label}
			</Typography>
			<Typography
				variant="body2"
				color="text.primary"
				title={value}
				sx={{
					fontWeight: 500,
					lineHeight: 1.35,
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical',
					fontFamily: monospace ? 'ui-monospace, monospace' : undefined
				}}
			>
				{value}
			</Typography>
		</Stack>
	);
}

const PartFormStickySummary = () => {
	const theme = useTheme();
	const { control } = useFormContext<PartMasterFormData>();
	const partNumber = useWatch({ control, name: 'partNumber' });
	const drawingNumber = useWatch({ control, name: 'drawingNumber' });
	const drawingRevision = useWatch({ control, name: 'drawingRevision' });
	const partRevision = useWatch({ control, name: 'partRevision' });
	const sapReferenceNumber = useWatch({ control, name: 'sapReferenceNumber' });
	const customerCode = useWatch({ control, name: 'customer' });
	const isActive = useWatch({ control, name: 'isActive' });
	const partId = useWatch({ control, name: 'id' });

	const { data: customersData } = useFetchCustomersQuery();
	const customerLabel =
		customerCode && typeof customerCode === 'string'
			? customersData?.data?.find(c => String(c.value) === String(customerCode))?.label ?? customerCode
			: '';

	const revLine = `Dr ${dash(drawingRevision)} / Pr ${dash(partRevision)}`;
	const drawingLine =
		dash(drawingNumber) === '—' && revLine === 'Dr — / Pr —'
			? '—'
			: `${dash(drawingNumber)} · ${revLine}`;

	return (
		<>
			<Divider />
			<Box
				sx={{
					px: { xs: 0, sm: 0 },
					py: 2,
					background:
						theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : theme.palette.grey[50]
				}}
			>
				<Stack
					direction="row"
					flexWrap="wrap"
					alignItems="center"
					useFlexGap
					spacing={2}
					sx={{
						columnGap: 3,
						rowGap: 2,
						justifyContent: 'space-between'
					}}
				>
					<Stack direction="row" flexWrap="wrap" useFlexGap spacing={3} sx={{ flex: '1 1 auto', minWidth: 0 }}>
						{partId != null && typeof partId === 'number' ? (
							<MetaField label="Part ID" value={String(partId)} monospace />
						) : null}
						<MetaField label="Part number" value={dash(partNumber)} monospace />
						<MetaField label="Drawing / revisions" value={drawingLine} monospace={false} />
						<MetaField label="SAP reference" value={dash(sapReferenceNumber)} monospace />
						<MetaField label="Customer" value={dash(customerLabel || undefined)} />
					</Stack>
					<Chip
						label={isActive !== false ? 'Active' : 'Inactive'}
						size="small"
						color={isActive !== false ? 'success' : 'default'}
						variant={isActive !== false ? 'filled' : 'outlined'}
						sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
					/>
				</Stack>
			</Box>
		</>
	);
};

export default PartFormStickySummary;
