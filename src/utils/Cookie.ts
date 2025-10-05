class Cookie {
	private static readonly key = 'accessToken';
	private static readonly refreshKey = 'refreshToken';

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

	static getToken() {
		return this.get(Cookie.key);
	}

	static removeToken() {
		document.cookie = `${Cookie.key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=None`;
		document.cookie = `${Cookie.key}=; domain=.tolaram.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=None`;
		document.cookie = `${Cookie.key}=; domain=localhost; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=None`;
		this.delete(Cookie.key);
		this.delete(Cookie.refreshKey);
	}
}

export default Cookie;
