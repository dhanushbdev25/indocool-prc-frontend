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
	console.log('useAuthRoutes');
	const token = Cookie.getToken(); // May be null in cross-origin scenarios, but cookie is sent automatically
	console.log('token', token);

	const { data, isLoading, isError, error, errorMessage } = useSessionContextQuery(token);
	console.log('data', data);
	console.log('isLoading', isLoading);
	console.log('isError', isError);
	console.log('error', error);
	console.log('errorMessage', errorMessage);
	
	// Always attempt session API - cookies are sent automatically with credentials: 'include'
	// In cross-origin scenarios, we can't read the cookie via JS, but the browser sends it automatically
	// If session API returns 401, show login page (not authenticated)
	// If loading, show loading state
	// If error (non-401), show error page
	// If success, proceed with authenticated routes
	
	// If loading or no data yet (and not an error), show loading
	// if (isLoading || (!data && !isError)) {
	// 	return [createLoadingRoutes()];
	// }
	
	// If error, check if it's an authentication error (401/403) - show login page
	if (isError) {
		const status = error && typeof error === 'object' && 'status' in error ? (error as any).status : null;
		
		// If 401 or 403, user is not authenticated - show login
		if (status === 401 || status === 403) {
			return [LoginRoutes];
		}
		// Otherwise show error page
		return [createErrorRoutes(errorMessage ?? 'unknown Error')];
	}
	
	// If no data and not loading/error, something unexpected happened
	if (!data) {
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
