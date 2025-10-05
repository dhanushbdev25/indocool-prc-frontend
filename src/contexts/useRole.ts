import { useContext } from 'react';
import { RoleContext } from './RoleContext.context';
import { RoleContextType } from './RoleContext.types';

export const useRole = (): RoleContextType => {
	const context = useContext(RoleContext);
	if (context === undefined) {
		throw new Error('useRole must be used within a RoleProvider');
	}
	return context;
};
