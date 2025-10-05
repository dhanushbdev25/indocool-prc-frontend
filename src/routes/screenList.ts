import Loadable from '../components/common/Loadable';
import { lazy } from 'react';
import PersonAdd from '@mui/icons-material/PersonAdd';
import { ListCatalyst } from '../pages/masters/catalyst-master/index';
ListCatalyst

const imports = {
	catalystMaster: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/list-catalyst'))),
	createCatalyst: Loadable(lazy(() => import('../pages/masters/catalyst-master/componets/create-catalyst')))
};

// Screen configurations - mapped to permissions
export const Screens = {
	LISTCATALYST: {
		icon: PersonAdd,
		path: 'listcatalyst',
		element: imports.catalystMaster
	},
	CREATECATALYST: {
		icon: PersonAdd,
		path: 'createcatalyst',
		element: imports.createCatalyst
	},
	EDITCATALYST: {
		icon: PersonAdd,
		path: 'editcatalyst/:id',
		element: imports.createCatalyst
	}
} as const;

export const sideBar = {
	LISTCATALYST: {
		icon: PersonAdd,
		text: 'Catalyst Master',
		path: 'listcatalyst'
	}
} as const;

export type SectionsType = typeof sideBar;
