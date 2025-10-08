import { Chip, Box, Typography, useTheme } from '@mui/material';
import { AdminPanelSettings, Person } from '@mui/icons-material';
import { useCurrentRole } from '../../../hooks/useCurrentRole';

interface RoleIndicatorProps {
	variant?: 'chip' | 'badge' | 'full';
	size?: 'small' | 'medium';
	showIcon?: boolean;
	showPermissions?: boolean;
}

const RoleIndicator = ({
	variant = 'chip',
	size = 'medium',
	showIcon = true,
	showPermissions = false
}: RoleIndicatorProps) => {
	const theme = useTheme();
	const { currentRole, permissions } = useCurrentRole();

	const getRoleIcon = (roleName: string) => {
		const iconSize = size === 'small' ? 'small' : 'medium';

		switch (roleName.toLowerCase()) {
			case 'dev_admin':
			case 'admin':
				return <AdminPanelSettings fontSize={iconSize} />;
			default:
				return <Person fontSize={iconSize} />;
		}
	};

	const getRoleColor = (roleName: string) => {
		switch (roleName.toLowerCase()) {
			case 'dev_admin':
				return 'error';
			case 'admin':
				return 'secondary';
			case 'production':
				return 'primary';
			case 'supervisor':
			case 'manager':
				return 'info';
			case 'security':
				return 'warning';
			default:
				return 'default';
		}
	};

	const getRoleLabel = (roleName: string) => {
		return roleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
	};

	if (variant === 'full') {
		return (
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					{showIcon && getRoleIcon(currentRole.name)}
					<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
						{getRoleLabel(currentRole.name)}
					</Typography>
				</Box>
				{showPermissions && (
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
						{permissions.map((permission: string) => (
							<Chip key={permission} label={permission} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
						))}
					</Box>
				)}
			</Box>
		);
	}

	if (variant === 'badge') {
		return (
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				{showIcon && getRoleIcon(currentRole.name)}
				<Typography
					variant="body2"
					sx={{
						fontWeight: 500,
						color: theme.palette.text.secondary
					}}
				>
					{getRoleLabel(currentRole.name)}
				</Typography>
			</Box>
		);
	}

	// Default chip variant
	return (
		<Chip
			icon={showIcon ? getRoleIcon(currentRole.name) : undefined}
			label={getRoleLabel(currentRole.name)}
			color={
				getRoleColor(currentRole.name) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
			}
			size={size}
			variant="filled"
			sx={{
				fontWeight: 500,
				'& .MuiChip-icon': {
					color: 'inherit'
				}
			}}
		/>
	);
};

export default RoleIndicator;
