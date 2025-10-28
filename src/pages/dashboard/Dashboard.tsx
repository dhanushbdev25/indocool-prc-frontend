import { useState, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardSummaryCards } from './components/DashboardSummaryCards';
import { PartsBarChart } from './components/charts/PartsBarChart';
import { LocationBarChart } from './components/charts/LocationBarChart';
import { DefectBarChart } from './components/charts/DefectBarChart';
import type { 
	PartsChartData, 
	LocationChartData, 
	DefectChartData,
	DashboardData
} from '../../store/api/business/dashboard/dashboard.validators';

const Dashboard = () => {
	const [selectedCustomer, setSelectedCustomer] = useState('');
	const [selectedPart, setSelectedPart] = useState('');

	// Hardcoded dashboard data
	const dashboardData: DashboardData = {
		partsBarGraphCount: {
			header: {
				'1': 'P001 - Gear Housing',
				'2': 'P002 - Motor Shaft',
				'3': 'P003 - Bearing Assembly',
				'4': 'P004 - Impeller Unit'
			},
			detail: {
				'1': 15, // partId = 1 → 15 completed
				'2': 9, // partId = 2 → 9 completed
				'3': 12, // partId = 3 → 12 completed
				'4': 7 // partId = 4 → 7 completed
			}
		},
		locationBarGraphCount: {
			header: {
				'10': 'LOC001 - Main Plant',
				'11': 'LOC002 - Assembly Unit',
				'12': 'LOC003 - Testing Bay',
				'13': 'LOC004 - Packaging Area'
			},
			detail: {
				'10': 45, // Main Plant completed 45 PRCs
				'11': 32, // Assembly Unit completed 32 PRCs
				'12': 27, // Testing Bay completed 27 PRCs
				'13': 19 // Packaging Area completed 19 PRCs
			}
		},
		defectBarGraphCount: {
			header: {
				'1': 'Air Bubble (AB)',
				'2': 'Air Leak (ALK)',
				'3': 'Air Lock (AL)',
				'4': 'Black Mark',
				'5': 'Bristles',
				'6': 'Crack',
				'7': 'Damage',
				'8': 'Debonding',
				'9': 'Dust',
				'10': 'Foreign Particle in Gel Coat',
				'11': 'Handling Scratches (HS)',
				'12': 'High Thickness Gel Coat (HTGC)',
				'13': 'Insect on Gelcoat',
				'14': 'Low Thickness Gel Coat (LTGC)',
				'15': 'Mould Damage (MD)',
				'16': 'Mould Scratches (MS)',
				'17': 'Pin Holes (PH)',
				'18': 'Sealant Tape in Gel Coat',
				'19': 'Wrinkles (WK)',
				'20': 'Status',
				'21': 'Resin on Gelcoat'
			},
			detail: {
				'1': 42,
				'2': 18,
				'3': 25,
				'4': 30,
				'5': 16,
				'6': 40,
				'7': 35,
				'8': 22,
				'9': 27,
				'10': 14,
				'11': 31,
				'12': 19,
				'13': 8,
				'14': 24,
				'15': 15,
				'16': 12,
				'17': 28,
				'18': 6,
				'19': 10,
				'20': 5,
				'21': 11
			}
		}
	};

	// Transform data for charts
	const partsChartData: PartsChartData[] = useMemo(() => {
		return Object.entries(dashboardData.partsBarGraphCount.detail).map(([id, value]) => ({
			id,
			name: dashboardData.partsBarGraphCount.header[id] || `Part ${id}`,
			value,
			partNumber: id,
			description: dashboardData.partsBarGraphCount.header[id] || ''
		}));
	}, [dashboardData]);

	const locationChartData: LocationChartData[] = useMemo(() => {
		return Object.entries(dashboardData.locationBarGraphCount.detail).map(([id, value]) => ({
			id,
			name: dashboardData.locationBarGraphCount.header[id] || `Location ${id}`,
			value,
			locationCode: id,
			locationName: dashboardData.locationBarGraphCount.header[id] || ''
		}));
	}, [dashboardData]);

	const defectChartData: DefectChartData[] = useMemo(() => {
		return Object.entries(dashboardData.defectBarGraphCount.detail)
			.map(([id, value]) => {
				const fullName = dashboardData.defectBarGraphCount.header[id] || `Defect ${id}`;
				
				return {
					id,
					name: fullName, // Show full names
					value,
					defectCode: id,
					defectName: fullName,
					severity: value > 30 ? 'high' as const : value > 15 ? 'medium' as const : 'low' as const
				};
			})
			.sort((a, b) => b.value - a.value); // Sort by frequency descending
	}, [dashboardData]);

	const handleCustomerChange = (customer: string) => {
		setSelectedCustomer(customer);
		setSelectedPart(''); // Reset part selection when customer changes
	};

	const handlePartChange = (part: string) => {
		setSelectedPart(part);
	};

	return (
		<Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
			<DashboardHeader
				selectedCustomer={selectedCustomer}
				selectedPart={selectedPart}
				onCustomerChange={handleCustomerChange}
				onPartChange={handlePartChange}
			/>

			<DashboardSummaryCards data={dashboardData} />

			<Grid container spacing={3}>
				<Grid size={{ xs: 12, lg: 6 }}>
					<PartsBarChart data={partsChartData} />
				</Grid>
				<Grid size={{ xs: 12, lg: 6 }}>
					<LocationBarChart data={locationChartData} />
				</Grid>
				<Grid size={{ xs: 12 }}>
					<DefectBarChart data={defectChartData} />
				</Grid>
			</Grid>
		</Box>
	);
};

export default Dashboard;
