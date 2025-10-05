import React, { useState } from 'react';
import {
	AppBar,
	Toolbar,
	Typography,
	Box,
	IconButton,
	Menu,
	MenuItem,
	Avatar,
	Chip,
	Button,
	useTheme,
	useMediaQuery,
	Divider,
	Tooltip
} from '@mui/material';
import {
	Logout,
	ExpandMore,
	Person,
	AdminPanelSettings
} from '@mui/icons-material';
import { useRole } from '../../../contexts/useRole';
import { useLogout } from '../../../hooks/useLogOut';

const TopBar: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const { currentRole, availableRoles, userInfo, switchRole } = useRole();
	const logout = useLogout();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [roleMenuAnchor, setRoleMenuAnchor] = useState<null | HTMLElement>(null);

	const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleRoleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setRoleMenuAnchor(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setRoleMenuAnchor(null);
	};

	const handleRoleChange = (roleId: number) => {
		switchRole(roleId);
		handleMenuClose();
	};

	const getRoleColor = (roleName: string) => {
		switch (roleName.toLowerCase()) {
			case 'dev_admin':
				return 'error';
			case 'production':
				return 'primary';
			case 'admin':
				return 'secondary';
			default:
				return 'default';
		}
	};

	const getRoleIcon = (roleName: string) => {
		if (roleName.toLowerCase().includes('admin')) {
			return <AdminPanelSettings sx={{ fontSize: 16 }} />;
		}
		return <Person sx={{ fontSize: 16 }} />;
	};

	return (
		<AppBar
			position="static"
			elevation={0}
			sx={{
				backgroundColor: '#ffffff',
				borderBottom: '1px solid #e0e0e0',
				boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
			}}
		>
			<Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
				{/* Left side - can be used for breadcrumbs or page title */}
				<Box sx={{ flexGrow: 1 }}>
					<Typography
						variant="h6"
						component="div"
						sx={{
							color: theme.palette.text.primary,
							fontWeight: 600,
							fontSize: '1.1rem'
						}}
					>
						PRC Digitization Portal
					</Typography>
				</Box>

				{/* Right side - User info and controls */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
					{/* Role Selector */}
					{availableRoles.length > 1 && (
						<>
							<Tooltip title="Switch Role">
								<Button
									variant="outlined"
									size="small"
									onClick={handleRoleMenuOpen}
									endIcon={<ExpandMore />}
									sx={{
										borderRadius: 2,
										textTransform: 'none',
										borderColor: theme.palette.primary.main,
										color: theme.palette.primary.main,
										'&:hover': {
											backgroundColor: theme.palette.primary.light + '20',
											borderColor: theme.palette.primary.dark
										}
									}}
								>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										{getRoleIcon(currentRole.name)}
										{!isMobile && (
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												{currentRole.name.replace('_', ' ')}
											</Typography>
										)}
									</Box>
								</Button>
							</Tooltip>

							<Menu
								anchorEl={roleMenuAnchor}
								open={Boolean(roleMenuAnchor)}
								onClose={handleMenuClose}
								PaperProps={{
									sx: {
										mt: 1,
										minWidth: 200,
										borderRadius: 2,
										boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
									}
								}}
							>
								<Box sx={{ px: 2, py: 1 }}>
									<Typography variant="subtitle2" color="text.secondary">
										Switch Role
									</Typography>
								</Box>
								<Divider />
								{availableRoles.map((role) => (
									<MenuItem
										key={role.id}
										onClick={() => handleRoleChange(role.id)}
										selected={role.id === currentRole.id}
										sx={{
											py: 1.5,
											px: 2,
											'&.Mui-selected': {
												backgroundColor: theme.palette.primary.light + '20'
											}
										}}
									>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
											{getRoleIcon(role.name)}
											<Box sx={{ flexGrow: 1 }}>
												<Typography variant="body2" sx={{ fontWeight: 500 }}>
													{role.name.replace('_', ' ')}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													{role.permissions.length} permissions
												</Typography>
											</Box>
											<Chip
												label={role.name.replace('_', ' ')}
												size="small"
												color={getRoleColor(role.name) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
												variant={role.id === currentRole.id ? 'filled' : 'outlined'}
											/>
										</Box>
									</MenuItem>
								))}
							</Menu>
						</>
					)}

					{/* User Profile */}
					<Tooltip title="User Profile">
						<IconButton
							size="large"
							onClick={handleProfileMenuOpen}
							sx={{
								color: theme.palette.text.primary,
								'&:hover': {
									backgroundColor: theme.palette.action.hover
								}
							}}
						>
							<Avatar
								sx={{
									width: 32,
									height: 32,
									backgroundColor: theme.palette.primary.main,
									fontSize: '0.875rem'
								}}
							>
								{userInfo.name.charAt(0).toUpperCase()}
							</Avatar>
						</IconButton>
					</Tooltip>

					<Menu
						anchorEl={anchorEl}
						open={Boolean(anchorEl)}
						onClose={handleMenuClose}
						PaperProps={{
							sx: {
								mt: 1,
								minWidth: 250,
								borderRadius: 2,
								boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
							}
						}}
					>
						<Box sx={{ px: 2, py: 2 }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
								{userInfo.name}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{userInfo.email}
							</Typography>
							<Box sx={{ mt: 1 }}>
								<Chip
									icon={getRoleIcon(currentRole.name)}
									label={currentRole.name.replace('_', ' ')}
									color={getRoleColor(currentRole.name) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
									size="small"
									variant="outlined"
								/>
							</Box>
						</Box>
						<Divider />
						<MenuItem
							onClick={logout}
							sx={{
								py: 1.5,
								px: 2,
								color: theme.palette.error.main,
								'&:hover': {
									backgroundColor: theme.palette.error.light + '20'
								}
							}}
						>
							<Logout sx={{ mr: 2, fontSize: 20 }} />
							<Typography variant="body2">Logout</Typography>
						</MenuItem>
					</Menu>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default TopBar;
