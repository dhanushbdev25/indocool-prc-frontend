import { useRole } from '../contexts/useRole';

/**
 * Hook to get current role information and permissions
 * This hook provides a clean interface for components that need
 * to access the current user's role and permissions
 */
export const useCurrentRole = () => {
	const { currentRole, getCurrentPermissions, availableRoles, userInfo } = useRole();

	return {
		currentRole,
		permissions: getCurrentPermissions(),
		availableRoles,
		userInfo,
		hasPermission: (permission: string) => getCurrentPermissions().includes(permission),
		hasAnyPermission: (permissions: string[]) =>
			permissions.some(permission => getCurrentPermissions().includes(permission)),
		hasAllPermissions: (permissions: string[]) =>
			permissions.every(permission => getCurrentPermissions().includes(permission))
	};
};

export default useCurrentRole;
