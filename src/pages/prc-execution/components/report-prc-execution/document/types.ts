import type { AnnotationRegion } from '../../../types/execution.types';

/**
 * View model for the printed PRC report. Every value is already formatted text, so the
 * components only lay it out and the mappers can be tested without rendering.
 */
export interface DocField {
	label: string;
	value: string;
	/** Grid columns the field spans (default 1). */
	span?: number;
}

export interface DocColumn {
	key: string;
	label: string;
	align?: 'left' | 'right';
	/** CSS width, e.g. '12%'. Columns without one share the rest. */
	width?: string;
}

export interface DocPhoto {
	key: string;
	caption: string;
	fileName: string;
	imageUrl: string;
	regions: AnnotationRegion[];
	/** One line per numbered mark: "1. Pin hole (Surface)". Empty for reference images. */
	legend: string[];
}

export type DocDetail =
	| { kind: 'table'; title?: string; table: DocTableModel }
	| { kind: 'photos'; photos: DocPhoto[]; defects?: string }
	| { kind: 'text'; text: string };

export interface DocRow {
	key: string;
	/** Cell text by column key; '\n' starts a new line inside the cell. */
	cells: Record<string, string>;
	/** Column keys printed in bold (results that are not OK). */
	strong?: string[];
	/** Full-width rows printed directly under this row. */
	details?: DocDetail[];
}

export interface DocTableModel {
	columns: DocColumn[];
	rows: DocRow[];
	footer?: string;
}

export type DocStatus = 'Completed' | 'In progress' | 'Pending';

export interface DocSectionShell {
	key: string;
	number: number;
	title: string;
	status: DocStatus;
	gate: boolean;
	partialGate: boolean;
	meta: DocField[];
	approvals: DocField[];
	notices: string[];
}

export interface DocSectionBody {
	hasData: boolean;
	/** Shown instead of tables when the step's template data is missing. */
	unavailable?: string;
	tables: Array<{ title?: string; table: DocTableModel }>;
	notes: string[];
}

export type DocSectionModel = DocSectionShell & DocSectionBody;

export interface DocHeaderModel {
	title: string;
	subtitle?: string;
	orderNo: string;
	date: string;
	fields: DocField[];
	remarks: string;
}
