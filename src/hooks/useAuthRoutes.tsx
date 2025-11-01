import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { getOrderedScreens, getInitialScreen } from '../routes/screenHelpers';
import { LoginRoutes } from '../routes/LoginRoutes';
import NotFound from '../pages/general/NotFound';
import { getAllPermissions } from '../store/api/userSessionContextParser';
import { createLoadingRoutes } from './useAuthRoutes.constants';
import type { sessionData } from '../store/api/userSessionContextParser';
import { userSessionContextparser } from '../store/api/userSessionContextParser';

export function useAuthRoutes() {
	// DEMO: Simple approach - use localStorage session data directly
	const [sessionData, setSessionData] = useState<sessionData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
		
		if (isLoggedIn) {
			// Try to get session from localStorage first
			const storedSession = localStorage.getItem('userSession');
			
			if (storedSession) {
				try {
					const parsed = JSON.parse(storedSession);
					const validated = userSessionContextparser.safeParse(parsed);
					
					if (validated.success) {
						setSessionData(validated.data);
						setIsLoading(false);
						return;
					}
				} catch (error) {
					console.error('Failed to parse stored session:', error);
				}
			}
			
			// If localStorage doesn't have valid session, try to fetch from API
			// This handles cases where localStorage was cleared but user still has cookie
			const fetchSession = async () => {
				try {
					const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || process.env.API_BASE_URL || '';
					const response = await fetch(`${apiBaseUrl}/session`, {
						method: 'GET',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json' }
					});
					
					if (response.ok) {
						const data = await response.json();
						const validated = userSessionContextparser.safeParse(data);
						
						if (validated.success) {
							// Store in localStorage for next time
							localStorage.setItem('userSession', JSON.stringify(validated.data));
							setSessionData(validated.data);
						} else {
							// Invalid session data, clear localStorage
							localStorage.removeItem('isLoggedIn');
							localStorage.removeItem('userSession');
						}
					} else {
						// Session expired or invalid, clear localStorage
						localStorage.removeItem('isLoggedIn');
						localStorage.removeItem('userSession');
					}
				} catch (error) {
					console.error('Failed to fetch session:', error);
					// On error, clear localStorage to prevent stuck state
					localStorage.removeItem('isLoggedIn');
					localStorage.removeItem('userSession');
				} finally {
					setIsLoading(false);
				}
			};
			
			fetchSession();
		} else {
			setIsLoading(false);
		}
	}, []);

	if (isLoading) return [createLoadingRoutes()];

	if (!sessionData) return [LoginRoutes];

	// Use static permissions for initial route setup
	const permissions = getAllPermissions(sessionData);
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
