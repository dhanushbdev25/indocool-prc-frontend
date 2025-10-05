import { sessionData } from '../store/api/userSessionContextParser';

export interface Role {
	id: number;
	name: string;
	permissions: string[];
}

export interface UserInfo {
	id: number;
	name: string;
	email: string;
}

export interface RoleContextType {
	currentRole: Role;
	availableRoles: Role[];
	userInfo: UserInfo;
	switchRole: (roleId: number) => void;
	getCurrentPermissions: () => string[];
}

export interface RoleProviderProps {
	children: React.ReactNode;
	sessionData: sessionData;
}
