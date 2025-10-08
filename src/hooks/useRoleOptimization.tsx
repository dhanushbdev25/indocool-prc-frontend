import { useCallback, useMemo } from 'react';
import { useRole } from '../contexts/useRole';

/**
 * Hook for optimized role-based operations
 * Provides memoized functions and cached values to prevent unnecessary re-renders
 */
export const useRoleOptimization = () => {
	const { currentRole, getCurrentPermissions, availableRoles, switchRole } = useRole();

	// Memoize permissions to prevent recalculation on every render
	const permissions = useMemo(() => getCurrentPermissions(), [getCurrentPermissions]);

	// Memoize permission check functions
	const hasPermission = useCallback((permission: string) => permissions.includes(permission), [permissions]);

	const hasAnyPermission = useCallback(
		(permissionsList: string[]) => permissionsList.some(permission => permissions.includes(permission)),
		[permissions]
	);

	const hasAllPermissions = useCallback(
		(permissionsList: string[]) => permissionsList.every(permission => permissions.includes(permission)),
		[permissions]
	);

	// Memoize role information
	const roleInfo = useMemo(
		() => ({
			id: currentRole.id,
			name: currentRole.name,
			displayName: currentRole.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
			permissionsCount: permissions.length
		}),
		[currentRole.id, currentRole.name, permissions.length]
	);

	// Memoize available roles for dropdowns
	const roleOptions = useMemo(
		() =>
			availableRoles.map(role => ({
				id: role.id,
				name: role.name,
				displayName: role.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
				permissionsCount: role.permissions.length,
				isCurrent: role.id === currentRole.id
			})),
		[availableRoles, currentRole.id]
	);

	// Optimized role switching with validation
	const switchRoleOptimized = useCallback(
		(roleId: number) => {
			const targetRole = availableRoles.find(role => role.id === roleId);
			if (targetRole && targetRole.id !== currentRole.id) {
				switchRole(roleId);
			}
		},
		[availableRoles, currentRole.id, switchRole]
	);

	return {
		// Current role info
		currentRole,
		roleInfo,
		permissions,

		// Permission checks
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,

		// Role management
		availableRoles,
		roleOptions,
		switchRole: switchRoleOptimized,

		// Utility flags
		canSwitchRoles: availableRoles.length > 1,
		isMultiRole: availableRoles.length > 1
	};
};

export default useRoleOptimization;
