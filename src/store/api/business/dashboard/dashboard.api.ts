import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import type { DashboardResponse } from './dashboard.validators';

export const dashboardApi = createApi({
	reducerPath: 'dashboardApi',
	baseQuery,
	tagTypes: ['Dashboard'],
	endpoints: builder => ({
		// Fetch dashboard data with hardcoded values
		fetchDashboardData: builder.query<DashboardResponse, void>({
			queryFn: async () => {
				// Simulate a small delay to show loading state
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				// Return hardcoded data
				const data = {
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
				
				return { data: { data } };
			},
			providesTags: ['Dashboard']
		})
	})
});

export const { useFetchDashboardDataQuery } = dashboardApi;

