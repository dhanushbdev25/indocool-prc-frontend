// ==============================|| THEME CONFIG  ||============================== //
import { PublicClientApplication } from '@azure/msal-browser';
const config = {
	fontFamily: `'Poppins', sans-serif`,
	i18n: 'en',
	miniDrawer: false,
	container: true,
	mode: 'light',
	presetColor: 'default',
	themeDirection: 'ltr'
};
export default config; // not used
export const drawerWidth = 290;

export const twitterColor = '#1DA1F2'; // not used
export const facebookColor = '#3b5998'; // not used
export const linkedInColor = '#0e76a8'; // not used

export const msalConfig = {
	auth: {
		clientId: process.env.AZURE_CLIENT_ID ?? '',
		authority: `https://login.microsoftonline.com/common`,
		redirectUri: process.env.REDIRECT_URI ?? ''
		// clientSecret: process.env.AZURE_CLIENT_SECRET ?? ''
	},
	cache: {
		cacheLocation: 'sessionStorage',
		storeAuthStateInCookie: false
	}
};

export const loginRequest = {
	scopes: ['User.Read'],
	prompt: 'select_account'
};

export const msalInstance = new PublicClientApplication(msalConfig);
