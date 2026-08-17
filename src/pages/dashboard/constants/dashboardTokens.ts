import { alpha, type SxProps, type Theme } from '@mui/material/styles';

/** Shopify-inspired analytics surface tokens — light, crisp, data-first */
export const analyticsPageGap = 3;

export const analyticsPanel: SxProps<Theme> = theme => ({
	backgroundColor: theme.palette.background.paper,
	borderRadius: '12px',
	border: `1px solid ${theme.palette.divider}`,
	boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.06)}`,
	overflow: 'hidden'
});

export const analyticsPanelHeader: SxProps<Theme> = {
	px: { xs: 2, sm: 2.5 },
	py: { xs: 1.75, sm: 2 },
	borderBottom: 1,
	borderColor: 'divider',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 2
};

export const analyticsPanelBody: SxProps<Theme> = {
	px: { xs: 2, sm: 2.5 },
	py: { xs: 2, sm: 2.5 }
};

export const analyticsMetricGrid: SxProps<Theme> = {
	display: 'grid',
	gridTemplateColumns: {
		xs: 'repeat(1, minmax(0, 1fr))',
		sm: 'repeat(2, minmax(0, 1fr))',
		md: 'repeat(2, minmax(0, 1fr))',
		lg: 'repeat(4, minmax(0, 1fr))'
	},
	gap: { xs: 1.25, sm: 1.5 }
};

export const analyticsMetricCard: SxProps<Theme> = theme => ({
	backgroundColor: theme.palette.background.paper,
	borderRadius: '10px',
	border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
	p: { xs: 1.25, sm: 1.5 },
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	minHeight: { xs: 152, sm: 168 },
	height: '100%',
	transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
	'&:hover': {
		borderColor: alpha(theme.palette.primary.main, 0.35),
		boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)}`
	}
});

export const analyticsSectionTitle: SxProps<Theme> = {
	fontWeight: 600,
	fontSize: '0.9375rem',
	lineHeight: 1.4,
	color: 'text.primary',
	letterSpacing: '-0.01em'
};

export const analyticsSectionSubtitle: SxProps<Theme> = {
	fontSize: '0.8125rem',
	color: 'text.secondary',
	lineHeight: 1.45,
	mt: 0.25
};

export const analyticsChartHeight = 300;

export const dateRangeTriggerButton: SxProps<Theme> = theme => ({
	textTransform: 'none',
	fontWeight: 600,
	fontSize: '0.8125rem',
	borderRadius: '8px',
	borderColor: alpha(theme.palette.divider, 1),
	color: 'text.primary',
	px: 1.5,
	py: 0.75,
	minHeight: 36,
	backgroundColor: theme.palette.background.paper,
	boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}`,
	'&:hover': {
		borderColor: alpha(theme.palette.text.primary, 0.25),
		backgroundColor: alpha(theme.palette.action.hover, 0.04)
	}
});

export const dashboardFilterField: SxProps<Theme> = theme => ({
	'& .MuiOutlinedInput-root': {
		borderRadius: '10px',
		minHeight: 40,
		maxHeight: 40,
		flexWrap: 'nowrap',
		overflow: 'hidden',
		paddingTop: '0 !important',
		paddingBottom: '0 !important',
		paddingLeft: '10px !important',
		paddingRight: '36px !important',
		backgroundColor: theme.palette.background.paper,
		boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
		transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
		'& fieldset': {
			borderColor: alpha(theme.palette.divider, 0.9)
		},
		'&:hover fieldset': {
			borderColor: alpha(theme.palette.grey[500], 0.35)
		},
		'&.Mui-focused': {
			boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)}, 0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
			'& fieldset': {
				borderColor: alpha(theme.palette.primary.main, 0.35),
				borderWidth: 1
			}
		}
	},
	'& .MuiInputLabel-root': {
		fontSize: '0.8125rem',
		fontWeight: 500,
		color: 'text.secondary',
		transform: 'translate(10px, 10px) scale(1)',
		'&.MuiInputLabel-shrink': {
			transform: 'translate(10px, -7px) scale(0.78)',
			fontWeight: 600,
			letterSpacing: '0.02em'
		}
	},
	'& .MuiAutocomplete-input': {
		minWidth: '24px !important',
		padding: '8px 4px !important',
		fontSize: '0.8125rem',
		fontWeight: 500
	},
	'& .MuiAutocomplete-endAdornment': {
		right: 8
	},
	'& .MuiAutocomplete-tag': {
		margin: 0,
		maxWidth: 'calc(100% - 8px)'
	}
});
