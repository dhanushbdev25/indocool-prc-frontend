import { combineReducers, AnyAction } from 'redux';
import { authApi } from '../api/auth/authApi';
import { LOGOUT, AuthActionTypes } from './actions';
import { sessionApi } from '../api/auth/sessionApi';
import Cookie from '../../utils/Cookie';


const rootReducer = combineReducers({
	[authApi.reducerPath]: authApi.reducer,
	[sessionApi.reducerPath]: sessionApi.reducer,
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
