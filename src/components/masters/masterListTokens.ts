/**
 * Production-grade list layout tokens: neutral surfaces, standard dividers,
 * minimal elevation. Use theme palette only for subtle cues.
 */
import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

/** Vertical rhythm between page regions */
export const masterListSectionGap: SxProps<Theme> = { mb: 2 };

/** Vertical gap between landing regions (passed to `<Stack spacing={…} />`) — multiples of theme spacing (default 8px) */
export const masterListLandingSectionGap = 2;

/**
 * Inner padding for bordered shells (toolbar card, KPI strip body).
 * Keep toolbar and metrics visually aligned.
 */
export const masterListCardInset: SxProps<Theme> = {
	px: { xs: 2, sm: 2.5 },
	py: { xs: 2, sm: 2 }
};

export const masterListHairlineDivider: SxProps<Theme> = {
	borderBottom: 1,
	borderColor: 'divider'
};

/** KPI region — neutral frame with single primary stripe (common in enterprise dashboards) */
export const masterListSummaryShell: SxProps<Theme> = theme => ({
	position: 'relative',
	borderRadius: 2,
	overflow: 'hidden',
	borderTop: 1,
	borderRight: 1,
	borderBottom: 1,
	borderStyle: 'solid',
	borderColor: 'divider',
	borderLeft: `3px solid ${theme.palette.primary.main}`,
	backgroundColor: theme.palette.background.paper,
	boxShadow:
		theme.palette.mode === 'dark'
			? 'none'
			: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)} inset`,
	backgroundImage:
		theme.palette.mode === 'dark'
			? `linear-gradient(${alpha(theme.palette.common.white, 0.02)}, ${alpha(theme.palette.common.white, 0.02)})`
			: 'none'
});

/** Toolbar spacing only; delineation handled by sticky rack + inner bordered panel */
export const masterListToolbarSurface: SxProps<Theme> = {
	border: 'none',
	borderBottom: 'none',
	backgroundColor: 'transparent',
	boxShadow: 'none',
	px: 0,
	py: 0,
	borderRadius: 0
};

/** Table wrapper — datasheet-style frame */
export const masterListTableFrame: SxProps<Theme> = theme => ({
	backgroundColor: theme.palette.background.paper,
	borderRadius: 2,
	overflow: 'hidden',
	border: 1,
	borderColor: 'divider',
	boxShadow:
		theme.palette.mode === 'dark'
			? `0 1px 0 ${alpha(theme.palette.divider, 0.85)} inset`
			: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}, 0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`
});
