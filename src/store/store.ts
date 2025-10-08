// third-party
import { Middleware, configureStore, isRejectedWithValue } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';

// project import
import appReducer from './reducers';
import { authApi } from './api/auth/auth.api';
import { sessionApi } from './api/auth/session.api';
import { catalystApi } from './api/business/catalyst-master/catalyst.api';
import { logoutApp } from './reducers/actions';
import { sequenceApi } from './api/business/sequence-master/sequence.api';

// ==============================|| REDUX TOOLKIT - MAIN STORE ||============================== //

export const rtkQueryErrorLogger: Middleware = () => next => action => {
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
			catalystApi.middleware,
			sequenceApi.middleware,
			rtkQueryErrorLogger
		])
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
