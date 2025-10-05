import React, { useState, useCallback, useMemo } from 'react';
import { Role, RoleProviderProps } from './RoleContext.types';
import { RoleContext } from './RoleContext.context';

export const RoleProvider: React.FC<RoleProviderProps> = ({ children, sessionData }) => {
	const [currentRoleId, setCurrentRoleId] = useState<number>(sessionData.defaultRole.id);

	// Get all available roles (default + other roles)
	const availableRoles: Role[] = useMemo(() => [
		sessionData.defaultRole,
		...sessionData.otherRoles
	], [sessionData.defaultRole, sessionData.otherRoles]);

	// Get current role based on selected role ID
	const currentRole = availableRoles.find(role => role.id === currentRoleId) || sessionData.defaultRole;

	// User info
	const userInfo = {
		id: sessionData.id,
		name: sessionData.name,
		email: sessionData.email
	};

	// Switch role function
	const switchRole = useCallback((roleId: number) => {
		const roleExists = availableRoles.find(role => role.id === roleId);
		if (roleExists) {
			setCurrentRoleId(roleId);
		}
	}, [availableRoles]);

	// Get current permissions
	const getCurrentPermissions = useCallback(() => {
		return currentRole.permissions;
	}, [currentRole]);

	const value: RoleContextType = {
		currentRole,
		availableRoles,
		userInfo,
		switchRole,
		getCurrentPermissions
	};

	return (
		<RoleContext.Provider value={value}>
			{children}
		</RoleContext.Provider>
	);
};

