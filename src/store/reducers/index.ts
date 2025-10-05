import { combineReducers, AnyAction } from 'redux';
import { authApi } from '../api/auth/authApi';
import { LOGOUT, AuthActionTypes } from './actions';
import { sessionApi } from '../api/auth/sessionApi';
import Cookie from '../../utils/Cookie';
import { myProjectAPI } from '../api/business/myProject/myProject.api';
import { dashboardApi } from '../api/business/dashboard/dashboard.api';
import dashboardFiltersReducer from './dashboardFiltersSlice';
import { newRequestAPI } from '../api/business/requests/newRequestAPI';
import { configurationAPI } from '../api/business/configuration/configure.api';

const rootReducer = combineReducers({
	dashboardFilters: dashboardFiltersReducer,
	[authApi.reducerPath]: authApi.reducer,
	[sessionApi.reducerPath]: sessionApi.reducer,
	[dashboardApi.reducerPath]: dashboardApi.reducer,
	[myProjectAPI.reducerPath]: myProjectAPI.reducer,
	[newRequestAPI.reducerPath]: newRequestAPI.reducer,
	[configurationAPI.reducerPath]: configurationAPI.reducer
});

// Handle the LOGOUT action
const appReducer = (state: ReturnType<typeof rootReducer> | undefined, action: AnyAction) => {
	if (action.type === LOGOUT) {
		Cookie.delete('token');
		Cookie.removeToken();
		state = undefined;
	}
	return rootReducer(state, action as AuthActionTypes);
};

export default appReducer;
