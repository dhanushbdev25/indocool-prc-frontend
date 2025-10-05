import Loadable from '../components/common/Loadable';
import { lazy } from 'react';
import DashBoardIcon from '../components/svg/DashBoardIcon';


const imports = {
	Dashboard: Loadable(lazy(() => import('../pages/sample'))),
};

// Screen configurations
export const Screens = {
	DASHBOARD: {
		icon: DashBoardIcon,
		path: 'dashboard',
		element: imports.Dashboard
	},
} as const;

export const sideBar = {
	//sections
	DASHBOARD: {
		icon: DashBoardIcon,
		text: 'Dashboard',
		path: 'dashboard'
	},
	
} as const;

export type SectionsType = typeof sideBar;
