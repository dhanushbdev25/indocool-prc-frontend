// third-party
import { Middleware, MiddlewareAPI, configureStore, isRejectedWithValue } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';

// project import
import appReducer from './reducers';
import { authApi } from './api/auth/authApi';
import { sessionApi } from './api/auth/sessionApi';
import { logoutApp } from './reducers/actions';
import { myProjectAPI } from './api/business/myProject/myProject.api';
import { dashboardApi } from './api/business/dashboard/dashboard.api';
import { newRequestAPI } from './api/business/requests/newRequestAPI';
import { configurationAPI } from './api/business/configuration/configure.api';

// ==============================|| REDUX TOOLKIT - MAIN STORE ||============================== //

export const rtkQueryErrorLogger: Middleware = (_api: MiddlewareAPI) => next => action => {
	if (isRejectedWithValue(action)) {
		const { status, data, error } = action.payload || {};
		let text = data?.msg || data?.message || error || 'server error';

		if (status === 401) {
			store.dispatch(logoutApp());
			text = 'session error';
		}

		Swal.fire({
			icon: 'error',
			title: 'Error',
			text
		});
	}
	return next(action);
};

export const store = configureStore({
	reducer: appReducer,
	devTools: process.env.NODE_ENV !== 'production',
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware().concat([
			authApi.middleware,
			sessionApi.middleware,
			dashboardApi.middleware,
			myProjectAPI.middleware,
			newRequestAPI.middleware,
			configurationAPI.middleware,
			rtkQueryErrorLogger
		])
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
