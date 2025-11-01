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
	
	// Demo workaround: Check localStorage if cookie not readable (GitHub Pages)
	const isLoggedInFromStorage = localStorage.getItem('isLoggedIn') === 'true';
	const loginTimestamp = localStorage.getItem('loginTimestamp');
	
	// If login was recent (within last 5 minutes) and no token, still try session query
	// This handles cases where cookie is HTTP-only or not immediately readable
	const shouldCheckSession = token || (isLoggedInFromStorage && loginTimestamp && 
		Date.now() - parseInt(loginTimestamp) < 5 * 60 * 1000);

	const { data, isLoading, isError, errorMessage } = useSessionContextQuery(shouldCheckSession ? 'check' : null);

	// If session query fails after recent login attempt, clear localStorage fallback
	if (isError && isLoggedInFromStorage && loginTimestamp && Date.now() - parseInt(loginTimestamp) < 5 * 60 * 1000) {
		localStorage.removeItem('isLoggedIn');
		localStorage.removeItem('loginTimestamp');
	}

	if (!shouldCheckSession) return [LoginRoutes];

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
