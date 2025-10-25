import { styled, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import { Box } from '@mui/material';
import { getSidebarModules } from '../../../routes/screenHelpers';
import HierarchicalNavItem from './HierarchicalNavItem';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
	width: drawerWidth,
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen
	}),
	overflowX: 'hidden'
});

const closedMixin = (theme: Theme): CSSObject => ({
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen
	}),
	overflowX: 'hidden',
	width: `calc(${theme.spacing(7)} + 1px)`,
	[theme.breakpoints.up('sm')]: {
		width: `calc(${theme.spacing(8)} + 1px)`
	}
});

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' })(({ theme, open }) => ({
	width: drawerWidth,
	flexShrink: 0,
	whiteSpace: 'nowrap',
	boxSizing: 'border-box',
	'& .MuiDrawer-paper': {
		borderRight: 'none',
		boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
		backdropFilter: 'blur(20px)',
		...(open && {
			...openedMixin(theme)
		}),
		...(!open && {
			...closedMixin(theme)
		})
	}
}));

interface DrawerProps {
	open: boolean;
	handleDrawerToggle: () => void;
	permissions: string[];
}
export default function DrawerComp({ open, permissions }: Readonly<DrawerProps>) {
	const menuModules = getSidebarModules(permissions);
	return (
		<Box sx={{ display: 'flex' }}>
			<Drawer
				variant="permanent"
				open={open}
				slotProps={{
					paper: {
						sx: {
							backgroundColor: '#ffffff',
							color: '#1e293b',
							display: 'flex',
							flexDirection: 'column',
							borderRight: '1px solid rgba(226, 232, 240, 0.8)',
							backdropFilter: 'blur(20px)',
							boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
						}
					}
				}}
			>
				<List sx={{ py: 1, mt: { xs: 8, sm: 8, md: 8 } }}>
					{menuModules.map(module => (
						<HierarchicalNavItem key={module.text} module={module} open={open} />
					))}
				</List>
			</Drawer>
		</Box>
	);
}
