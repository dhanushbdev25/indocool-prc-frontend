import { NavLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

type NavItemProps = {
	text: string;
	path: string;
	icon: React.ComponentType<{ fill?: string }>;
	open: boolean;
};

const NavItem = ({ text, path, icon: Icon, open }: NavItemProps) => (
	<NavLink to={path} style={{ textDecoration: 'none' }}>
		{({ isActive }) => (
			<ListItem disablePadding sx={{ display: 'block' }}>
				<ListItemButton
					sx={{
						minHeight: 48,
						justifyContent: open ? 'initial' : 'center',
						px: 2.5,
						backgroundColor: isActive ? '#1976d2' : 'transparent',
						transition: 'all 0.3s ease',
						'&:hover': {
							backgroundColor: isActive ? '#1565c0' : '#013987ff'
						}
					}}
				>
					<ListItemIcon
						sx={{
							minWidth: 0,
							mr: open ? 2 : 'auto',
							justifyContent: 'center',
							color: '#fff'
						}}
					>
						<Icon />
					</ListItemIcon>
					<ListItemText
						primary={<Typography sx={{ fontSize: 14, color: '#fff' }}>{text}</Typography>}
						sx={{ opacity: open ? 1 : 0 }}
					/>
				</ListItemButton>
			</ListItem>
		)}
	</NavLink>
);

export default NavItem;
