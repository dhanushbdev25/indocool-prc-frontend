import { beforeEach, describe, expect, it } from 'vitest';
import { capturePostLoginRedirect, consumePostLoginRedirect } from './postLoginRedirect';

const STORAGE_KEY = 'postLoginRedirect';

describe('capturePostLoginRedirect', () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it('captures a deep link including its search params', () => {
		capturePostLoginRedirect('/part-master?page=2');

		expect(sessionStorage.getItem(STORAGE_KEY)).toBe('/part-master?page=2');
	});

	it('does not capture the login path', () => {
		capturePostLoginRedirect('/');

		expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('does not capture the forgot-password path', () => {
		// Otherwise the user is sent back here after logging in, where the route no
		// longer exists, and lands on NotFound.
		capturePostLoginRedirect('/forgot-password');

		expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('does not capture the forgot-password path with a query string or trailing slash', () => {
		capturePostLoginRedirect('/forgot-password?from=login');
		expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();

		capturePostLoginRedirect('/forgot-password/');
		expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('rejects protocol-relative and absolute external URLs', () => {
		capturePostLoginRedirect('//evil.example');
		expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();

		capturePostLoginRedirect('https://evil.example');
		expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('stores and consumes a safe relative path in one round trip', () => {
		capturePostLoginRedirect('/prc-execution/view/12');

		expect(consumePostLoginRedirect()).toBe('/prc-execution/view/12');
		expect(consumePostLoginRedirect()).toBeNull();
	});
});

describe('consumePostLoginRedirect', () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it('returns and clears a stored path', () => {
		sessionStorage.setItem(STORAGE_KEY, '/dashboard');

		expect(consumePostLoginRedirect()).toBe('/dashboard');
		expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('ignores a public auth path stored before the exclusion existed', () => {
		sessionStorage.setItem(STORAGE_KEY, '/forgot-password');

		expect(consumePostLoginRedirect()).toBeNull();
	});

	it('returns null when nothing is stored', () => {
		expect(consumePostLoginRedirect()).toBeNull();
	});
});
