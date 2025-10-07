import { ScreenConfig, screenConfigs } from './screenList';

/**
 * Get ordered screens based on user permissions
 * @param permissions - Array of permission strings from user session
 * @returns Array of screen configurations sorted by order
 */
export const getOrderedScreens = (permissions: string[]): ScreenConfig[] => {
	// Try both exact match and case-insensitive match
	const filteredScreens = screenConfigs.filter(screen => {
		const hasExactMatch = permissions.includes(screen.permission);
		const hasCaseInsensitiveMatch = permissions.some(p => p.toUpperCase() === screen.permission.toUpperCase());
		return hasExactMatch || hasCaseInsensitiveMatch;
	});
	
	return filteredScreens.sort((a, b) => a.order - b.order);
};

/**
 * Get the initial screen for the user
 * @param permissions - Array of permission strings from user session
 * @returns Screen configuration marked as initial, or first available screen
 */
export const getInitialScreen = (permissions: string[]): ScreenConfig | null => {
	const orderedScreens = getOrderedScreens(permissions);
	return orderedScreens.find(screen => screen.isInitial) || orderedScreens[0] || null;
};

/**
 * Get screens that should be displayed in the sidebar
 * @param permissions - Array of permission strings from user session
 * @returns Array of screen configurations for sidebar navigation
 */
export const getSidebarScreens = (permissions: string[]): ScreenConfig[] => {
	const orderedScreens = getOrderedScreens(permissions);
	const sidebarScreens = orderedScreens.filter(screen => screen.showInSidebar !== false);
	
	// If no screens found, return empty array
	// This ensures the system gracefully handles cases where user has no permissions
	
	return sidebarScreens;
};
