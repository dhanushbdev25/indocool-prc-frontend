import type { FieldErrors } from 'react-hook-form';

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function appendMessagesFromNode(record: Record<string, unknown>, path: string, lines: string[]): void {
	const msg = record.message;
	if (typeof msg === 'string' && msg.trim() !== '') {
		lines.push(`<li><strong>${formatPath(path)}</strong>: ${escapeHtml(msg.trim())}</li>`);
	}

	const types = record.types;
	if (types && typeof types === 'object') {
		for (const v of Object.values(types as Record<string, unknown>)) {
			if (typeof v === 'string' && v.trim() !== '') {
				lines.push(`<li><strong>${formatPath(path)}</strong>: ${escapeHtml(v.trim())}</li>`);
			}
		}
	}
}

const KEY_LABELS: Record<string, string> = {
	partNumber: 'Part number',
	drawingNumber: 'Drawing number',
	drawingRevision: 'Drawing revision',
	partRevision: 'Part revision',
	customer: 'Customer',
	customerVariantId: 'Customer variant',
	description: 'Description',
	notes: 'Notes',
	layupType: 'Layup type',
	model: 'Model',
	sapReferenceNumber: 'SAP reference',
	moulds: 'Moulds',
	mouldCode: 'Mould code',
	reconciliationCount: 'Reconciliation count',
	catalyst: 'Catalyst chart',
	templateId: 'Template ID',
	templateName: 'Template name',
	templateNotes: 'Template notes',
	prcTemplateSteps: 'PRC template steps',
	sequence: 'Sequence',
	stepId: 'Step',
	type: 'Step type',
	group: 'Operation group',
	rawMaterials: 'Bill of materials',
	materialName: 'Material name',
	materialCode: 'Material code',
	materialGroup: 'Material group',
	quantity: 'Quantity',
	uom: 'UOM',
	operationWiseData: 'Employee count (operations)',
	l1Count: 'L1',
	l2Count: 'L2',
	l3Count: 'L3',
	l4Count: 'L4',
	drilling: 'Drilling',
	cutting: 'Cutting',
	characteristics: 'Characteristics',
	specification: 'Specification',
	noOfHoles: 'Number of holes',
	diaOfHoles: 'Hole diameter',
	tolerance: 'Tolerance',
	inspectionDiagrams: 'Inspection diagrams',
	files: 'Files',
	root: '' // "root" bucket from Yup/object-level tests — fold into parent path
};

function formatSegment(seg: string): string {
	if (/^\d+$/.test(seg)) {
		const n = Number(seg);
		return `Row ${n + 1}`;
	}
	const mapped = KEY_LABELS[seg];
	if (mapped === '') return '';
	return mapped ?? seg.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

function formatPath(path: string): string {
	const out = path
		.split('.')
		.filter(Boolean)
		.filter(seg => seg !== 'root')
		.map(formatSegment)
		.filter(Boolean)
		.join(' › ');
	return out || 'Form';
}

/**
 * Flattens react-hook-form errors into an HTML list for SweetAlert (or similar).
 * Handles Yup/array row errors where the item is a leaf `{ message, type }` object.
 */
export function flattenRhfFieldErrorsToHtml(errors: FieldErrors): string {
	const lines: string[] = [];

	const walk = (obj: unknown, pathPrefix: string) => {
		if (obj === null || obj === undefined) return;

		if (Array.isArray(obj)) {
			obj.forEach((item, i) => {
				const next = pathPrefix ? `${pathPrefix}.${i}` : String(i);
				walk(item, next);
			});
			return;
		}

		if (typeof obj !== 'object') return;

		const record = obj as Record<string, unknown>;
		appendMessagesFromNode(record, pathPrefix, lines);

		for (const key of Object.keys(record)) {
			if (key === 'ref' || key === 'message' || key === 'type' || key === 'types') continue;

			const val = record[key];
			if (val === null || val === undefined) continue;

			/** Yup object-level errors often nest under `root` — keep parent path */
			const nextPath =
				key === 'root' ? pathPrefix : pathPrefix ? `${pathPrefix}.${key}` : key;

			walk(val, nextPath);
		}
	};

	walk(errors as unknown, '');

	if (lines.length === 0) {
		return '<p>Please check the form for invalid values.</p>';
	}

	return `<ul style="text-align:left;margin:0.5em 0;padding-left:1.25rem;max-height:260px;overflow:auto">${lines.join('')}</ul>`;
}
