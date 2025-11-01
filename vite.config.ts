import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import EnvironmentPlugin from 'vite-plugin-environment';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
	base: '/indocool-prc-frontend/',
	plugins: [
		react(),
		EnvironmentPlugin({
			VITE_APP_NAME: 'PRC Management Portal',
			API_BASE_URL: 'https://indocool-prc-backend.onrender.com/web/',
			API_BASE_URL_PRE_AUTH: 'https://indocool-prc-backend.onrender.com/',
			REDIRECT_URI: 'https://dhanushbdev25.github.io/indocool-prc-frontend/auth/login',
			AZURE_CLIENT_ID: '6e3a5cb0-04eb-46f2-a413-36e9a623cfac',
			AZURE_CLIENT_SECRET: '1Zn8Q~OCQ3SVqTOuGi~vnr1CpX44vr_yvKDsidBX'
		}),
		process.env.ANALYZE === 'true' &&
			visualizer({
				filename: 'dist/bundle-analysis.html',
				open: true,
				gzipSize: true,
				brotliSize: true
			})
	].filter(Boolean),
	build: {
		chunkSizeWarningLimit: 1000,
		sourcemap: false,
		target: 'es2020',
		rollupOptions: {
			output: {
				manualChunks: {
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					'mui-vendor': [
						'@mui/material',
						'@mui/icons-material',
						'@mui/x-date-pickers',
						'@emotion/react',
						'@emotion/styled'
					],
					'state-vendor': ['@reduxjs/toolkit', 'react-redux'],
					'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup', 'zod'],
					'table-vendor': ['material-react-table'],
					'auth-vendor': ['@azure/msal-browser', '@azure/msal-react'],
					'utils-vendor': ['dayjs', 'sweetalert2'],
					'ui-vendor': ['react-icons', 'react-loader-spinner']
				},
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]'
			}
		},
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				unused: true,
				conditionals: true,
				comparisons: true,
				booleans: true,
				loops: true,
				if_return: true,
				sequences: true,
				dead_code: true,
				evaluate: true
			},
			mangle: {
				toplevel: true,
				keep_fnames: false
			}
		}
	},
	optimizeDeps: {
		include: [
			'react',
			'react-dom',
			'react-router-dom',
			'@mui/material',
			'@mui/icons-material',
			'@emotion/react',
			'@emotion/styled',
			'@reduxjs/toolkit',
			'react-redux',
			'react-hook-form',
			'dayjs'
		],
		exclude: ['@azure/msal-browser', '@azure/msal-react']
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
			'@components': resolve(__dirname, 'src/components'),
			'@pages': resolve(__dirname, 'src/pages'),
			'@utils': resolve(__dirname, 'src/utils'),
			'@store': resolve(__dirname, 'src/store'),
			'@themes': resolve(__dirname, 'src/themes')
		}
	},
	css: {
		devSourcemap: false
	}
});
