import { type ImageAnnotation, type AnnotationRegion } from '../types/execution.types';

/**
 * Transforms object-based data structure to array-based structure
 * Converts objects with numeric keys to arrays
 */
export function transformObjectToArray<T>(obj: Record<string, T>): T[] {
	if (!obj || typeof obj !== 'object') return [];

	return Object.keys(obj)
		.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
		.map(key => obj[key]);
}

/**
 * Transforms points from object format to array format
 * Input: { "0": { "0": x, "1": y }, "1": { "0": x, "1": y } }
 * Output: [[x, y], [x, y]]
 */
export function transformPointsToArray(points: Record<string, Record<string, number>>): Array<[number, number]> {
	if (!points || typeof points !== 'object') return [];

	return Object.keys(points)
		.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
		.map(key => {
			const point = points[key];
			if (point && typeof point === 'object' && '0' in point && '1' in point) {
				return [point['0'], point['1']] as [number, number];
			}
			return [0, 0] as [number, number];
		});
}

/**
 * Transforms annotation regions from object format to array format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformRegionsToArray(regions: Record<string, any>): AnnotationRegion[] {
	if (!regions || typeof regions !== 'object') return [];

	return Object.keys(regions)
		.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
		.map(key => {
			const region = regions[key];
			if (!region || typeof region !== 'object') return null;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const transformedRegion: any = {
				id: region.id,
				type: region.type,
				cls: region.cls,
				comment: region.comment
			};

			// Transform points based on type
			if (region.type === 'point' && region.x !== undefined && region.y !== undefined) {
				transformedRegion.x = region.x;
				transformedRegion.y = region.y;
			} else if (region.type === 'polygon' && region.points) {
				transformedRegion.points = transformPointsToArray(region.points);
			}

			return transformedRegion;
		})
		.filter(region => region !== null) as AnnotationRegion[];
}

/**
 * Transforms annotations from object format to array format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformAnnotationsToArray(annotations: Record<string, any>): ImageAnnotation[] {
	if (!annotations || typeof annotations !== 'object') return [];

	return Object.keys(annotations)
		.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
		.map(key => {
			const annotation = annotations[key];
			if (!annotation || typeof annotation !== 'object') return null;

			return {
				imageFileName: annotation.imageFileName,
				imageUrl: annotation.imageUrl,
				regions: transformRegionsToArray(annotation.regions || {})
			} as ImageAnnotation;
		})
		.filter(annotation => annotation !== null) as ImageAnnotation[];
}

/**
 * Transforms the nested prcAggregatedSteps data structure to the expected format
 * for the preview component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformPrcAggregatedData(prcAggregatedSteps: Record<string, any>): Record<string, any> {
	if (!prcAggregatedSteps || typeof prcAggregatedSteps !== 'object') return {};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const transformedData: Record<string, any> = {};

	console.log('🔄 transformPrcAggregatedData: Input data:', prcAggregatedSteps);

	// Iterate through the nested structure: prcAggregatedSteps -> stepGroupId -> parameterId
	Object.entries(prcAggregatedSteps).forEach(([stepGroupId, stepGroupData]) => {
		console.log(`🔄 Processing stepGroupId: ${stepGroupId}`, stepGroupData);

		if (stepGroupData && typeof stepGroupData === 'object') {
			Object.entries(stepGroupData).forEach(([parameterId, parameterData]) => {
				console.log(`🔄 Processing parameterId: ${parameterId}`, parameterData);

				// Skip system parameters
				if (['stepCompleted', 'productionApproved', 'ctqApproved'].includes(parameterId)) {
					console.log(`⏭️ Skipping system parameter: ${parameterId}`);
					return;
				}

				if (parameterData && typeof parameterData === 'object') {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const transformedParam: any = {};

					// Handle value
					if ('value' in parameterData) {
						transformedParam.value = parameterData.value;
						console.log(`✅ Added value for parameter ${parameterId}:`, parameterData.value);
					}

					// Handle annotations - transform from object to array
					if ('annotations' in parameterData && parameterData.annotations) {
						console.log(`🔄 Transforming annotations for parameter ${parameterId}:`, parameterData.annotations);
						transformedParam.annotations = transformAnnotationsToArray(parameterData.annotations);
						console.log(`✅ Transformed annotations for parameter ${parameterId}:`, transformedParam.annotations);
					}

					// Only add if there's actual data
					if (Object.keys(transformedParam).length > 0) {
						transformedData[parameterId] = transformedParam;
						console.log(`✅ Added parameter ${parameterId} to transformed data:`, transformedParam);
					}
				}
			});
		}
	});

	console.log('🔄 transformPrcAggregatedData: Output data:', transformedData);
	return transformedData;
}

/**
 * Debug function to log the transformation process
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debugDataTransformation(originalData: any, transformedData: any, stepName: string) {
	console.log(`🔄 Data Transformation Debug - ${stepName}:`, {
		original: originalData,
		transformed: transformedData,
		originalKeys: Object.keys(originalData || {}),
		transformedKeys: Object.keys(transformedData || {})
	});
}
