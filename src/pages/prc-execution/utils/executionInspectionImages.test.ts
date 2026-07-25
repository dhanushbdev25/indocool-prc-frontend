import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../types/execution.types';
import { collectUniqueExecutionInspectionImages } from './executionInspectionImages';

const inspectionStep = (inspectionParameters: TimelineStep['inspectionParameters']): TimelineStep =>
	({
		stepNumber: 1,
		type: 'inspection',
		title: 'Inspection',
		description: '',
		status: 'pending',
		ctq: false,
		inspectionParameters
	}) as TimelineStep;

describe('collectUniqueExecutionInspectionImages', () => {
	it('collects parameter and row images while deduplicating normalized paths', () => {
		const images = collectUniqueExecutionInspectionImages([
			inspectionStep([
				{
					files: [
						{
							fileName: 'stored-a.png',
							filePath: 'files\\part_drawings\\stored-a.png',
							originalFileName: 'drawing-a.png'
						}
					],
					rowMappings: [
						{
							rowIndex: 0,
							fileName: [
								{
									fileName: 'stored-a-copy.png',
									filePath: 'FILES/part_drawings/stored-a.png',
									originalFileName: 'duplicate-a.png'
								},
								{
									fileName: 'stored-b.png',
									filePath: 'files/part_drawings/stored-b.png',
									originalFileName: 'drawing-b.png'
								}
							]
						}
					]
				} as NonNullable<TimelineStep['inspectionParameters']>[number]
			])
		]);

		expect(images).toHaveLength(2);
		expect(images.map(image => image.originalFileName)).toEqual(['drawing-a.png', 'drawing-b.png']);
	});

	it('uses stored and original filename fallbacks and ignores non-inspection steps', () => {
		const images = collectUniqueExecutionInspectionImages([
			{
				stepNumber: 1,
				type: 'sequence',
				title: 'Sequence',
				description: '',
				status: 'pending',
				ctq: false,
				inspectionParameters: [
					{
						files: [{ fileName: 'ignored.png', filePath: '', originalFileName: 'ignored.png' }]
					} as NonNullable<TimelineStep['inspectionParameters']>[number]
				]
			},
			inspectionStep([
				{
					files: [
						{ fileName: 'stored-only.png', filePath: '', originalFileName: '' },
						{ fileName: '', filePath: '', originalFileName: 'original-only.png' },
						{ fileName: '', filePath: '', originalFileName: '' }
					]
				} as NonNullable<TimelineStep['inspectionParameters']>[number]
			])
		]);

		expect(images.map(image => image.id)).toEqual(['stored:stored-only.png', 'original:original-only.png']);
	});
});
