import { useCallback, useRef, useState } from 'react';
import { Tooltip, Typography, type TypographyProps } from '@mui/material';

interface TruncatedTextWithTooltipProps extends TypographyProps {
	text: string;
	tooltip?: string;
	lineClamp?: number;
}

export const TruncatedTextWithTooltip = ({
	text,
	tooltip,
	lineClamp,
	sx,
	...typographyProps
}: TruncatedTextWithTooltipProps) => {
	const [isTruncated, setIsTruncated] = useState(false);
	const observerRef = useRef<ResizeObserver | null>(null);

	const handleRef = useCallback((node: HTMLElement | null) => {
		if (observerRef.current) {
			observerRef.current.disconnect();
			observerRef.current = null;
		}

		if (!node) return;

		const updateTruncation = () => {
			setIsTruncated(node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1);
		};

		updateTruncation();
		const observer = new ResizeObserver(updateTruncation);
		observer.observe(node);
		observerRef.current = observer;
	}, []);

	const truncateSx = lineClamp
		? {
				display: '-webkit-box',
				WebkitLineClamp: lineClamp,
				WebkitBoxOrient: 'vertical' as const,
				overflow: 'hidden'
			}
		: {
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap' as const
			};

	return (
		<Tooltip
			title={tooltip ?? text}
			arrow
			placement="top"
			disableHoverListener={!isTruncated}
			disableFocusListener={!isTruncated}
		>
			<Typography
				ref={handleRef}
				{...typographyProps}
				sx={[truncateSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			>
				{text}
			</Typography>
		</Tooltip>
	);
};
