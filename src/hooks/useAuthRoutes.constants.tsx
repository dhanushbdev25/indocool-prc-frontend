import { ReactElement } from 'react';
import { Loading } from '../components/Loading';
import SessionError from '../pages/general/SessionError';

export const createLoadingRoutes = (): { path: string; element: ReactElement } => ({
	path: '*',
	element: <Loading name="session" />
});

export const createErrorRoutes = (error: string): { path: string; element: ReactElement } => ({
	path: '*',
	element: <SessionError errMsg={error} />
});
