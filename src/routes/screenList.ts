import Loadable from '../components/common/Loadable';
import { lazy } from 'react';
import PersonAdd from '@mui/icons-material/PersonAdd';

// Lazy-loaded components
export const imports = {
	catalystMaster: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/list-catalyst'))),
	createCatalyst: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/create-catalyst'))),
	sequenceMaster: Loadable(lazy(() => import('../pages/masters/sequence-master/components/list-sequence'))),
	createSequence: Loadable(lazy(() => import('../pages/masters/sequence-master/components/create-sequence')))
};

// Screen configuration interface
export interface ScreenConfig {
	icon?: React.ComponentType<{ fill?: string }>; // Only required for sidebar items
	text: string;
	path: string;
	element: React.ComponentType;
	permission: string;
	isInitial?: boolean;
	order?: number; // Only required for items that show in sidebar
	showInSidebar?: boolean;
}

// Main module configuration interface
export interface MainModuleConfig {
	text: string;
	icon: React.ComponentType<{ fill?: string }>;
	order: number;
	submodules: ScreenConfig[];
}

// Main module configurations with hierarchical structure
export const mainModuleConfigs: MainModuleConfig[] = [
	{
		text: 'Masters',
		icon: PersonAdd,
		order: 1,
		submodules: [
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
				text: 'Create Catalyst',
				path: 'catalyst-master/create-catalyst',
				element: imports.createCatalyst,
				permission: 'CREATECATALYST',
				showInSidebar: false
			},
			{
				text: 'Edit Catalyst',
				path: 'catalyst-master/edit-catalyst/:id',
				element: imports.createCatalyst,
				permission: 'EDITCATALYST',
				showInSidebar: false
			},
			{
				icon: PersonAdd,
				text: 'Sequence Master',
				path: 'sequence-master',
				element: imports.sequenceMaster,
				permission: 'LISTPROCESSSEQUENCE',
				order: 2,
				showInSidebar: true
			},
			{
				text: 'Create Sequence',
				path: 'sequence-master/create-sequence',
				element: imports.createSequence,
				permission: 'CREATEPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				text: 'Edit Sequence',
				path: 'sequence-master/edit-sequence/:id',
				element: imports.createSequence,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			}
		]
	}
];

// Flattened screen configurations for backward compatibility and routing
export const screenConfigs: ScreenConfig[] = mainModuleConfigs.flatMap(module => module.submodules);
