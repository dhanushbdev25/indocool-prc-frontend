import Loadable from '../components/common/Loadable';
import { lazy } from 'react';
import PersonAdd from '@mui/icons-material/PersonAdd';

// Lazy-loaded components
export const imports = {
	catalystMaster: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/list-catalyst'))),
	createCatalyst: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/create-catalyst')))
};

// Screen configuration interface
export interface ScreenConfig {
	icon: React.ComponentType<{ fill?: string }>;
	text: string;
	path: string;
	element: React.ComponentType;
	permission: string;
	isInitial?: boolean;
	order: number;
	showInSidebar?: boolean;
}

// Screen configurations with order control and initial screen marking
export const screenConfigs: ScreenConfig[] = [
	{
		icon: PersonAdd,
		text: 'Catalyst Master',
		path: 'catalyst-master',
		element: imports.catalystMaster,
		permission: 'LISTCATALYST',
		isInitial: true,
		order: 1,
		showInSidebar: true
	},
	{
		icon: PersonAdd,
		text: 'Create Catalyst',
		path: 'catalyst-master/createcatalyst',
		element: imports.createCatalyst,
		permission: 'CREATECATALYST',
		order: 2,
		showInSidebar: false
	},
	{
		icon: PersonAdd,
		text: 'Edit Catalyst',
		path: 'catalyst-master/editcatalyst/:id',
		element: imports.createCatalyst,
		permission: 'EDITCATALYST',
		order: 3,
		showInSidebar: false
	}
];

