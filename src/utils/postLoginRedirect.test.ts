import { afterEach, describe, expect, it } from 'vitest';
import { capturePostLoginRedirect, consumePostLoginRedirect } from './postLoginRedirect';

describe('postLoginRedirect', () => {
	afterEach(() => {
		sessionStorage.clear();
	});

	it('stores and consumes a safe relative path', () => {
		capturePostLoginRedirect('/prc-execution/view/12');
		expect(consumePostLoginRedirect()).toBe('/prc-execution/view/12');
		expect(consumePostLoginRedirect()).toBeNull();
	});

	it('rejects external and root paths', () => {
		capturePostLoginRedirect('/');
		capturePostLoginRedirect('//evil.example');
		capturePostLoginRedirect('https://evil.example');
		expect(consumePostLoginRedirect()).toBeNull();
	});
});
