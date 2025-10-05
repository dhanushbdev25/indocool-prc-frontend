import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import EnvironmentPlugin from 'vite-plugin-environment';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		EnvironmentPlugin({
			APP_NAME: 'Digitalisation',
			API_BASE_URL: '//localhost:8000/web/',
			REDIRECT_URI: 'http://localhost:5173/auth/login',
			AZURE_CLIENT_ID: '6e3a5cb0-04eb-46f2-a413-36e9a623cfac',
			AZURE_CLIENT_SECRET: '1Zn8Q~OCQ3SVqTOuGi~vnr1CpX44vr_yvKDsidBX'
		})
	]
});
