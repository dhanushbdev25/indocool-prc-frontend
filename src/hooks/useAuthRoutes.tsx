import { Navigate } from 'react-router-dom';
import Cookie from '../utils/Cookie';
import MainLayout from '../layouts/MainLayout';
import { Screens } from '../routes/screenList';
import { useSessionContextQuery } from '../store/api/auth/sessionApi';
import { LoginRoutes } from '../routes/LoginRoutes';
import NotFound from '../pages/general/NotFound';
import { Loading } from '../components/Loading';
import SessionError from '../pages/general/SessionError';

const LoadingRoutes = {
	path: '*',
	element: <Loading name="session" />
};

const ErrorRoutes = (error: string) => ({
	path: '*',
	element: <SessionError errMsg={error} />
});

export function useAuthRoutes() {
	const token = Cookie.getToken();

	const { data, isLoading, isError, errorMessage } = useSessionContextQuery(token);

	if (!token) return [LoginRoutes];

	if (isLoading || !data) return [LoadingRoutes];

	if (isError || !data) return [ErrorRoutes(errorMessage ?? 'unknown Error')];

	const { permissions = [] } = data;

	const dynamicRoutes = permissions
		.map(permission => {
			const key = permission.toUpperCase() as keyof typeof Screens;
			const ScreenComponent = Screens[key]?.element;
			const path = Screens[key]?.path;

			const moduleRoute = ScreenComponent
				? {
						path,
						element: <ScreenComponent />
					}
				: null;

			return moduleRoute;
		})
		.filter(x => x !== null);

	const finalRoutes = [
		{
			path: '/',
			element: <Navigate to={dynamicRoutes[0]?.path} replace />
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
