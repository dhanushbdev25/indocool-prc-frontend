import Loadable from '../components/common/Loadable';
import { lazy } from 'react';
import {
	Science,
	Timeline,
	Settings,
	Checklist,
	Build,
	PlayArrow,
	PlayCircleFilled,
	Dashboard as DashboardIcon,
	CloudSync,
	Monitor as MonitorIcon
} from '@mui/icons-material';

// Lazy-loaded components
export const imports = {
	dashboard: Loadable(lazy(() => import('../pages/dashboard/Dashboard'))),
	catalystMaster: Loadable(lazy(() => import('../pages/masters/catalyst-master/components/list-catalyst'))),
	createCatalyst: Loadable(lazy(() => import('../pages/masters/catalyst-master/components/create-catalyst'))),
	viewCatalyst: Loadable(lazy(() => import('../pages/masters/catalyst-master/components/view-catalyst'))),
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
	mouldReconciliation: Loadable(
		lazy(() => import('../pages/masters/mould-reconciliation/components/list-mould-reconciliation'))
	),
	sapJobs: Loadable(lazy(() => import('../pages/sap-jobs/components/list-sap-jobs'))),
	sapJobRunHistory: Loadable(lazy(() => import('../pages/sap-jobs/components/view-sap-job-history'))),
	prcExecution: Loadable(lazy(() => import('../pages/prc-execution/components/list-prc-execution'))),
	viewPrcExecution: Loadable(lazy(() => import('../pages/prc-execution/components/view-prc-execution'))),
	executePrc: Loadable(lazy(() => import('../pages/prc-execution/components/execute-prc'))),
	prcExecutionReport: Loadable(lazy(() => import('../pages/prc-execution/components/report-prc-execution')))
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
		text: 'Dashboard',
		icon: DashboardIcon,
		order: 0,
		submodules: [
			{
				icon: DashboardIcon,
				text: 'Analytics Dashboard',
				path: 'dashboard',
				element: imports.dashboard,
				permission: 'PRODUCTION_DASHBOARD_VIEW',
				isInitial: true,
				order: 1,
				showInSidebar: true
			}
		]
	},
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
				permission: 'CATALYST_MASTER_VIEW',
				order: 1,
				showInSidebar: true
			},
			{
				text: 'Create Catalyst',
				path: 'catalyst-master/create-catalyst',
				element: imports.createCatalyst,
				permission: 'CATALYST_MASTER_CREATE',
				showInSidebar: false
			},
			{
				text: 'View Catalyst',
				path: 'catalyst-master/view-catalyst/:id',
				element: imports.viewCatalyst,
				permission: 'CATALYST_MASTER_VIEW',
				showInSidebar: false
			},
			{
				text: 'Edit Catalyst',
				path: 'catalyst-master/edit-catalyst/:id',
				element: imports.createCatalyst,
				permission: 'CATALYST_MASTER_EDIT',
				showInSidebar: false
			},
			{
				icon: Timeline,
				text: 'Sequence Master',
				path: 'sequence-master',
				element: imports.sequenceMaster,
				permission: 'SEQUENCE_MASTER_VIEW',
				order: 2,
				showInSidebar: true
			},
			{
				text: 'Create Sequence',
				path: 'sequence-master/create-sequence',
				element: imports.createSequence,
				permission: 'SEQUENCE_MASTER_CREATE',
				showInSidebar: false
			},
			{
				text: 'View Sequence',
				path: 'sequence-master/view-sequence/:id',
				element: imports.viewSequence,
				permission: 'SEQUENCE_MASTER_VIEW',
				showInSidebar: false
			},
			{
				text: 'Edit Sequence',
				path: 'sequence-master/edit-sequence/:id',
				element: imports.createSequence,
				permission: 'SEQUENCE_MASTER_EDIT',
				showInSidebar: false
			},
			{
				text: 'Clone Sequence',
				path: 'sequence-master/clone-sequence/:id',
				element: imports.createSequence,
				permission: 'SEQUENCE_MASTER_CREATE',
				showInSidebar: false
			},
			{
				icon: Checklist,
				text: 'Inspection Master',
				path: 'inspection-master',
				element: imports.inspectionMaster,
				permission: 'INSPECTION_MASTER_VIEW',
				order: 3,
				showInSidebar: true
			},
			{
				text: 'Create Inspection',
				path: 'inspection-master/create-inspection',
				element: imports.createInspection,
				permission: 'INSPECTION_MASTER_CREATE',
				showInSidebar: false
			},
			{
				text: 'View Inspection',
				path: 'inspection-master/view-inspection/:id',
				element: imports.viewInspection,
				permission: 'INSPECTION_MASTER_VIEW',
				showInSidebar: false
			},
			{
				text: 'Edit Inspection',
				path: 'inspection-master/edit-inspection/:id',
				element: imports.createInspection,
				permission: 'INSPECTION_MASTER_EDIT',
				showInSidebar: false
			},
			{
				text: 'Clone Inspection',
				path: 'inspection-master/clone-inspection/:id',
				element: imports.createInspection,
				permission: 'INSPECTION_MASTER_CREATE',
				showInSidebar: false
			},
			{
				icon: Build,
				text: 'Part Master',
				path: 'part-master',
				element: imports.partMaster,
				permission: 'PART_MASTER_VIEW',
				order: 5,
				showInSidebar: true
			},
			{
				text: 'Create Part',
				path: 'part-master/create-part',
				element: imports.createPart,
				permission: 'PART_MASTER_CREATE',
				showInSidebar: false
			},
			{
				text: 'View Part',
				path: 'part-master/view-part/:id',
				element: imports.viewPart,
				permission: 'PART_MASTER_VIEW',
				showInSidebar: false
			},
			{
				text: 'Edit Part',
				path: 'part-master/edit-part/:id',
				element: imports.createPart,
				permission: 'PART_MASTER_EDIT',
				showInSidebar: false
			},
			{
				icon: Build,
				text: 'Mould Reconciliation',
				path: 'mould-reconciliation',
				element: imports.mouldReconciliation,
				permission: 'MOULD_RECONCILIATION_VIEW',
				order: 6,
				showInSidebar: true
			}
		]
	},
	{
		text: 'Monitor',
		icon: MonitorIcon,
		order: 2,
		submodules: [
			{
				icon: CloudSync,
				text: 'SAP integration jobs',
				path: 'sap-jobs',
				element: imports.sapJobs,
				permission: 'SAP_INTEGRATION_JOBS_VIEW',
				order: 1,
				showInSidebar: true
			},
			{
				text: 'SAP job run history',
				path: 'sap-jobs/history/:jobKey',
				element: imports.sapJobRunHistory,
				permission: 'SAP_INTEGRATION_JOBS_VIEW',
				showInSidebar: false
			}
		]
	},
	{
		text: 'PRC Execution',
		icon: PlayArrow,
		order: 3,
		submodules: [
			{
				icon: PlayCircleFilled,
				text: 'Execute PRC',
				path: 'prc-execution',
				element: imports.prcExecution,
				permission: 'PRC_EXECUTION_VIEW',
				order: 1,
				showInSidebar: true
			},
			{
				text: 'View PRC Execution',
				path: 'prc-execution/view/:id',
				element: imports.viewPrcExecution,
				permission: 'PRC_EXECUTION_VIEW',
				showInSidebar: false
			},
			{
				text: 'Consolidated report',
				path: 'prc-execution/report/:id',
				element: imports.prcExecutionReport,
				permission: 'PRC_EXECUTION_VIEW',
				showInSidebar: false
			},
			{
				text: 'Execute PRC',
				path: 'prc-execution/execute/:id',
				element: imports.executePrc,
				permission: 'PRC_EXECUTION_EDIT',
				showInSidebar: false
			}
		]
	}
];

// Flattened screen configurations for backward compatibility and routing
export const screenConfigs: ScreenConfig[] = mainModuleConfigs.flatMap(module => module.submodules);
