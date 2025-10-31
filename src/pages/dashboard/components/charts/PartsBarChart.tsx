import { useState, useEffect, type ReactNode } from 'react';
import { Box, Card, CardContent, Typography, FormControl, Select, MenuItem } from '@mui/material';
import type { PartsChartData } from '../../../store/api/business/dashboard/dashboard.validators';
import type { ChartType } from './types';
import { CHART_TYPE_OPTIONS, CHART_STORAGE_KEYS, loadChartType, saveChartType } from './types';
import { ChartRenderer } from './ChartRenderer';

interface ChartContainerProps {
	title: string;
	description?: string;
	children: ReactNode;
	height?: number;
	chartType?: ChartType;
	onChartTypeChange?: (chartType: ChartType) => void;
}

export const ChartContainer = ({
	title,
	description,
	children,
	height = 400,
	chartType,
	onChartTypeChange
}: ChartContainerProps) => {
	return (
		<Card
			sx={{
				borderRadius: '12px',
				boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
				backgroundColor: 'white',
				overflow: 'hidden'
			}}
		>
			<CardContent sx={{ p: 3 }}>
				<Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
					<Box sx={{ flex: 1 }}>
						<Typography
							variant="h6"
							sx={{
								fontWeight: 600,
								color: '#333',
								mb: description ? 0.5 : 0
							}}
						>
							{title}
						</Typography>
						{description && (
							<Typography
								variant="body2"
								sx={{
									color: '#666',
									fontSize: '0.875rem'
								}}
							>
								{description}
							</Typography>
						)}
					</Box>
					{chartType !== undefined && onChartTypeChange && (
						<FormControl size="small" sx={{ minWidth: 150, ml: 2 }}>
							<Select
								value={chartType}
								onChange={e => onChartTypeChange(e.target.value as ChartType)}
								sx={{
									borderRadius: '8px',
									fontSize: '0.875rem',
									backgroundColor: '#fafafa',
									'& .MuiOutlinedInput-notchedOutline': {
										borderColor: '#e0e0e0'
									},
									'&:hover .MuiOutlinedInput-notchedOutline': {
										borderColor: '#0D5FDC'
									},
									'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
										borderColor: '#0D5FDC'
									}
								}}
							>
								{CHART_TYPE_OPTIONS.map(option => (
									<MenuItem key={option.value} value={option.value}>
										{option.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}
				</Box>
				<Box sx={{ height: height }}>{children}</Box>
			</CardContent>
		</Card>
	);
};

interface PartsBarChartProps {
	data: PartsChartData[];
}

export const PartsBarChart = ({ data }: PartsBarChartProps) => {
	const [chartType, setChartType] = useState<ChartType>(() => loadChartType(CHART_STORAGE_KEYS.PARTS, 'bar'));

	useEffect(() => {
		saveChartType(CHART_STORAGE_KEYS.PARTS, chartType);
	}, [chartType]);

	const handleChartTypeChange = (newChartType: ChartType) => {
		setChartType(newChartType);
	};

	return (
		<ChartContainer
			title="PRC Completion by Part"
			description="Number of completed PRCs for each part type"
			chartType={chartType}
			onChartTypeChange={handleChartTypeChange}
		>
			<ChartRenderer
				chartType={chartType}
				data={data}
				dataKey="value"
				color="#0D5FDC"
				margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
				xAxisConfig={{
					dataKey: 'name',
					angle: -60,
					textAnchor: 'end',
					height: 80,
					interval: 0
				}}
				tooltipConfig={{
					formatter: (value: number) => [value, 'Completed PRCs'],
					labelFormatter: (label, payload) => {
						if (payload && payload[0] && payload[0].payload) {
							return payload[0].payload.description || label;
						}
						return label;
					},
					labelStyle: { color: '#333', fontWeight: 600 }
				}}
			/>
		</ChartContainer>
	);
};
