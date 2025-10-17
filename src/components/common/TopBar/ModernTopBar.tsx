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
	Divider,
	Tooltip,
	Stack,
	Badge,
	useTheme,
	FormControl,
	Select
} from '@mui/material';
import {
	Menu as MenuIcon,
	Logout,
	Person,
	AdminPanelSettings,
	Security,
	SupervisorAccount,
	Settings,
	NotificationsNone
} from '@mui/icons-material';
import { useRole } from '../../../contexts/useRole';
import { useLogout } from '../../../hooks/useLogOut';

interface ModernTopBarProps {
	onMenuToggle: () => void;
	drawerOpen: boolean;
}

const ModernTopBar = ({ onMenuToggle, drawerOpen }: ModernTopBarProps) => {
	const theme = useTheme();
	const { currentRole, availableRoles, userInfo, switchRole } = useRole();
	const logout = useLogout();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleRoleChange = (roleId: number) => {
		switchRole(roleId);
		handleMenuClose();
	};

	const getRoleIcon = (roleName: string) => {
		const iconProps = { sx: { fontSize: 18 } };
		switch (roleName.toLowerCase()) {
			case 'dev_admin':
			case 'admin':
				return <AdminPanelSettings {...iconProps} />;
			case 'supervisor':
			case 'manager':
				return <SupervisorAccount {...iconProps} />;
			case 'security':
				return <Security {...iconProps} />;
			default:
				return <Person {...iconProps} />;
		}
	};

	const getRoleColor = (roleName: string) => {
		switch (roleName.toLowerCase()) {
			case 'dev_admin':
				return '#f44336';
			case 'admin':
				return '#9c27b0';
			case 'production':
				return '#2196f3';
			case 'supervisor':
			case 'manager':
				return '#00bcd4';
			case 'security':
				return '#ff9800';
			default:
				return '#757575';
		}
	};

	const getRoleDisplayName = (roleName: string) => {
		return roleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
	};

	return (
		<AppBar
			position="fixed"
			elevation={0}
			sx={{
				backgroundColor: '#ffffff',
				borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
				backdropFilter: 'blur(20px)',
				zIndex: theme.zIndex.drawer + 1,
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
			}}
		>
			<Toolbar
				sx={{
					minHeight: '64px !important',
					px: { xs: 2, sm: 2.5, md: 3 },
					justifyContent: 'space-between'
				}}
			>
				{/* Left Section - Menu Toggle & Logo */}
				<Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
					<IconButton
						onClick={onMenuToggle}
						sx={{
							color: '#1a1a1a',
							backgroundColor: drawerOpen ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
							'&:hover': {
								backgroundColor: 'rgba(0, 0, 0, 0.08)',
								transform: 'scale(1.05)'
							},
							transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
							borderRadius: '12px',
							width: { xs: 36, md: 40 },
							height: { xs: 36, md: 40 }
						}}
					>
						<MenuIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
					</IconButton>

					<Typography
						variant="h6"
						component="div"
						sx={{
							color: '#1a1a1a',
							fontWeight: 600,
							fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
							letterSpacing: '-0.02em'
						}}
					>
						{process.env.VITE_APP_NAME || 'Error loading app name, please check the environment variables'}
					</Typography>
				</Stack>

				{/* Right Section - Notifications & User Profile */}
				<Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1, md: 1 }}>
					{/* Notifications */}
					<Tooltip title="Notifications">
						<IconButton
							sx={{
								color: '#666666',
								'&:hover': {
									backgroundColor: 'rgba(0, 0, 0, 0.04)',
									color: '#1a1a1a'
								},
								transition: 'all 0.2s ease',
								borderRadius: '12px',
								width: { xs: 36, md: 40 },
								height: { xs: 36, md: 40 }
							}}
						>
							<Badge badgeContent={0} color="error" variant="dot">
								<NotificationsNone sx={{ fontSize: { xs: 18, md: 20 } }} />
							</Badge>
						</IconButton>
					</Tooltip>

					{/* User Profile */}
					<Tooltip title="Account Settings">
						<IconButton
							onClick={handleProfileMenuOpen}
							sx={{
								p: 0,
								'&:hover': {
									transform: 'scale(1.05)'
								},
								transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
							}}
						>
							<Avatar
								sx={{
									width: { xs: 32, md: 36 },
									height: { xs: 32, md: 36 },
									backgroundColor: '#6366f1',
									fontSize: '0.875rem',
									fontWeight: 600,
									border: '2px solid #ffffff',
									boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
								}}
							>
								{userInfo.name.charAt(0).toUpperCase()}
							</Avatar>
						</IconButton>
					</Tooltip>

					{/* User Profile Menu */}
					<Menu
						anchorEl={anchorEl}
						open={Boolean(anchorEl)}
						onClose={handleMenuClose}
						PaperProps={{
							sx: {
								mt: 1.5,
								minWidth: 320,
								borderRadius: '16px',
								boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
								border: '1px solid rgba(0, 0, 0, 0.05)',
								overflow: 'hidden'
							}
						}}
						transformOrigin={{ horizontal: 'right', vertical: 'top' }}
						anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
					>
						<Box>
							{/* User Info Header */}
							<Box sx={{ p: 3, pb: 2 }}>
								<Stack direction="row" alignItems="center" spacing={2}>
									<Avatar
										sx={{
											width: 48,
											height: 48,
											backgroundColor: '#6366f1',
											fontSize: '1.125rem',
											fontWeight: 600
										}}
									>
										{userInfo.name.charAt(0).toUpperCase()}
									</Avatar>
									<Box sx={{ flexGrow: 1, minWidth: 0 }}>
										<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
											{userInfo.name}
										</Typography>
										<Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem' }}>
											{userInfo.email}
										</Typography>
									</Box>
								</Stack>
							</Box>

							<Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.06)' }} />

							{/* Current Role Display */}
							<Box sx={{ p: 2, pt: 2.5 }}>
								<Typography
									variant="caption"
									sx={{ color: '#666666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
								>
									Current Role
								</Typography>
								<Box sx={{ mt: 1.5, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: '12px' }}>
									<Stack direction="row" alignItems="center" spacing={2}>
										<Box
											sx={{
												width: 32,
												height: 32,
												borderRadius: '8px',
												backgroundColor: getRoleColor(currentRole.name) + '15',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: getRoleColor(currentRole.name)
											}}
										>
											{getRoleIcon(currentRole.name)}
										</Box>
										<Box sx={{ flexGrow: 1 }}>
											<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
												{getRoleDisplayName(currentRole.name)}
											</Typography>
											<Typography variant="caption" sx={{ color: '#666666' }}>
												{currentRole.permissions.length} permissions
											</Typography>
										</Box>
									</Stack>
								</Box>
							</Box>

							{/* Role Switching Section */}
							{availableRoles.length > 1 && (
								<>
									<Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.06)' }} />
									<Box sx={{ p: 2 }}>
										<Typography
											variant="caption"
											sx={{
												color: '#666666',
												fontWeight: 500,
												textTransform: 'uppercase',
												letterSpacing: '0.5px',
												mb: 1.5,
												display: 'block'
											}}
										>
											Switch Role
										</Typography>
										<FormControl fullWidth size="small">
											<Select
												value={currentRole.id}
												onChange={e => handleRoleChange(Number(e.target.value))}
												displayEmpty
												sx={{
													borderRadius: '12px',
													backgroundColor: 'rgba(0, 0, 0, 0.02)',
													'& .MuiOutlinedInput-notchedOutline': {
														border: '1px solid rgba(0, 0, 0, 0.08)',
														borderRadius: '12px'
													},
													'&:hover .MuiOutlinedInput-notchedOutline': {
														borderColor: 'rgba(0, 0, 0, 0.15)'
													},
													'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
														borderColor: '#6366f1',
														borderWidth: '2px'
													}
												}}
												MenuProps={{
													PaperProps: {
														sx: {
															borderRadius: '12px',
															boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
															border: '1px solid rgba(0, 0, 0, 0.08)',
															mt: 1
														}
													}
												}}
											>
												{availableRoles.map((role: typeof currentRole) => (
													<MenuItem
														key={role.id}
														value={role.id}
														sx={{
															py: 1.5,
															px: 2,
															borderRadius: '8px',
															mx: 1,
															my: 0.5,
															'&:hover': {
																backgroundColor: 'rgba(99, 102, 241, 0.08)'
															},
															'&.Mui-selected': {
																backgroundColor: 'rgba(99, 102, 241, 0.12)',
																'&:hover': {
																	backgroundColor: 'rgba(99, 102, 241, 0.16)'
																}
															}
														}}
													>
														<Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
															<Box
																sx={{
																	width: 32,
																	height: 32,
																	borderRadius: '8px',
																	backgroundColor: getRoleColor(role.name) + '15',
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																	color: getRoleColor(role.name)
																}}
															>
																{getRoleIcon(role.name)}
															</Box>
															<Box sx={{ flexGrow: 1 }}>
																<Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
																	{getRoleDisplayName(role.name)}
																</Typography>
																<Typography variant="caption" sx={{ color: '#666666' }}>
																	{role.permissions.length} permissions
																</Typography>
															</Box>
															{role.id === currentRole.id && (
																<Chip
																	label="Active"
																	size="small"
																	sx={{
																		backgroundColor: getRoleColor(role.name),
																		color: 'white',
																		fontSize: '0.75rem',
																		height: 20,
																		fontWeight: 500
																	}}
																/>
															)}
														</Stack>
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</Box>
								</>
							)}

							<Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.06)' }} />

							{/* Menu Actions */}
							<Box sx={{ p: 1 }}>
								{[
									<MenuItem
										key="settings"
										sx={{
											p: 1.5,
											borderRadius: '12px',
											'&:hover': {
												backgroundColor: 'rgba(0, 0, 0, 0.04)'
											}
										}}
									>
										<Stack direction="row" alignItems="center" spacing={2}>
											<Settings sx={{ fontSize: 20, color: '#666666' }} />
											<Typography variant="body2" sx={{ color: '#1a1a1a' }}>
												Settings
											</Typography>
										</Stack>
									</MenuItem>,

									<MenuItem
										key="logout"
										onClick={logout}
										sx={{
											p: 1.5,
											borderRadius: '12px',
											'&:hover': {
												backgroundColor: 'rgba(244, 67, 54, 0.08)'
											}
										}}
									>
										<Stack direction="row" alignItems="center" spacing={2}>
											<Logout sx={{ fontSize: 20, color: '#f44336' }} />
											<Typography variant="body2" sx={{ color: '#f44336', fontWeight: 500 }}>
												Sign Out
											</Typography>
										</Stack>
									</MenuItem>
								]}
							</Box>
						</Box>
					</Menu>
				</Stack>
			</Toolbar>
		</AppBar>
	);
};

export default ModernTopBar;
