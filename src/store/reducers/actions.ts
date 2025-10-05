export const LOGOUT = 'LOGOUT';

export const logoutApp = () => {
	return {
		type: LOGOUT as typeof LOGOUT
	};
};

export type AuthActionTypes = ReturnType<typeof logoutApp>;
