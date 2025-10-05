import { combineReducers, AnyAction } from 'redux';
import { authApi } from '../api/auth/auth.api';
import { LOGOUT, AuthActionTypes } from './actions';
import { sessionApi } from '../api/auth/session.api';
import { catalystApi } from '../api/business/catalyst-master/catalyst.api';
import Cookie from '../../utils/Cookie';


const rootReducer = combineReducers({
	[authApi.reducerPath]: authApi.reducer,
	[sessionApi.reducerPath]: sessionApi.reducer,
	[catalystApi.reducerPath]: catalystApi.reducer,
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
