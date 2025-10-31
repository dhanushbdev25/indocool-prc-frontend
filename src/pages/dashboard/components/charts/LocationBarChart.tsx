import { useState, useEffect } from 'react';
import { ChartContainer } from './PartsBarChart';
import type { LocationChartData } from '../../../../store/api/business/dashboard/dashboard.validators';
import type { ChartType } from './types';
import { CHART_STORAGE_KEYS, loadChartType, saveChartType } from './types';
import { ChartRenderer } from './ChartRenderer';

interface LocationBarChartProps {
	data: LocationChartData[];
}

export const LocationBarChart = ({ data }: LocationBarChartProps) => {
	const [chartType, setChartType] = useState<ChartType>(() => loadChartType(CHART_STORAGE_KEYS.LOCATION, 'bar'));

	useEffect(() => {
		saveChartType(CHART_STORAGE_KEYS.LOCATION, chartType);
	}, [chartType]);

	const handleChartTypeChange = (newChartType: ChartType) => {
		setChartType(newChartType);
	};

	return (
		<ChartContainer
			title="PRC Completion by Location"
			description="Number of completed PRCs across different plant locations"
			chartType={chartType}
			onChartTypeChange={handleChartTypeChange}
		>
			<ChartRenderer<LocationChartData>
				chartType={chartType}
				data={data}
				dataKey="value"
				color="#042E70"
				margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
				xAxisConfig={{
					dataKey: 'name',
					angle: -60,
					textAnchor: 'end',
					height: 80,
					interval: 0
				}}
				tooltipConfig={{
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					formatter: ((value: number) => [value.toString(), 'Completed PRCs'] as [string, string]) as any,
					labelFormatter: (label, payload) => {
						if (payload && payload[0] && payload[0].payload) {
							const payloadData = payload[0].payload as LocationChartData;
							return payloadData.locationName || label;
						}
						return label;
					},
					labelStyle: { color: '#333', fontWeight: 600 }
				}}
			/>
		</ChartContainer>
	);
};
