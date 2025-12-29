import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import EnvironmentPlugin from 'vite-plugin-environment';

// https://vitejs.dev/config/
export default defineConfig({
	base: '/',
	plugins: [
		react(),
		//server environment
		EnvironmentPlugin({
			VITE_APP_NAME: 'PRC Management Portal',
			API_BASE_URL: 'http://43.205.188.89:8080/web/',
			API_BASE_URL_PRE_AUTH: 'http://43.205.188.89:8080/',
			REDIRECT_URI: 'http://43.205.188.89:5173/auth/login',
			AUTH_MODE: 'localStorage'
		})
	]
});
