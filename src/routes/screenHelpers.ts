import { ScreenConfig, screenConfigs, mainModuleConfigs, MainModuleConfig } from './screenList';

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

	// Sort by order, but only for items that have an order (showInSidebar items)
	return filteredScreens.sort((a, b) => {
		// Items without order come after items with order
		if (a.order === undefined && b.order === undefined) return 0;
		if (a.order === undefined) return 1;
		if (b.order === undefined) return -1;
		return a.order - b.order;
	});
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

/**
 * Get main modules with their submodules for hierarchical sidebar navigation
 * @param permissions - Array of permission strings from user session
 * @returns Array of main module configurations with filtered submodules
 */
export const getMainModulesWithSubmodules = (permissions: string[]): MainModuleConfig[] => {
	return mainModuleConfigs
		.map(module => {
			// Filter submodules based on permissions
			const filteredSubmodules = module.submodules.filter(screen => {
				const hasExactMatch = permissions.includes(screen.permission);
				const hasCaseInsensitiveMatch = permissions.some(p => p.toUpperCase() === screen.permission.toUpperCase());
				return hasExactMatch || hasCaseInsensitiveMatch;
			});

			// Sort submodules by order (only for sidebar items)
			const sortedSubmodules = filteredSubmodules.sort((a, b) => {
				if (a.order === undefined && b.order === undefined) return 0;
				if (a.order === undefined) return 1;
				if (b.order === undefined) return -1;
				return a.order - b.order;
			});

			return {
				...module,
				submodules: sortedSubmodules
			};
		})
		.filter(module => module.submodules.length > 0); // Only return modules that have accessible submodules
};

/**
 * Get sidebar screens organized by main modules
 * @param permissions - Array of permission strings from user session
 * @returns Array of main modules with their sidebar-visible submodules
 */
export const getSidebarModules = (permissions: string[]): MainModuleConfig[] => {
	const modulesWithSubmodules = getMainModulesWithSubmodules(permissions);

	return modulesWithSubmodules
		.map(module => ({
			...module,
			submodules: module.submodules.filter(screen => screen.showInSidebar !== false)
		}))
		.filter(module => module.submodules.length > 0);
};

// Breadcrumb item interface
export interface BreadcrumbItem {
	text: string;
	path?: string;
	isActive: boolean;
}

// Cache for sorted screens to avoid repeated sorting
let sortedScreensCache: ScreenConfig[] | null = null;

// Cache for path-to-module mapping
const pathToModuleCache = new Map<string, MainModuleConfig | null>();

/**
 * Get sorted screens (cached for performance)
 */
const getSortedScreens = (): ScreenConfig[] => {
	if (!sortedScreensCache) {
		sortedScreensCache = [...screenConfigs].sort((a, b) => b.path.length - a.path.length);
	}
	return sortedScreensCache;
};

/**
 * Find parent module for a given screen path (cached)
 */
const findParentModule = (screenPath: string): MainModuleConfig | null => {
	if (pathToModuleCache.has(screenPath)) {
		return pathToModuleCache.get(screenPath)!;
	}

	const parentModule = mainModuleConfigs.find(module => module.submodules.some(sub => sub.path === screenPath)) || null;

	pathToModuleCache.set(screenPath, parentModule);
	return parentModule;
};

/**
 * Check if a path matches a screen configuration
 */
const isPathMatch = (currentPath: string, screenPath: string): boolean => {
	// Handle dynamic routes (with :id parameter)
	if (screenPath.includes(':')) {
		const basePath = screenPath.split('/:')[0];
		return currentPath.startsWith(`/${basePath}`);
	}
	// Handle exact matches
	return currentPath === `/${screenPath}` || currentPath.startsWith(`/${screenPath}/`);
};

/**
 * Create a breadcrumb item
 */
const createBreadcrumbItem = (text: string, path: string | undefined, isActive: boolean): BreadcrumbItem => ({
	text,
	path,
	isActive
});

/**
 * Clear caches (useful for development or when screen configs change)
 */
export const clearBreadcrumbCaches = (): void => {
	sortedScreensCache = null;
	pathToModuleCache.clear();
};

/**
 * Generate breadcrumbs based on current path and module hierarchy
 * @param currentPath - Current route path
 * @returns Array of breadcrumb items
 */
export const generateBreadcrumbs = (currentPath: string): BreadcrumbItem[] => {
	// Early return for invalid paths
	if (!currentPath || currentPath === '/') {
		return [];
	}

	// Find the matching screen configuration using cached sorted screens
	const sortedScreens = getSortedScreens();
	const matchingScreen = sortedScreens.find(screen => isPathMatch(currentPath, screen.path));

	// Early return if no matching screen found
	if (!matchingScreen) {
		return [];
	}

	// Find the parent module using cache
	const parentModule = findParentModule(matchingScreen.path);

	// Early return if no parent module found
	if (!parentModule) {
		return [createBreadcrumbItem(matchingScreen.text, `/${matchingScreen.path}`, true)];
	}

	// Build breadcrumbs array
	const breadcrumbs: BreadcrumbItem[] = [
		// Main module breadcrumb (not clickable)
		createBreadcrumbItem(parentModule.text, undefined, false)
	];

	// Check if this is a nested path and add base submodule if needed
	const pathSegments = matchingScreen.path.split('/');
	const isNestedPath = pathSegments.length > 1;

	if (isNestedPath) {
		const baseSubmodule = parentModule.submodules.find(sub => sub.path === pathSegments[0]);
		if (baseSubmodule) {
			breadcrumbs.push(createBreadcrumbItem(baseSubmodule.text, `/${baseSubmodule.path}`, false));
		}
	}

	// Add current screen breadcrumb
	breadcrumbs.push(createBreadcrumbItem(matchingScreen.text, `/${matchingScreen.path}`, true));

	return breadcrumbs;
};
