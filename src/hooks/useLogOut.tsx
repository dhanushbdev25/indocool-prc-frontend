// src/hooks/useLogout.ts
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/store';
import { logoutApp } from '../store/reducers/actions';
import Cookie from '../utils/Cookie';
import { useLogoutUserMutation } from '../store/api/auth/auth.api';

export const useLogout = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [logoutUser] = useLogoutUserMutation();

	const logout = async () => {
		try {
			await logoutUser().unwrap(); // 🔹 call backend
		} catch (err) {
			console.error('Logout API failed:', err);
		}
		Cookie.removeToken(); // 🔹 remove frontend cookies
		dispatch(logoutApp()); // 🔹 reset Redux
		navigate('/'); // 🔹 redirect to login
	};

	return logout;
};
