import { ReactNode } from 'react';
import { useCurrentRole } from '../../../hooks/useCurrentRole';

interface RoleGuardProps {
	children: ReactNode;
	permissions?: string[];
	roles?: string[];
	requireAll?: boolean; // If true, user must have ALL permissions/roles. If false, user needs ANY
	fallback?: ReactNode;
}

/**
 * RoleGuard component for conditional rendering based on user permissions and roles
 *
 * @param children - Components to render if user has required permissions/roles
 * @param permissions - Array of permission strings required
 * @param roles - Array of role names required
 * @param requireAll - If true, user must have ALL specified permissions/roles. Default: false
 * @param fallback - Component to render if user doesn't have required permissions/roles
 */
const RoleGuard = ({ children, permissions = [], roles = [], requireAll = false, fallback = null }: RoleGuardProps) => {
	const { currentRole, hasAnyPermission, hasAllPermissions } = useCurrentRole();

	// Check role requirements
	const hasRequiredRoles =
		roles.length === 0 ||
		(requireAll ? roles.every(role => currentRole.name === role) : roles.some(role => currentRole.name === role));

	// Check permission requirements
	const hasRequiredPermissions =
		permissions.length === 0 || (requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions));

	// User must have both required roles AND permissions
	const hasAccess = hasRequiredRoles && hasRequiredPermissions;

	return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;
