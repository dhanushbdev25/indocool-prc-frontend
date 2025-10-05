import React, { forwardRef, ReactNode } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';

// header style
const headerSX = {
	p: 2.5,
	'& .MuiCardHeader-action': { m: '0px auto', alignSelf: 'center' }
};

// ==============================|| CUSTOM - MAIN CARD ||============================== //

interface MainCardProps {
	border?: boolean;
	boxShadow?: boolean;
	children?: ReactNode;
	content?: boolean;
	contentSX?: React.CSSProperties;
	darkTitle?: boolean;
	elevation?: number;
	secondary?: ReactNode;
	shadow?: string;
	sx?: React.CSSProperties;
	title?: string | ReactNode;
	codeHighlight?: boolean;
	[key: string]: unknown;
}

const MainCard = forwardRef<HTMLDivElement, MainCardProps>(
	(
		{
			border = true,
			boxShadow,
			children,
			content = true,
			contentSX = {},
			darkTitle,
			elevation,
			secondary,
			sx = {},
			title,
			...others
		},
		ref
	) => {
		const theme = useTheme();
		boxShadow = theme.palette.mode === 'dark' ? boxShadow || true : boxShadow;

		return (
			<Card
				elevation={elevation || 0}
				ref={ref}
				{...others}
				sx={{
					border: border ? '1px solid' : 'none',
					borderRadius: 2,
					borderColor: 'rgba(0, 0, 0, 0.07)',
					boxShadow: boxShadow && `0px 4px 6px 0px rgba(0, 0, 0, 0.07)`,
					':hover': {
						boxShadow: boxShadow ? `0px 4px 6px 0px rgba(0, 0, 0, 0.07)` : 'inherit'
					},
					'& pre': {
						m: 0,
						p: '16px !important',
						fontFamily: theme.typography.fontFamily,
						fontSize: '0.75rem'
					},
					...sx
				}}
			>
				{/* card header and action */}
				{!darkTitle && title && (
					<CardHeader sx={headerSX} titleTypographyProps={{ variant: 'subtitle1' }} title={title} action={secondary} />
				)}
				{darkTitle && title && (
					<CardHeader sx={headerSX} title={<Typography variant="h3">{title}</Typography>} action={secondary} />
				)}

				{/* card content */}
				{content && <CardContent sx={contentSX}>{children}</CardContent>}
				{!content && children}
			</Card>
		);
	}
);

export default MainCard;
