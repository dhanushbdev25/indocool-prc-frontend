import Loadable from '../components/common/Loadable';
import { lazy } from 'react';
import PersonAdd from '@mui/icons-material/PersonAdd';

const imports = {
	catalystMaster: Loadable(lazy(() => import('../pages/masters/catalyst-master')))
};

// Screen configurations - mapped to permissions
export const Screens = {
	LISTCATALYST: {
		icon: PersonAdd,
		path: 'listcatalyst',
		element: imports.catalystMaster
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
