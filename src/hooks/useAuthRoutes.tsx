import { Navigate } from 'react-router-dom';
import Cookie from '../utils/Cookie';
import MainLayout from '../layouts/MainLayout';
import { getOrderedScreens, getInitialScreen } from '../routes/screenHelpers';
import { useSessionContextQuery } from '../store/api/auth/session.api';
import { LoginRoutes } from '../routes/LoginRoutes';
import NotFound from '../pages/general/NotFound';
import { getAllPermissions } from '../store/api/userSessionContextParser';
import { createLoadingRoutes, createErrorRoutes } from './useAuthRoutes.constants';

export function useAuthRoutes() {
	const token = Cookie.getToken();

	const { data, isLoading, isError, errorMessage } = useSessionContextQuery(token);

	if (!token) return [LoginRoutes];

	if (isLoading || !data) return [createLoadingRoutes()];

	if (isError || !data) return [createErrorRoutes(errorMessage ?? 'unknown Error')];

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
