import {
	Box,
	Typography,
	LinearProgress,
	Chip,
	Button,
	Divider,
	Stack,
	useTheme,
	IconButton,
	Tooltip
} from '@mui/material';
import { ArrowBack, PictureAsPdf, Science } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { type ExecutionData } from '../../../types/execution.types';
import { useLiveExecutionDurationMs } from '../../../hooks/useLiveExecutionDurationMs';
import { formatExecutionDuration } from '../../../utils/formatExecutionDuration';

interface ExecutionHeaderProps {
	executionData: ExecutionData;
	/** When set, Back invokes this instead of navigating to /prc-execution (e.g. dialog preview). */
	onBackOverride?: () => void;
	/** Hide Pause / Escalate (not applicable outside live execution). */
	hideExecutionActions?: boolean;
	/** Browse-only execution (PRC_EXECUTION_VIEW): adjust title and hide live actions. */
	viewOnlyMode?: boolean;
	onCatalystMixingClick?: () => void;
	catalystMixingDisabled?: boolean;
}

function formatCustomerContext(execution: ExecutionData): {
	customer: string;
	customerVariant: string;
	reservation: string;
} {
	const customer =
		typeof execution.customer === 'string' && execution.customer.trim()
			? execution.customer.trim()
			: '—';
	const customerVariant =
		typeof execution.customerVariantName === 'string' && execution.customerVariantName.trim()
			? execution.customerVariantName.trim()
			: '—';
	const reservation =
		execution.reservation != null && String(execution.reservation).trim()
			? String(execution.reservation).trim()
			: '—';
	return { customer, customerVariant, reservation };
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

const ExecutionHeader = ({
	executionData,
	onBackOverride,
	hideExecutionActions: _hideExecutionActions = false,
	viewOnlyMode = false,
	onCatalystMixingClick,
	catalystMixingDisabled = false
}: ExecutionHeaderProps) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const isPreview = executionData.status === 'PREVIEW';
	const liveDurationMs = useLiveExecutionDurationMs(executionData);
	const durationLabel = formatExecutionDuration(liveDurationMs);

	const calculateProgress = (execution: ExecutionData) => {
		const progressValue =
			typeof execution.progress === 'string' ? parseInt(execution.progress, 10) || 0 : execution.progress;
		return Math.min(100, Math.max(0, progressValue));
	};

	const progressPercentage = calculateProgress(executionData);
	const { customer: customerLabel, customerVariant, reservation } = formatCustomerContext(executionData);
	const sapRef =
		typeof executionData.sapReferenceNumber === 'string' && executionData.sapReferenceNumber.trim()
			? executionData.sapReferenceNumber.trim()
			: '—';

	const getProgressColor = (progress: number) => {
		if (progress >= 100) return theme.palette.success.main;
		if (progress >= 50) return theme.palette.warning.main;
		return theme.palette.primary.main;
	};

	const progressColor = getProgressColor(progressPercentage);

	return (
		<Box
			sx={{
				backgroundColor: 'background.paper',
				borderBottom: 1,
				borderColor: 'divider',
				flexShrink: 0,
				boxShadow: theme.shadows[1]
			}}
		>
			{/* Primary toolbar */}
			<Stack
				direction={{ xs: 'column', lg: 'row' }}
				spacing={2}
				sx={{
					alignItems: { xs: 'stretch', lg: 'center' },
					justifyContent: 'space-between',
					px: { xs: 2, sm: 2.5 },
					py: 2
				}}
			>
				<Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
					<Button
						startIcon={<ArrowBack />}
						onClick={() => (onBackOverride ? onBackOverride() : navigate('/prc-execution'))}
						color="inherit"
						size="small"
						sx={{
							color: 'text.secondary',
							flexShrink: 0,
							'&:hover': { bgcolor: 'action.hover' }
						}}
					>
						Back
					</Button>
					<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.25 }}>
							{isPreview ? 'PRC preview' : viewOnlyMode ? `View PRC #${executionData.id}` : `PRC #${executionData.id}`}
						</Typography>
						<Typography variant="body2" color="text.secondary" noWrap title={executionData.partNumber}>
							{executionData.partNumber}
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
							noWrap
							title={sapRef === '—' ? undefined : sapRef}
							sx={{ display: 'block', mt: 0.25, fontFamily: 'ui-monospace, monospace' }}
						>
							SAP reference: {sapRef}
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
							noWrap
							title={reservation === '—' ? undefined : reservation}
							sx={{ display: 'block', mt: 0.25, fontFamily: 'ui-monospace, monospace' }}
						>
							Reservation: {reservation}
						</Typography>
					</Box>
				</Stack>

				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={2}
					alignItems={{ xs: 'flex-end', sm: 'center' }}
					sx={{ flexShrink: 0, ml: { lg: 'auto' }, width: { xs: '100%', sm: 'auto' } }}
				>
					<Box sx={{ width: { xs: '100%', sm: 200 }, minWidth: { sm: 200 } }}>
						<Stack direction="row" alignItems="center" spacing={1.5}>
							<LinearProgress
								variant="determinate"
								value={progressPercentage}
								sx={{
									flex: 1,
									height: 10,
									borderRadius: 5,
									bgcolor: 'action.hover',
									'& .MuiLinearProgress-bar': {
										borderRadius: 5,
										bgcolor: progressColor
									}
								}}
							/>
							<Typography variant="body2" sx={{ fontWeight: 700, color: progressColor, minWidth: 40 }}>
								{progressPercentage}%
							</Typography>
						</Stack>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
							{executionData.stepsCompleted} of {executionData.totalSteps} steps
						</Typography>
					</Box>

					<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

					<Stack
						direction="row"
						spacing={1}
						flexWrap="wrap"
						useFlexGap
						sx={{ alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}
					>
						<Chip
							label={`CTQ ${executionData.completedCtq}/${executionData.totalCtq}`}
							size="small"
							variant="outlined"
							sx={{
								borderColor:
									executionData.completedCtq === executionData.totalCtq ? 'success.light' : 'warning.light',
								color:
									executionData.completedCtq === executionData.totalCtq
										? 'success.dark'
										: 'warning.dark'
							}}
						/>
						<Chip label={durationLabel} size="small" variant="outlined" color="info" />
					</Stack>

					{onCatalystMixingClick && (
						<Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
							<Button
								startIcon={<Science />}
								variant="outlined"
								size="small"
								color="inherit"
								onClick={onCatalystMixingClick}
								disabled={catalystMixingDisabled}
							>
								Catalyst Mixing
							</Button>
						</Stack>
					)}

					<Tooltip title="Consolidated report — print or save as PDF">
						<IconButton
							size="small"
							edge="end"
							onClick={() => navigate(`/prc-execution/report/${executionData.id}`)}
							aria-label="Open consolidated report"
							sx={{
								flexShrink: 0,
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: 1,
								p: 0.5,
								color: 'text.secondary',
								'&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' }
							}}
						>
							<PictureAsPdf sx={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>
				</Stack>
			</Stack>

			<Divider />

			{/* Context strip — labeled fields, breathable grid */}
			<Box
				sx={{
					px: { xs: 2, sm: 2.5 },
					py: 2,
					background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : theme.palette.grey[50]
				}}
			>
				<Stack
					direction="row"
					flexWrap="wrap"
					useFlexGap
					spacing={3}
					sx={{
						columnGap: 3,
						rowGap: 2.5,
						alignItems: 'flex-start'
					}}
				>
					<MetaField label="Order ID" value={executionData.orderId != null && String(executionData.orderId).trim() ? String(executionData.orderId) : '—'} monospace />
					<MetaField label="Customer" value={customerLabel} />
					<MetaField label="Customer variant" value={customerVariant} />
					<MetaField label="Reservation" value={reservation} monospace />
					<MetaField label="Production set" value={executionData.productionSetId || '—'} />
					<MetaField label="Mould" value={executionData.mouldCode || executionData.mouldId || '—'} />
				</Stack>
			</Box>
		</Box>
	);
};

export default ExecutionHeader;
