class Cookie {
	private static readonly key = 'accessToken';
	private static readonly refreshKey = 'refreshToken';

	static getToken(): string | null {
		return localStorage.getItem(Cookie.key);
	}

	static setToken(token: string): void {
		localStorage.setItem(Cookie.key, token);
	}

	static getRefreshToken(): string | null {
		return localStorage.getItem(Cookie.refreshKey);
	}

	static setRefreshToken(token: string): void {
		localStorage.setItem(Cookie.refreshKey, token);
	}

	static removeToken() {
		localStorage.removeItem(Cookie.key);
		localStorage.removeItem(Cookie.refreshKey);
		localStorage.removeItem('isLoggedIn');
	}
}

export default Cookie;
