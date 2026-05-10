import { useState, useEffect, useCallback, useId } from 'react';
import {
	Badge,
	Box,
	Button,
	Collapse,
	Divider,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Tooltip,
	Typography,
	type TypographyProps
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { alpha, useTheme } from '@mui/material/styles';
import {
	Search as SearchIcon,
	Close as CloseIcon,
	ExpandLess as ExpandLessIcon,
	ExpandMore as ExpandMoreIcon,
	FilterList as FilterListIcon
} from '@mui/icons-material';
import { masterListCardInset, masterListToolbarSurface } from './masterListTokens';

const DEFAULT_DEBOUNCE_MS = 280;

export interface MasterListToolbarProps {
	searchPlaceholder: string;
	onSearchChange?: (term: string) => void;
	debounceMs?: number;
	filterDirty?: boolean;
	onReset?: () => void;
	resetLabel?: string;
	children?: React.ReactNode;
	/**
	 * Keeps rack visible while scrolling the main content shell (pairs with layout scroll container).
	 * @default true
	 */
	sticky?: boolean;
	searchAriaLabel?: string;
	listSummary?: string | null;
	listSummaryTypographyProps?: TypographyProps;
	/**
	 * When true, search and facet controls hide behind a toggle for a tighter default layout.
	 * List summary stays visible whenever provided.
	 * @default true
	 */
	collapsible?: boolean;
	/** Used when {@link collapsible} is true. @default false */
	filtersDefaultExpanded?: boolean;
	/** @default 'Search & filters' */
	filtersExpandLabel?: string;
	/** @default 'Hide search & filters' */
	filtersCollapseLabel?: string;
}

/**
 * Browse-pattern toolbar inspired by mature admin grids (Stripe / Linear / GCP console):
 *
 * - **Results first** — count/summary stays above controls for fast orientation.
 * - **Search prominence** — wide field, clear affordance, dedicated clear control.
 * - **Grouped facets** — filters sit in a separate visual band (“narrow”) to reduce rivalry with search.
 * - **Collapsible chrome** — optional toggle hides search/facets behind a clearly labeled filter control.
 */
const MasterListToolbar = ({
	searchPlaceholder,
	onSearchChange,
	debounceMs = DEFAULT_DEBOUNCE_MS,
	filterDirty = false,
	onReset,
	resetLabel = 'Clear filters',
	sticky = true,
	searchAriaLabel = 'Search list',
	listSummary,
	listSummaryTypographyProps,
	collapsible = true,
	filtersDefaultExpanded = false,
	filtersExpandLabel = 'Search & filters',
	filtersCollapseLabel = 'Hide search & filters',
	children
}: MasterListToolbarProps) => {
	const theme = useTheme();
	const uid = useId();
	const panelId = `master-list-toolbar-search${uid.replace(/:/g, '')}`;
	const toggleId = `${panelId}-toggle`;
	const hasFiltersSlot = Boolean(children);
	const hasSummary = Boolean(listSummary?.trim());
	const [draft, setDraft] = useState('');
	const [filtersOpen, setFiltersOpen] = useState(filtersDefaultExpanded);

	const flushSearch = useCallback(
		(term: string) => {
			onSearchChange?.(term);
		},
		[onSearchChange]
	);

	useEffect(() => {
		if (debounceMs <= 0) {
			flushSearch(draft);
			return;
		}
		const id = window.setTimeout(() => flushSearch(draft), debounceMs);
		return () => window.clearTimeout(id);
	}, [draft, debounceMs, flushSearch]);

	const handleClearField = () => {
		setDraft('');
		flushSearch('');
	};

	const handleResetClick = () => {
		setDraft('');
		flushSearch('');
		onReset?.();
	};

	const stickyRackSx: SxProps<Theme> | undefined = sticky
		? t => ({
				position: 'sticky',
				top: 0,
				zIndex: 11,
				pt: 0,
				pb: 0,
				backgroundColor: t.palette.background.default,
				borderBottom: 1,
				borderBottomColor: 'divider'
			})
		: undefined;

	const { sx: summarySx, ...summaryTypoProps } = listSummaryTypographyProps ?? {};

	const filterWellSx: SxProps<Theme> = t => ({
		borderRadius: 1.5,
		px: { xs: 2, sm: 2.5 },
		py: { xs: 2, sm: 2.5 },
		backgroundColor:
			t.palette.mode === 'dark' ? alpha(t.palette.common.white, 0.06) : alpha(t.palette.primary.main, 0.035),
		borderWidth: 1,
		borderStyle: 'solid',
		borderColor: t.palette.mode === 'dark' ? alpha(t.palette.divider, 0.9) : alpha(t.palette.divider, 0.65),
		overflow: 'visible'
	});

	const cardChromeSx: SxProps<Theme> = t => ({
		borderRadius: 2,
		border: 1,
		borderColor: 'divider',
		backgroundColor: t.palette.background.paper,
		boxShadow:
			t.palette.mode === 'dark'
				? 'none'
				: `0 1px 1px ${alpha(t.palette.common.black, 0.04)}, 0 1px 4px ${alpha(t.palette.common.black, 0.05)}`
	});

	const summaryEl =
		!hasSummary ? null : (
			<Typography
				component="div"
				role="status"
				aria-live="polite"
				variant="body2"
				color="text.secondary"
				{...summaryTypoProps}
				sx={[
					{
						fontWeight: 500,
						letterSpacing: '0.01em',
						lineHeight: 1.45
					},
					summarySx
				]}
			>
				{listSummary}
			</Typography>
		);

	const searchFieldsBlock = (
		<Stack spacing={{ xs: 2.25, sm: 2.5 }}>
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				sx={{ gap: { xs: 2, md: 2 }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
			>
				<TextField
					placeholder={searchPlaceholder}
					variant="outlined"
					size="small"
					value={draft}
					onChange={e => setDraft(e.target.value)}
					inputProps={{
						'aria-label': searchAriaLabel,
						autoComplete: 'off'
					}}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} aria-hidden />
							</InputAdornment>
						),
						endAdornment: draft ? (
							<InputAdornment position="end">
								<Tooltip title="Clear search">
									<IconButton size="small" aria-label="Clear search" onClick={handleClearField} edge="end">
										<CloseIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							</InputAdornment>
						) : null
					}}
					sx={{
						flex: '1 1 auto',
						width: '100%',
						minWidth: 0,
						maxWidth: { md: 'min(560px, 100%)', lg: 'min(640px, 100%)' },
						'& .MuiOutlinedInput-root': {
							borderRadius: 1.5,
							backgroundColor: alpha(theme.palette.background.default, 0.95),
							'&:hover .MuiOutlinedInput-notchedOutline': {
								borderColor: alpha(theme.palette.primary.main, 0.45)
							}
						},
						'& .MuiOutlinedInput-input': {
							py: 1,
							fontSize: '0.9375rem'
						}
					}}
				/>

				{filterDirty && onReset ? (
					<Box
						sx={{
							flexShrink: 0,
							display: 'flex',
							justifyContent: { xs: 'flex-end', md: 'flex-end' },
							alignSelf: { xs: 'stretch', md: 'center' },
							ml: { md: 'auto' }
						}}
					>
						<Button
							size="small"
							variant="outlined"
							color="inherit"
							onClick={handleResetClick}
							sx={{
								flexShrink: 0,
								textTransform: 'none',
								fontWeight: 600,
								whiteSpace: 'nowrap',
								width: { xs: '100%', md: 'auto' },
								borderColor: 'divider',
								color: 'text.primary',
								'&:hover': {
									borderColor: 'text.secondary',
									backgroundColor: alpha(theme.palette.text.primary, 0.04)
								}
							}}
						>
							{resetLabel}
						</Button>
					</Box>
				) : null}
			</Stack>

			{hasFiltersSlot ? (
				<>
					<Divider sx={{ borderColor: 'divider' }} />
					<Box sx={filterWellSx}>
						<Stack
							direction="row"
							useFlexGap
							spacing={2}
							sx={{
								flexWrap: { xs: 'nowrap', lg: 'wrap' },
								alignItems: 'center',
								alignContent: 'center',
								minWidth: 0,
								overflowX: { xs: 'auto', lg: 'visible' },
								overflowY: 'hidden',
								py: { xs: 0.75, sm: 1 },
								scrollbarWidth: 'thin',
								'&::-webkit-scrollbar': {
									height: 6
								},
								'&::-webkit-scrollbar-thumb': {
									backgroundColor: alpha(theme.palette.text.primary, 0.22),
									borderRadius: 3
								}
							}}
						>
							{children}
						</Stack>
					</Box>
				</>
			) : null}
		</Stack>
	);

	if (!collapsible) {
		return (
			<Box sx={[stickyRackSx, masterListToolbarSurface] as SxProps<Theme>}>
				<Box sx={[cardChromeSx, masterListCardInset] as SxProps<Theme>} role="search" aria-label="Search and filter">
					{hasSummary ? <Box sx={{ mb: 2 }}>{summaryEl}</Box> : null}
					{searchFieldsBlock}
				</Box>
			</Box>
		);
	}

	return (
		<Box sx={[stickyRackSx, masterListToolbarSurface] as SxProps<Theme>}>
			<Box sx={[cardChromeSx, masterListCardInset] as SxProps<Theme>}>
				<Stack spacing={0}>
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="space-between"
						flexWrap="wrap"
						sx={{ columnGap: 2, rowGap: 1.5 }}
					>
						{hasSummary ? (
							<Box sx={{ flex: '1 1 240px', minWidth: 0 }}>{summaryEl}</Box>
						) : (
							<Box sx={{ flex: '1 1 auto' }} />
						)}
						<Badge variant="dot" color="primary" invisible={!filterDirty} sx={{ flexShrink: 0 }}>
							<Button
								id={toggleId}
								aria-expanded={filtersOpen}
								aria-controls={panelId}
								size="small"
								variant="outlined"
								color="inherit"
								startIcon={<FilterListIcon fontSize="small" />}
								endIcon={
									filtersOpen ? (
										<ExpandLessIcon sx={{ ml: -0.25 }} fontSize="small" aria-hidden />
									) : (
										<ExpandMoreIcon sx={{ ml: -0.25 }} fontSize="small" aria-hidden />
									)
								}
								onClick={() => setFiltersOpen(open => !open)}
								sx={{
									flexShrink: 0,
									textTransform: 'none',
									fontWeight: 600,
									borderColor: 'divider',
									color: 'text.primary',
									px: { xs: 1.25, sm: 1.5 },
									'&:hover': {
										borderColor: 'text.secondary',
										backgroundColor: alpha(theme.palette.text.primary, 0.04)
									}
								}}
							>
								{filtersOpen ? filtersCollapseLabel : filtersExpandLabel}
							</Button>
						</Badge>
					</Stack>

					<Collapse in={filtersOpen}>
						<Box id={panelId} role="region" aria-labelledby={toggleId} sx={{ pt: 2 }}>
							<Divider sx={{ borderColor: 'divider', mb: 2 }} />
							<Box role="search" aria-label="Search and filter">
								{searchFieldsBlock}
							</Box>
						</Box>
					</Collapse>
				</Stack>
			</Box>
		</Box>
	);
};

export default MasterListToolbar;
