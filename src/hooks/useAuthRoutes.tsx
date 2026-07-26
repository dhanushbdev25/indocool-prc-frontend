import { Navigate } from 'react-router-dom';
import Cookie from '../utils/Cookie';
import MainLayout from '../layouts/MainLayout';
import { getOrderedScreens, getInitialScreen } from '../routes/screenHelpers';
import { useSessionContextQuery } from '../store/api/auth/session.api';
import { LoginRoutes } from '../routes/LoginRoutes';
import NotFound from '../pages/general/NotFound';
import { getAllPermissions } from '../store/api/userSessionContextParser';
import { createLoadingRoutes, createErrorRoutes } from './useAuthRoutes.constants';
import { capturePostLoginRedirect } from '../utils/postLoginRedirect';

export function useAuthRoutes() {
	const token = Cookie.getToken();

	const { data, isLoading, isError, error, errorMessage } = useSessionContextQuery(token);

	if (!token) {
		capturePostLoginRedirect();
		return [LoginRoutes];
	}

	if (isLoading) {
		return [createLoadingRoutes()];
	}
	
	if (isError) {
		const status =
			error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
				? error.status
				: null;
		if (status === 401 || status === 403) {
			capturePostLoginRedirect();
			return [LoginRoutes];
		}
		return [createErrorRoutes(errorMessage ?? 'unknown Error')];
	}
	
	if (!data) {
		capturePostLoginRedirect();
		return [LoginRoutes];
	}


	// Use static permissions for initial route setup
	const permissions = getAllPermissions(data);
	const orderedScreens = getOrderedScreens(permissions);
	const initialScreen = getInitialScreen(permissions);

	// Create dynamic routes based on ordered screens
	const dynamicRoutes = orderedScreens.map(screen => ({
		path: screen.path,
		element: <screen.element />
	}));

	const finalRoutes = [
		{
			path: '/',
			element: <Navigate to={initialScreen?.path || '/not-found'} replace />
		},
		...dynamicRoutes,
		{ path: '*', element: <NotFound /> } //wildcard
	];

	return [
		{
			path: '/',
			element: <MainLayout />,
			children: finalRoutes
		}
	];
}
