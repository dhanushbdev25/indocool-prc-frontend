import { Box, Typography } from '@mui/material';

export interface MasterListPageTitleProps {
	title: string;
	/** One line of context below the title (recommended for dense admin lists). */
	description?: string;
	action?: React.ReactNode;
}

/**
 * Page headline aligned with dense admin/browse patterns:
 * strong title weight, optional description, actions on the visual top-right edge.
 */
const MasterListPageTitle = ({ title, description, action }: MasterListPageTitleProps) => (
	<Box sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'flex-start',
				flexWrap: 'wrap',
				columnGap: 2,
				rowGap: 1.5
			}}
		>
			<Box sx={{ minWidth: 0, flex: '1 1 280px' }}>
				<Typography
					component="h1"
					variant="h6"
					sx={{
						fontWeight: 700,
						letterSpacing: '-0.02em',
						lineHeight: 1.25,
						color: 'text.primary'
					}}
				>
					{title}
				</Typography>
				{description ? (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 0.75, maxWidth: 'min(720px, 100%)', lineHeight: 1.55 }}
					>
						{description}
					</Typography>
				) : null}
			</Box>
			{action ? <Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>{action}</Box> : null}
		</Box>
	</Box>
);

export default MasterListPageTitle;
