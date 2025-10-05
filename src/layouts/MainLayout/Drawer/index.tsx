import { styled, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import { Box, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DrawerHeader from './DrawerHeader';
import { sideBar } from '../../../routes/screenList';
import NavItem from './NavItem';
import MenuIcon from '../../../components/svg/MenuIcon';
import { useLogout } from '../../../hooks/useLogOut';
import LogoutIcon from '@mui/icons-material/Logout';

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

const Header = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' })(({ theme, open }) => ({
	width: drawerWidth,
	flexShrink: 0,
	whiteSpace: 'nowrap',
	boxSizing: 'border-box',
	...(open && {
		...openedMixin(theme),
		'& .MuiDrawer-paper': openedMixin(theme)
	}),
	...(!open && {
		...closedMixin(theme),
		'& .MuiDrawer-paper': closedMixin(theme)
	})
}));

interface DrawerProps {
	open: boolean;
	handleDrawerToggle: () => void;
	permissions: string[];
}
export default function DrawerComp({ open, handleDrawerToggle, permissions }: Readonly<DrawerProps>) {
	const logout = useLogout();
	const menuItems = permissions
		.map(permission => {
			const key = permission.toUpperCase() as keyof typeof sideBar;
			const element = sideBar[key];
			if (!element) return null;
			return element;
		})
		.filter(x => x !== null);
	return (
		<Box sx={{ display: 'flex' }}>
			<Drawer
				variant="permanent"
				open={open}
				PaperProps={{
					sx: {
						borderRadius: 0,
						backgroundColor: '#012B64',
						color: '#fff',
						display: 'flex',
						flexDirection: 'column'
					}
				}}
			>
				<Header>
					<DrawerHeader open={open} />
					<IconButton onClick={handleDrawerToggle} sx={open ? {} : { position: 'relative', left: -10 }}>
						<MenuIcon fill="white" />
					</IconButton>
				</Header>
				<List>
					{menuItems.map(item => (
						<List key={item.path} sx={{ mb: 1.5, py: 0, zIndex: 0 }}>
							<NavItem key={item.path} text={item.text} path={item.path} icon={item.icon} open={open} />
						</List>
					))}
				</List>

				<List sx={{ mt: 'auto', ml: '15px' }}>
					<ListItemButton onClick={logout}>
						<ListItemIcon sx={{ position: 'relative', left: -10 }}>
							<LogoutIcon sx={{ color: 'white' }} />
						</ListItemIcon>

						{open && <ListItemText primary="Logout" />}
					</ListItemButton>
				</List>
			</Drawer>
		</Box>
	);
}
