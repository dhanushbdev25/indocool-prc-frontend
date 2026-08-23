import { Box, IconButton, Tooltip } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

export interface ReorderControlsProps {
	onMoveUp: () => void;
	onMoveDown: () => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
	/** Names the thing being moved, e.g. "parameter" — used for tooltips and aria labels. */
	itemLabel: string;
	/** Position within the list, 1-based, for a more specific aria label. */
	position?: number;
}

/**
 * Paired move-up / move-down buttons for ordering items in the masters.
 *
 * Deliberately does NOT use KeyboardArrowUp/Down: those are chevrons, the same glyph the
 * accordions use to expand and collapse, and sitting next to one in the same header they read
 * as a second collapse toggle. Arrows with a shaft say "move" instead, and the pair is wrapped
 * in a single hairline pill so it reads as one control rather than two loose icons.
 */
const ReorderControls = ({
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
	itemLabel,
	position
}: ReorderControlsProps) => {
	const suffix = position != null ? ` ${position}` : '';

	// These often sit inside an AccordionSummary, where a bubbling click would toggle the panel.
	const handle = (move: () => void) => (event: React.MouseEvent) => {
		event.stopPropagation();
		move();
	};

	const buttonSx = {
		borderRadius: 0,
		width: 26,
		height: 24,
		color: '#5f6b7a',
		'&:hover': { backgroundColor: 'rgba(0,0,0,0.06)', color: '#1976d2' },
		'&.Mui-disabled': { color: '#c8cdd4' }
	};

	return (
		<Box
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				border: '1px solid #e0e0e0',
				borderRadius: '6px',
				overflow: 'hidden',
				backgroundColor: 'white',
				flexShrink: 0
			}}
		>
			<Tooltip title={canMoveUp ? `Move ${itemLabel} up` : ''}>
				<span style={{ display: 'inline-flex' }}>
					<IconButton
						aria-label={`Move ${itemLabel}${suffix} up`}
						disabled={!canMoveUp}
						onClick={handle(onMoveUp)}
						sx={buttonSx}
					>
						<ArrowUpward sx={{ fontSize: '0.95rem' }} />
					</IconButton>
				</span>
			</Tooltip>
			<Box sx={{ width: '1px', alignSelf: 'stretch', backgroundColor: '#e0e0e0' }} />
			<Tooltip title={canMoveDown ? `Move ${itemLabel} down` : ''}>
				<span style={{ display: 'inline-flex' }}>
					<IconButton
						aria-label={`Move ${itemLabel}${suffix} down`}
						disabled={!canMoveDown}
						onClick={handle(onMoveDown)}
						sx={buttonSx}
					>
						<ArrowDownward sx={{ fontSize: '0.95rem' }} />
					</IconButton>
				</span>
			</Tooltip>
		</Box>
	);
};

export default ReorderControls;
