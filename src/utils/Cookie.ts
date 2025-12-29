class Cookie {
	private static readonly key = 'accessToken';
	private static readonly refreshKey = 'refreshToken';

	private static getAuthMode(): 'cookie' | 'localStorage' {
		// Check environment variable, default to 'cookie' for backward compatibility
		const authMode = (import.meta.env.AUTH_MODE || process.env.AUTH_MODE || 'cookie') as 'cookie' | 'localStorage';
		return authMode === 'localStorage' ? 'localStorage' : 'cookie';
	}

	static get(name: string | null): string | null {
		if (!name) return null;
		const pattern = new RegExp('(^| )' + encodeURIComponent(name) + '=([^;]+)');
		const match = pattern.exec(document.cookie);
		return match ? decodeURIComponent(match[2]) : null;
	}

	static set(
		name: string,
		value: string,
		options: {
			path?: string;
			expires?: Date | string | number;
			maxAge?: number;
			domain?: string;
			secure?: boolean;
			sameSite?: 'Strict' | 'Lax' | 'None';
		} = {}
	) {
		let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

		if (options.expires) {
			let expires: string;

			if (options.expires instanceof Date) {
				expires = options.expires.toUTCString();
			} else if (typeof options.expires === 'number') {
				expires = new Date(Date.now() + options.expires * 1000).toUTCString();
			} else {
				expires = options.expires;
			}
			cookieString += `; expires=${expires}`;
		}

		if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
		if (options.path) cookieString += `; path=${options.path}`;
		if (options.domain) cookieString += `; domain=${options.domain}`;
		if (options.secure) cookieString += `; secure`;
		if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;

		document.cookie = cookieString;
	}

	static delete(name: string, path?: string) {
		this.set(name, '', {
			path: path || '/',
			expires: new Date(0)
		});
	}

	static getToken(): string | null {
		const authMode = this.getAuthMode();
		if (authMode === 'localStorage') {
			return localStorage.getItem(Cookie.key);
		}
		return this.get(Cookie.key);
	}

	static setToken(token: string): void {
		const authMode = this.getAuthMode();
		if (authMode === 'localStorage') {
			localStorage.setItem(Cookie.key, token);
		} else {
			this.set(Cookie.key, token, {
				path: '/',
				maxAge: 7 * 24 * 60 * 60, // 7 days
				secure: window.location.protocol === 'https:',
				sameSite: 'Lax'
			});
		}
	}

	static getRefreshToken(): string | null {
		const authMode = this.getAuthMode();
		if (authMode === 'localStorage') {
			return localStorage.getItem(Cookie.refreshKey);
		}
		return this.get(Cookie.refreshKey);
	}

	static setRefreshToken(token: string): void {
		const authMode = this.getAuthMode();
		if (authMode === 'localStorage') {
			localStorage.setItem(Cookie.refreshKey, token);
		} else {
			this.set(Cookie.refreshKey, token, {
				path: '/',
				maxAge: 7 * 24 * 60 * 60, // 7 days
				secure: window.location.protocol === 'https:',
				sameSite: 'Lax',
				httpOnly: false // Note: httpOnly can't be set via JS, this is just for consistency
			});
		}
	}

	static removeToken() {
		const authMode = this.getAuthMode();
		if (authMode === 'localStorage') {
			localStorage.removeItem(Cookie.key);
			localStorage.removeItem(Cookie.refreshKey);
		} else {
			// Clear cookies (existing behavior)
			document.cookie = `${Cookie.key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=None`;
			document.cookie = `${Cookie.key}=; domain=.tolaram.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=None`;
			document.cookie = `${Cookie.key}=; domain=localhost; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=None`;
			document.cookie = `${Cookie.key}=; domain=indocool-prc-backend.onrender.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=None`;
			document.cookie = `${Cookie.refreshKey}=; domain=indocool-prc-backend.onrender.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=None`;
			
			this.delete(Cookie.key);
			this.delete(Cookie.refreshKey);
		}
	}
}

export default Cookie;
