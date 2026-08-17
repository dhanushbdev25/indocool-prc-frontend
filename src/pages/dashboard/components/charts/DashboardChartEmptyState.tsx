import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { InsertChartOutlined } from '@mui/icons-material';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { analyticsChartHeight } from '../../constants/dashboardTokens';

interface DashboardChartEmptyStateProps {
	height?: number;
	title?: string;
	description?: string;
}

const GHOST_LINE_DATA = [
	{ name: 'a', value: 3 },
	{ name: 'b', value: 6 },
	{ name: 'c', value: 4 },
	{ name: 'd', value: 8 },
	{ name: 'e', value: 5 },
	{ name: 'f', value: 7 }
];

export const DashboardChartEmptyState = ({
	height = analyticsChartHeight,
	title = 'No data for this period',
	description = 'Adjust the date range or check back once production data is recorded.'
}: DashboardChartEmptyStateProps) => {
	const theme = useTheme();
	const ghostColor = alpha(theme.palette.text.primary, 0.12);
	const gridStroke = alpha(theme.palette.divider, 0.65);

	return (
		<Box sx={{ position: 'relative', width: '100%', height, minHeight: height }}>
			<ResponsiveContainer width="100%" height={height}>
				<LineChart data={GHOST_LINE_DATA} margin={{ top: 24, right: 8, left: -8, bottom: 8 }}>
					<CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
					<XAxis dataKey="name" hide />
					<YAxis hide domain={[0, 10]} />
					<Line
						type="monotone"
						dataKey="value"
						stroke={ghostColor}
						strokeWidth={2.5}
						dot={{ fill: ghostColor, r: 3, strokeWidth: 0 }}
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>

			<Box
				sx={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 0.75,
					px: 2,
					textAlign: 'center',
					backgroundColor: alpha(theme.palette.background.paper, 0.82),
					backdropFilter: 'blur(1px)'
				}}
			>
				<Box
					sx={{
						width: 44,
						height: 44,
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: alpha(theme.palette.primary.main, 0.08),
						color: 'primary.main',
						mb: 0.5
					}}
				>
					<InsertChartOutlined sx={{ fontSize: 22 }} />
				</Box>
				<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
					{title}
				</Typography>
				<Typography variant="caption" color="text.secondary" sx={{ maxWidth: 260, lineHeight: 1.45 }}>
					{description}
				</Typography>
			</Box>
		</Box>
	);
};
