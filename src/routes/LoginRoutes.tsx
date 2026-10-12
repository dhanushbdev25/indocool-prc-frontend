import { lazy } from 'react';
import Loadable from '../components/common/Loadable';
import MinimalLayout from '../layouts/MinimalLayout';
import { Navigate } from 'react-router-dom';
const Login = Loadable(lazy(() => import('../pages/authentication/Login')));
const ForgotPassword = Loadable(lazy(() => import('../pages/authentication/ForgotPassword')));

export const LoginRoutes = {
	path: '/',
	element: <MinimalLayout />,
	children: [
		{
			index: true,
			element: <Login />
		},
		{
			path: 'forgot-password',
			element: <ForgotPassword />
		},
		{
			path: '*',
			element: <Navigate to="/" />
		}
	]
};
