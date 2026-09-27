import { ReactNode } from 'react';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Chip,
	Paper,
	Skeleton,
	Typography
} from '@mui/material';
import {
	Science as CatalystIcon,
	Assignment as TemplateIcon,
	Image as ImageIcon,
	ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { PartDrawing, PartMaster } from '../../../../../../store/api/business/part-master/part.validators';
import ViewOnlyImageGallery from '../../../../../../components/common/imageGallery/ViewOnlyImageGallery';
import { useFetchCatalystByIdQuery } from '../../../../../../store/api/business/catalyst-master/catalyst.api';
import { useFetchPrcTemplateByIdQuery } from '../../../../../../store/api/business/prc-template/prc-template.api';
import ViewCatalystBasicInfo from '../../../../catalyst-master/components/view-catalyst/components/ViewCatalystBasicInfo';
import ViewCatalystConfiguration from '../../../../catalyst-master/components/view-catalyst/components/ViewCatalystConfiguration';
import ViewPrcTemplateBasicInfo from '../../../../prc-template-master/components/view-prc-template/components/ViewPrcTemplateBasicInfo';
import ViewPrcTemplateSteps from '../../../../prc-template-master/components/view-prc-template/components/ViewPrcTemplateSteps';

interface ViewLinkedMastersProps {
	partMaster: PartMaster;
	files?: PartDrawing[];
}

interface LinkedMasterSectionProps {
	icon: ReactNode;
	/** Circle colour for the icon, matching the picker cards on the edit screen. */
	accent: string;
	tint: string;
	label: string;
	title: string;
	caption: string;
	status?: string;
	version?: number;
	children: ReactNode;
}

const LinkedMasterSection = ({
	icon,
	accent,
	tint,
	label,
	title,
	caption,
	status,
	version,
	children
}: LinkedMasterSectionProps) => (
	<Accordion
		defaultExpanded
		disableGutters
		sx={{
			border: '1px solid #e0e0e0',
			borderRadius: '12px',
			boxShadow: 'none',
			overflow: 'hidden',
			'&:before': { display: 'none' }
		}}
	>
		<AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: tint }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 2 }}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 48,
						height: 48,
						borderRadius: '50%',
						backgroundColor: accent,
						color: 'white',
						flexShrink: 0
					}}
				>
					{icon}
				</Box>
				<Box>
					<Typography variant="caption" sx={{ color: '#666', fontWeight: 600, letterSpacing: 0.4 }}>
						{label.toUpperCase()}
					</Typography>
					<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
						{title}
					</Typography>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
						<Typography variant="body2" sx={{ color: '#666' }}>
							{caption}
						</Typography>
						{status && <Chip label={status} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />}
						{version !== undefined && (
							<Typography variant="caption" sx={{ color: '#999' }}>
								v{version}
							</Typography>
						)}
					</Box>
				</Box>
			</Box>
		</AccordionSummary>
		<AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>{children}</AccordionDetails>
	</Accordion>
);

const LoadingDetail = () => (
	<>
		<Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
		<Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
	</>
);

const ViewLinkedMasters = ({ partMaster, files = [] }: ViewLinkedMastersProps) => {
	const catalystId = partMaster.catalyst;
	const prcTemplateId = partMaster.prcTemplate;
	const hasLinkedMasters = Boolean(catalystId || prcTemplateId);

	// The part only stores the ids of the masters it links to. Pull each one so this screen can
	// show the same detail the catalyst and PRC template screens do — a bare id tells a
	// view-only user nothing about what the part will actually run.
	const {
		data: catalystData,
		isLoading: isCatalystLoading,
		isError: isCatalystError
	} = useFetchCatalystByIdQuery({ id: Number(catalystId) }, { skip: !catalystId });

	// Same arguments as the audit-history query on the parent screen, so RTK Query serves both
	// subscribers from one request.
	const {
		data: prcTemplateData,
		isLoading: isPrcTemplateLoading,
		isError: isPrcTemplateError
	} = useFetchPrcTemplateByIdQuery({ id: Number(prcTemplateId) }, { skip: !prcTemplateId });

	const catalyst = catalystData?.detail?.catalyst;
	const prcTemplate = prcTemplateData?.detail?.prcTemplate;

	const catalystBody = (() => {
		if (isCatalystLoading) return <LoadingDetail />;
		if (isCatalystError || !catalystData?.detail || !catalyst) {
			return <Alert severity="warning">Could not load the linked catalyst chart (ID: {catalystId}).</Alert>;
		}
		return (
			<>
				<ViewCatalystBasicInfo catalyst={catalyst} />
				<ViewCatalystConfiguration configurations={catalystData.detail.catalystConfiguration || []} />
			</>
		);
	})();

	const prcTemplateBody = (() => {
		if (isPrcTemplateLoading) return <LoadingDetail />;
		if (isPrcTemplateError || !prcTemplateData?.detail || !prcTemplate) {
			return <Alert severity="warning">Could not load the linked PRC template (ID: {prcTemplateId}).</Alert>;
		}
		return (
			<>
				<ViewPrcTemplateBasicInfo template={prcTemplate} />
				<ViewPrcTemplateSteps steps={prcTemplateData.detail.prcTemplateSteps || []} />
			</>
		);
	})();

	return (
		<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
			<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
				Linked Masters
			</Typography>

			<Box sx={{ mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
					<ImageIcon color="primary" />
					<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
						Part Images
					</Typography>
				</Box>
				<ViewOnlyImageGallery images={files} />
			</Box>

			{hasLinkedMasters ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
					{catalystId && (
						<LinkedMasterSection
							icon={<CatalystIcon />}
							accent="#1976d2"
							tint="#f3f8ff"
							label="Catalyst Chart"
							title={catalyst?.chartId || `Catalyst #${catalystId}`}
							caption={catalyst?.chartSupplier || `ID: ${catalystId}`}
							status={catalyst?.status}
							version={catalyst?.version}
						>
							{catalystBody}
						</LinkedMasterSection>
					)}

					{prcTemplateId && (
						<LinkedMasterSection
							icon={<TemplateIcon />}
							accent="#4caf50"
							tint="#f0f8f0"
							label="PRC Template"
							title={prcTemplate?.templateName || `PRC Template #${prcTemplateId}`}
							caption={prcTemplate?.templateId || `ID: ${prcTemplateId}`}
							status={prcTemplate?.status}
							version={prcTemplate?.version}
						>
							{prcTemplateBody}
						</LinkedMasterSection>
					)}
				</Box>
			) : (
				<Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
					No linked masters configured for this part
				</Typography>
			)}
		</Paper>
	);
};

export default ViewLinkedMasters;
