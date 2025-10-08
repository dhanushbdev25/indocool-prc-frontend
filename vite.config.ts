import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import EnvironmentPlugin from 'vite-plugin-environment';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		EnvironmentPlugin({
			VITE_APP_NAME: 'PRC Management Portal',
			API_BASE_URL: '//localhost:8000/web/',
			REDIRECT_URI: 'http://localhost:5173/auth/login',
			AZURE_CLIENT_ID: '6e3a5cb0-04eb-46f2-a413-36e9a623cfac',
			AZURE_CLIENT_SECRET: '1Zn8Q~OCQ3SVqTOuGi~vnr1CpX44vr_yvKDsidBX'
		}),
		// Bundle analyzer - only in production builds
		process.env.ANALYZE === 'true' && visualizer({
			filename: 'dist/bundle-analysis.html',
			open: true,
			gzipSize: true,
			brotliSize: true
		})
	].filter(Boolean),
	build: {
		// Increase chunk size warning limit to 1MB
		chunkSizeWarningLimit: 1000,
		// Enable source maps for production debugging
		sourcemap: false,
		// Optimize build target
		target: 'es2020',
		// Configure rollup options for advanced optimization
		rollupOptions: {
			output: {
				// Manual chunk splitting for better caching
				manualChunks: {
					// React ecosystem
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					// MUI ecosystem
					'mui-vendor': [
						'@mui/material',
						'@mui/icons-material',
						'@mui/x-date-pickers',
						'@emotion/react',
						'@emotion/styled'
					],
					// State management
					'state-vendor': ['@reduxjs/toolkit', 'react-redux'],
					// Form handling
					'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup', 'zod'],
					// Tables
					'table-vendor': ['material-react-table'],
					// Authentication
					'auth-vendor': ['@azure/msal-browser', '@azure/msal-react'],
					// Utilities
					'utils-vendor': ['axios', 'dayjs', 'sweetalert2'],
					// UI components
					'ui-vendor': ['react-icons', 'react-loader-spinner']
				},
				// Optimize chunk file names
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]'
			}
		},
		// Enable minification
		minify: 'terser',
		terserOptions: {
			compress: {
				// Remove console logs in production
				drop_console: true,
				drop_debugger: true,
				// Remove unused code
				unused: true,
				// Optimize conditionals
				conditionals: true,
				// Optimize comparisons
				comparisons: true,
				// Optimize boolean contexts
				booleans: true,
				// Optimize loops
				loops: true,
				// Optimize if statements
				if_return: true,
				// Optimize sequences
				sequences: true,
				// Optimize dead code
				dead_code: true,
				// Optimize evaluate
				evaluate: true
			},
			mangle: {
				// Mangle top-level names
				toplevel: true,
				// Mangle function names
				keep_fnames: false
			}
		}
	},
	// Optimize dependencies
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
			'axios',
			'dayjs'
		],
		exclude: ['@azure/msal-browser', '@azure/msal-react']
	},
	// Configure resolve aliases for better tree shaking
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
	// Configure CSS optimization
	css: {
		devSourcemap: false
	}
});
