export function hasModuleAccess(modules: string[], moduleName: string): boolean {
	return modules.some(mod => mod === moduleName);
}
