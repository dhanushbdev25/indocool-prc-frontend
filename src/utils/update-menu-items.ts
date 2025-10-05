export const updateMenuItems = (pageList: any, routeMapping: any) => {
	const addIcons = (modules: any[]): any[] => {
		// First handle the case where modules is not an array (shouldn't happen in initial call)
		if (!Array.isArray(modules)) {
			return [];
		}

		return modules
			.reduce((acc: any[], module: any) => {
				// Check if the module should be included based on pageList
				if (module.ROUTE && pageList[module.ROUTE] && pageList[module.ROUTE].ACTIVE === false) {
					return acc; // Skip this module
				}

				let updatedModule = { ...module };

				if (pageList[updatedModule.ROUTE]) {
					updatedModule.ICON = pageList[updatedModule.ROUTE].icon;
				}

				// If the module has children, process them recursively
				if (updatedModule.children) {
					const processedChildren = addIcons(updatedModule.children);
					// If all children are filtered out, don't include this parent module
					if (processedChildren.length === 0) {
						return acc;
					}
					updatedModule.children = processedChildren;
				}

				acc.push(updatedModule);
				return acc;
			}, [])
			.sort((a: any, b: any) => {
				// Sort by SEQUENCE, if equal then sort by ID
				if (a.SEQUENCE === b.SEQUENCE) {
					return a.ID - b.ID;
				}
				return a.SEQUENCE - b.SEQUENCE;
			});
	};

	return addIcons(routeMapping);

	// const addIcons = (modules: any): any[] => {
	//   return modules
	//     .reduce((acc: any[], module: any) => {

	//       // Check if the module should be included based on pageList
	//       if (module.ROUTE && pageList[module.ROUTE] && pageList[module.ROUTE].ACTIVE === false) {
	//         return acc; // Skip this module
	//       }

	//       let updatedModule = { ...module };

	//       if ( pageList[updatedModule.ROUTE]) {
	//         updatedModule.ICON = pageList[updatedModule.ROUTE].icon;
	//       }

	//       if (updatedModule) {
	//         updatedModule = addIcons(updatedModule);
	//         // If all children are filtered out, don't include this parent module
	//         if (updatedModule.length === 0) {
	//           return acc;
	//         }
	//       }

	//       acc.push(updatedModule);
	//       return acc;
	//     }, [])
	//     .sort((a: any, b: any) => {
	//       // Sort by SEQUENCE, if equal then sort by ID
	//       if (a.SEQUENCE === b.SEQUENCE) {
	//         return a.ID - b.ID;
	//       }
	//       return a.SEQUENCE - b.SEQUENCE;
	//     });
	// };

	// return addIcons(routeMapping);
};
