import Loadable from '../components/common/Loadable';
import { lazy } from 'react';
import {
	Science,
	Timeline,
	Settings,
	Checklist,
	Assignment,
	Build,
	PlayArrow,
	PlayCircleFilled
} from '@mui/icons-material';

// Lazy-loaded components
export const imports = {
	catalystMaster: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/list-catalyst'))),
	createCatalyst: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/create-catalyst'))),
	viewCatalyst: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/view-catalyst'))),
	sequenceMaster: Loadable(lazy(() => import('../pages/masters/sequence-master/components/list-sequence'))),
	createSequence: Loadable(lazy(() => import('../pages/masters/sequence-master/components/create-sequence'))),
	viewSequence: Loadable(lazy(() => import('../pages/masters/sequence-master/components/view-sequence'))),
	inspectionMaster: Loadable(lazy(() => import('../pages/masters/inspection-master/components/list-inspection'))),
	createInspection: Loadable(lazy(() => import('../pages/masters/inspection-master/components/create-inspection'))),
	viewInspection: Loadable(lazy(() => import('../pages/masters/inspection-master/components/view-inspection'))),
	prcTemplateMaster: Loadable(lazy(() => import('../pages/masters/prc-template-master/components/list-prc-template'))),
	createPrcTemplate: Loadable(
		lazy(() => import('../pages/masters/prc-template-master/components/create-prc-template'))
	),
	viewPrcTemplate: Loadable(lazy(() => import('../pages/masters/prc-template-master/components/view-prc-template'))),
	partMaster: Loadable(lazy(() => import('../pages/masters/part-master/components/list-part'))),
	createPart: Loadable(lazy(() => import('../pages/masters/part-master/components/create-part'))),
	viewPart: Loadable(lazy(() => import('../pages/masters/part-master/components/view-part'))),
	prcExecution: Loadable(lazy(() => import('../pages/prc-execution/components/list-prc-execution'))),
	viewPrcExecution: Loadable(lazy(() => import('../pages/prc-execution/components/view-prc-execution'))),
	executePrc: Loadable(lazy(() => import('../pages/prc-execution/components/execute-prc')))
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
			},
			{
				icon: Checklist,
				text: 'Inspection Master',
				path: 'inspection-master',
				element: imports.inspectionMaster,
				permission: 'EDITPROCESSSEQUENCE',
				order: 3,
				showInSidebar: true
			},
			{
				text: 'Create Inspection',
				path: 'inspection-master/create-inspection',
				element: imports.createInspection,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				text: 'View Inspection',
				path: 'inspection-master/view-inspection/:id',
				element: imports.viewInspection,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				text: 'Edit Inspection',
				path: 'inspection-master/edit-inspection/:id',
				element: imports.createInspection,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				icon: Assignment,
				text: 'PRC Template Master',
				path: 'prc-template-master',
				element: imports.prcTemplateMaster,
				permission: 'EDITPROCESSSEQUENCE',
				order: 4,
				showInSidebar: true
			},
			{
				text: 'Create PRC Template',
				path: 'prc-template-master/create-prc-template',
				element: imports.createPrcTemplate,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				text: 'View PRC Template',
				path: 'prc-template-master/view-prc-template/:id',
				element: imports.viewPrcTemplate,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				text: 'Edit PRC Template',
				path: 'prc-template-master/edit-prc-template/:id',
				element: imports.createPrcTemplate,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				icon: Build,
				text: 'Part Master',
				path: 'part-master',
				element: imports.partMaster,
				permission: 'EDITPROCESSSEQUENCE',
				order: 5,
				showInSidebar: true
			},
			{
				text: 'Create Part',
				path: 'part-master/create-part',
				element: imports.createPart,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				text: 'View Part',
				path: 'part-master/view-part/:id',
				element: imports.viewPart,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				text: 'Edit Part',
				path: 'part-master/edit-part/:id',
				element: imports.createPart,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			}
		]
	},
	{
		text: 'PRC Execution',
		icon: PlayArrow,
		order: 2,
		submodules: [
			{
				icon: PlayCircleFilled,
				text: 'Execute PRC',
				path: 'prc-execution',
				element: imports.prcExecution,
				permission: 'EDITPROCESSSEQUENCE',
				isInitial: true,
				order: 1,
				showInSidebar: true
			},
			{
				text: 'View PRC Execution',
				path: 'prc-execution/view/:id',
				element: imports.viewPrcExecution,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			},
			{
				text: 'Execute PRC',
				path: 'prc-execution/execute/:id',
				element: imports.executePrc,
				permission: 'EDITPROCESSSEQUENCE',
				showInSidebar: false
			}
		]
	}
];

// Flattened screen configurations for backward compatibility and routing
export const screenConfigs: ScreenConfig[] = mainModuleConfigs.flatMap(module => module.submodules);
