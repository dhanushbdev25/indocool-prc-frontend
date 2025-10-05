// MUI deep merge utility
import { deepmerge } from '@mui/utils';

// project import
import Badge from './Badge';
import Button from './Button';
import CardContent from './CardContent';
import Checkbox from './Checkbox';
import Chip from './Chip';
import IconButton from './IconButton';
import InputLabel from './InputLabel';
import LinearProgress from './LinearProgress';
import Link from './Link';
import ListItemIcon from './ListItemIcon';
import OutlinedInput from './OutlinedInput';
import Tab from './Tab';
import TableCell from './TableCell';
import Tabs from './Tabs';
import Typography from './Typography';
import DataGrid from './DataGrid';
import ScrollBar from './ScrollBar';
import Paper from './Paper';
import NumberInputOverride from './NumberInputOverride';

// ==============================|| OVERRIDES - MAIN ||============================== //

function mergeMany<T>(...objects: T[]): T {
	return objects.reduce((acc, obj) => deepmerge(acc, obj), {} as T);
}

import { Theme } from '@mui/material/styles';

export default function ComponentsOverrides(theme: Theme) {
	return mergeMany(
		Button(theme),
		// @ts-expect-error TODO: fix when all component overrides are merged
		Paper(),
		Badge(theme),
		CardContent(),
		Checkbox(theme),
		Chip(theme),
		IconButton(theme),
		InputLabel(theme),
		NumberInputOverride(),
		LinearProgress(),
		Link(),
		DataGrid(theme),
		ListItemIcon(),
		OutlinedInput(theme),
		Tab(theme),
		TableCell(theme),
		Tabs(),
		Typography(),
		ScrollBar(theme)
	);
}
