// Dashboard data types and validators

export interface BarGraphData {
	header: Record<string, string>;
	detail: Record<string, number>;
}

export interface DashboardData {
	partsBarGraphCount: BarGraphData;
	locationBarGraphCount: BarGraphData;
	defectBarGraphCount: BarGraphData;
}

export interface DashboardResponse {
	data: DashboardData;
}

// Summary card data types
export interface SummaryCardData {
	title: string;
	value: number;
	subtitle: string;
	icon: string;
	color: string;
}

// Chart data types for components
export interface ChartDataItem {
	name: string;
	value: number;
	id: string;
}

export interface PartsChartData extends ChartDataItem {
	partNumber: string;
	description: string;
}

export interface LocationChartData extends ChartDataItem {
	locationCode: string;
	locationName: string;
}

export interface DefectChartData extends ChartDataItem {
	defectCode: string;
	defectName: string;
	severity: 'low' | 'medium' | 'high';
}

