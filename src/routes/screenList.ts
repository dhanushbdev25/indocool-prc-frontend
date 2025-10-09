import Loadable from '../components/common/Loadable';
import { lazy } from 'react';
import { Science, Timeline, Settings } from '@mui/icons-material';

// Lazy-loaded components
export const imports = {
	catalystMaster: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/list-catalyst'))),
	createCatalyst: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/create-catalyst'))),
	viewCatalyst: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/view-catalyst'))),
	sequenceMaster: Loadable(lazy(() => import('../pages/masters/sequence-master/components/list-sequence'))),
	createSequence: Loadable(lazy(() => import('../pages/masters/sequence-master/components/create-sequence'))),
	viewSequence: Loadable(lazy(() => import('../pages/masters/sequence-master/components/view-sequence')))
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
		icon: Settings,
		order: 1,
		submodules: [
			{
				icon: Science,
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
				text: 'View Catalyst',
				path: 'catalyst-master/view-catalyst/:id',
				element: imports.viewCatalyst,
				permission: 'EDITCATALYST',
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
				icon: Timeline,
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
				text: 'View Sequence',
				path: 'sequence-master/view-sequence/:id',
				element: imports.viewSequence,
				permission: 'EDITPROCESSSEQUENCE',
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
