import { NavLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';

type NavItemProps = {
	text: string;
	path: string;
	icon: React.ComponentType<{ fill?: string }>;
	open: boolean;
};

const NavItem = ({ text, path, icon: Icon, open }: NavItemProps) => (
	<NavLink to={path} style={{ textDecoration: 'none' }}>
		{({ isActive }) => {
			const navButton = (
				<ListItemButton
					sx={{
						minHeight: { xs: 44, sm: 40 }, // Ensure minimum touch target for tablets
						justifyContent: open ? 'initial' : 'center',
						px: open ? 2 : 1,
						py: 1,
						p: 1,
						mx: open ? 0.5 : 0.25,
						borderRadius: '8px',
						backgroundColor: isActive ? '#f1f5f9' : 'transparent',
						transition: 'all 0.2s ease',
						'&:hover': {
							backgroundColor: isActive ? '#e2e8f0' : 'rgba(148, 163, 184, 0.08)'
						}
					}}
				>
					<ListItemIcon
						sx={{
							minWidth: 0,
							mr: open ? 2 : 'auto',
							justifyContent: 'center',
							color: isActive ? '#475569' : '#94a3b8',
							transition: 'color 0.2s ease',
							'& svg': {
								fontSize: { xs: 20, sm: 18 } // Larger icons for tablets
							}
						}}
					>
						<Icon fill={isActive ? '#475569' : '#94a3b8'} />
					</ListItemIcon>
					<ListItemText
						primary={
							<Typography
								sx={{
									fontSize: 14,
									fontWeight: isActive ? 500 : 400,
									color: isActive ? '#334155' : '#64748b',
									letterSpacing: '-0.01em',
									transition: 'all 0.2s ease'
								}}
							>
								{text}
							</Typography>
						}
						sx={{
							opacity: open ? 1 : 0,
							transition: 'opacity 0.2s ease'
						}}
					/>
				</ListItemButton>
			);

			return (
				<ListItem disablePadding sx={{ display: 'block', mb: 0.25 }}>
					{open ? (
						navButton
					) : (
						<Tooltip title={text} placement="right" arrow>
							{navButton}
						</Tooltip>
					)}
				</ListItem>
			);
		}}
	</NavLink>
);

export default NavItem;
