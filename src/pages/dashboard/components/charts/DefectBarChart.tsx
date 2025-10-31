import { useState, useEffect } from 'react';
import { ChartContainer } from './PartsBarChart';
import type { DefectChartData } from '../../../../store/api/business/dashboard/dashboard.validators';
import type { ChartType } from './types';
import { CHART_STORAGE_KEYS, loadChartType, saveChartType } from './types';
import { ChartRenderer } from './ChartRenderer';

interface DefectBarChartProps {
	data: DefectChartData[];
}

// Color function based on severity
const getDefectColor = (severity: 'low' | 'medium' | 'high') => {
	switch (severity) {
		case 'high':
			return '#f44336'; // Red for high severity
		case 'medium':
			return '#ff9800'; // Orange for medium severity
		case 'low':
			return '#4caf50'; // Green for low severity
		default:
			return '#9e9e9e'; // Gray for unknown
	}
};

export const DefectBarChart = ({ data }: DefectBarChartProps) => {
	const [chartType, setChartType] = useState<ChartType>(() => loadChartType(CHART_STORAGE_KEYS.DEFECT, 'bar'));

	useEffect(() => {
		saveChartType(CHART_STORAGE_KEYS.DEFECT, chartType);
	}, [chartType]);

	const handleChartTypeChange = (newChartType: ChartType) => {
		setChartType(newChartType);
	};

	// Get color for each data point based on severity
	const getColorForItem = (item: DefectChartData) => {
		return getDefectColor(item.severity);
	};

	return (
		<ChartContainer
			title="Defect Analysis"
			description="Frequency of defects found during PRC execution"
			height={600}
			chartType={chartType}
			onChartTypeChange={handleChartTypeChange}
		>
			<ChartRenderer
				chartType={chartType}
				data={data}
				dataKey="value"
				margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
				xAxisConfig={{
					dataKey: 'name',
					angle: -60,
					textAnchor: 'end',
					height: 100,
					interval: 0,
					tick: {
						fontSize: 9,
						fill: '#666',
						textAnchor: 'end',
						dominantBaseline: 'middle'
					}
				}}
				tooltipConfig={{
					contentStyle: {
						backgroundColor: 'white',
						border: '1px solid #e0e0e0',
						borderRadius: '8px',
						boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
						fontSize: '14px',
						maxWidth: '300px'
					},
					formatter: (value: number) => [value, 'Occurrences'],
					labelFormatter: (label, payload) => {
						if (payload && payload[0] && payload[0].payload) {
							const payloadData = payload[0].payload;
							return (
								<div style={{ wordWrap: 'break-word' }}>
									<strong>{payloadData.defectName || label}</strong>
									<br />
									<small style={{ color: '#666' }}>Severity: {payloadData.severity?.toUpperCase() || 'UNKNOWN'}</small>
								</div>
							);
						}
						return label;
					},
					labelStyle: { color: '#333', fontWeight: 600 }
				}}
				getColor={getColorForItem}
			/>
		</ChartContainer>
	);
};
