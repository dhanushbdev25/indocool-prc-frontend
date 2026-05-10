/**
 * Normalize inspection parameter payloads so annotations/regions are arrays (matches StepPreview).
 * Merges into a shallow copy of `data` so non-annotation fields are preserved.
 */

function annotationsNeedNormalization(annotations: unknown): boolean {
	return typeof annotations === 'object' && annotations !== null && !Array.isArray(annotations);
}

function normalizeRegions(regions: unknown): unknown {
	if (!regions || typeof regions !== 'object' || Array.isArray(regions)) return regions;
	return Object.keys(regions as Record<string, unknown>)
		.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
		.map(regionKey => {
			const region = (regions as Record<string, unknown>)[regionKey];
			if (typeof region !== 'object' || region === null) return region;
			const transformedRegion = { ...(region as Record<string, unknown>) };
			if ('points' in transformedRegion && transformedRegion.points) {
				const points = transformedRegion.points;
				if (typeof points === 'object' && !Array.isArray(points)) {
					transformedRegion.points = Object.keys(points as Record<string, unknown>)
						.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
						.map(pointKey => {
							const point = (points as Record<string, unknown>)[pointKey];
							if (typeof point === 'object' && point !== null && '0' in point && '1' in point) {
								return [(point as Record<string, unknown>)['0'], (point as Record<string, unknown>)['1']];
							}
							return [0, 0];
						});
				}
			}
			return transformedRegion;
		});
}

function normalizeAnnotationsObject(annotations: Record<string, unknown>): unknown[] {
	return Object.keys(annotations)
		.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
		.map(annKey => {
			const annotation = annotations[annKey];
			if (typeof annotation !== 'object' || annotation === null) return annotation;
			const transformedAnnotation = { ...(annotation as Record<string, unknown>) };
			if ('regions' in transformedAnnotation && transformedAnnotation.regions) {
				transformedAnnotation.regions = normalizeRegions(transformedAnnotation.regions);
			}
			return transformedAnnotation;
		});
}

function inspectionNeedsAnnotationNormalization(data: Record<string, unknown>): boolean {
	return Object.keys(data).some(key => {
		const value = data[key];
		if (typeof value !== 'object' || value === null || !('annotations' in value)) return false;
		return annotationsNeedNormalization((value as Record<string, unknown>).annotations);
	});
}

function normalizeParameterPayload(value: Record<string, unknown>): Record<string, unknown> {
	const next = { ...value };
	if ('annotations' in next && next.annotations && annotationsNeedNormalization(next.annotations)) {
		next.annotations = normalizeAnnotationsObject(next.annotations as Record<string, unknown>);
	}
	return next;
}

export function normalizeInspectionStepAggregatedData(data: Record<string, unknown>): Record<string, unknown> {
	if (!inspectionNeedsAnnotationNormalization(data)) {
		return data;
	}

	const result = { ...data };
	Object.entries(data).forEach(([key, value]) => {
		if (['stepCompleted', 'productionApproved', 'ctqApproved', 'partialCtqApprove'].includes(key)) {
			return;
		}
		if (typeof value === 'object' && value !== null && 'annotations' in value) {
			const v = value as Record<string, unknown>;
			if (annotationsNeedNormalization(v.annotations)) {
				result[key] = normalizeParameterPayload(v);
			}
		}
	});

	return result;
}
