import type { TimelineStep } from '../types/execution.types';

export interface ExecutionInspectionImage {
	id: string;
	fileName?: string;
	filePath?: string;
	originalFileName?: string;
}

type InspectionFile = Omit<ExecutionInspectionImage, 'id'>;

const normalizedIdentity = (file: InspectionFile): string => {
	const normalizedPath = file.filePath?.trim().replace(/\\/g, '/').toLowerCase();
	if (normalizedPath) return `path:${normalizedPath}`;

	const storedName = file.fileName?.trim().toLowerCase();
	if (storedName) return `stored:${storedName}`;

	const originalName = file.originalFileName?.trim().toLowerCase();
	return originalName ? `original:${originalName}` : '';
};

export const collectUniqueExecutionInspectionImages = (timelineSteps: TimelineStep[]): ExecutionInspectionImage[] => {
	const uniqueImages = new Map<string, ExecutionInspectionImage>();

	const addFile = (file: InspectionFile | null | undefined) => {
		if (!file) return;
		const id = normalizedIdentity(file);
		if (!id || uniqueImages.has(id)) return;

		uniqueImages.set(id, {
			id,
			fileName: file.fileName,
			filePath: file.filePath,
			originalFileName: file.originalFileName
		});
	};

	for (const step of timelineSteps) {
		if (step.type !== 'inspection') continue;

		for (const parameter of step.inspectionParameters ?? []) {
			for (const file of parameter.files ?? []) {
				addFile(file);
			}
			for (const rowMapping of parameter.rowMappings ?? []) {
				for (const file of rowMapping.fileName ?? []) {
					addFile(file);
				}
			}
		}
	}

	return [...uniqueImages.values()];
};
