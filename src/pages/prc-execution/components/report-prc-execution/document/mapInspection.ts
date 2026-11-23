import type { AnnotationRegion, TimelineStep } from '../../../types/execution.types';
import { normalizeInspectionStepAggregatedData } from '../../../utils/inspectionAggregatedNormalization';
import {
	buildPreviewImageUrl,
	findMatchingPreviewFile,
	getUnannotatedPreviewFiles,
	type PreviewAnnotation,
	type PreviewImageFile
} from '../../../utils/inspectionPreviewImageHelpers';
import { readStoredRowList } from '../../../utils/storedRowList';
import { formatInspectionCriticality } from '../../../../../utils/criticality';
import { formatDisplayDate, formatDisplayDateTime } from '../../../../../utils/formatDisplayDate';
import { OK_NOT_OK_TYPE_KEY } from '../../../../../utils/okNotOkLabels';
import { sortByNumericOrder } from '../../../../../utils/orderedRecords';
import { EMPTY, dash, isNotOk, okNotOkResult, rangeResult } from './formatters';
import { columnsSubTable, fixedSubTable, listSubTable, okNotOkText, readOkNotOk, type SubTable } from './mapSubTables';
import type { DocDetail, DocPhoto, DocRow, DocSectionBody } from './types';

type Parameter = NonNullable<TimelineStep['inspectionParameters']>[number];
type Payload = Record<string, unknown>;

const UNAVAILABLE = 'Data not available for this step.';

const fileLabel = (file?: PreviewImageFile, annotation?: PreviewAnnotation) =>
	file?.originalFileName || file?.fileName || annotation?.imageFileName || 'image';

function legend(regions: AnnotationRegion[]): string[] {
	return regions.map((region, i) => {
		const comment = typeof region.comment === 'string' && region.comment.trim() ? region.comment.trim() : EMPTY;
		const category =
			typeof region.category === 'string' && region.category.trim() ? ` (${region.category.trim()})` : '';
		return `${i + 1}. ${comment}${category}`;
	});
}

function annotationsOf(value: unknown): PreviewAnnotation[] {
	return readStoredRowList<PreviewAnnotation>(value).filter(a => a && typeof a === 'object');
}

/** Annotated photos (and, optionally, the reference files nobody marked) as printable photos. */
function photosFor(
	annotations: PreviewAnnotation[],
	files: PreviewImageFile[],
	captionPrefix: string,
	keyPrefix: string,
	fallbackFiles: PreviewImageFile[] = [],
	includeUnannotated = false
): DocPhoto[] {
	const photos: DocPhoto[] = annotations.map((annotation, i) => {
		const file = findMatchingPreviewFile(files, annotation) ?? findMatchingPreviewFile(fallbackFiles, annotation);
		const regions = (Array.isArray(annotation.regions) ? annotation.regions : []) as AnnotationRegion[];
		const name = fileLabel(file, annotation);
		return {
			key: `${keyPrefix}-a${i}`,
			caption: `${captionPrefix}.${i + 1} — ${name}`,
			fileName: name,
			imageUrl: buildPreviewImageUrl(annotation, file),
			regions,
			legend: legend(regions)
		};
	});
	if (includeUnannotated) {
		getUnannotatedPreviewFiles(files, annotations).forEach((file, i) => {
			const name = fileLabel(file);
			photos.push({
				key: `${keyPrefix}-f${i}`,
				caption: `${captionPrefix}.${photos.length + 1} — ${name}`,
				fileName: name,
				imageUrl: buildPreviewImageUrl(undefined, file),
				regions: [],
				legend: []
			});
		});
	}
	return photos;
}

function defectsLine(value: unknown): string | undefined {
	if (!value || typeof value !== 'object') return undefined;
	const parts = Object.entries(value as Record<string, unknown>)
		.filter(([, count]) => Number(count) > 0)
		.map(([name, count]) => `${name} ${Number(count)}`);
	return parts.length ? `Defects: ${parts.join(', ')}` : undefined;
}

function singleValue(type: string, payload: Payload): { value: string; result: string } {
	const raw = payload.value;
	if (type === OK_NOT_OK_TYPE_KEY) {
		const comments = typeof payload.comments === 'string' ? payload.comments : '';
		return { value: okNotOkText(raw, comments), result: okNotOkResult(readOkNotOk(raw).value) };
	}
	if (type === 'datetime')
		return { value: typeof raw === 'string' && raw ? formatDisplayDateTime(raw) : EMPTY, result: EMPTY };
	if (type === 'date') return { value: typeof raw === 'string' && raw ? formatDisplayDate(raw) : EMPTY, result: EMPTY };
	return { value: dash(raw), result: rangeResult(payload.validationStatus, payload.acknowledged) };
}

function compound(parameter: Parameter | undefined, payload: Payload): SubTable | null {
	const type = parameter?.type ?? 'text';
	const value = payload.value;
	if (type === 'list') return listSubTable(value, parameter?.listConfig);
	if (type === 'fixed-table' && parameter?.tableConfig) return fixedSubTable(value, parameter.tableConfig);
	if (type === 'table' && parameter?.columns?.length) return columnsSubTable(value, parameter.columns);
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		// Multi-column answer: { column: value, column_validationStatus: … } in one row.
		const columns = parameter?.columns?.length
			? parameter.columns
			: Object.keys(value)
					.filter(key => !key.includes('_'))
					.map(name => ({ name, type }));
		return columnsSubTable([value], columns);
	}
	return null;
}

/** Inspection step: one row per parameter, sub-tables and photos directly under their row. */
export function mapInspection(step: TimelineStep, agg: Record<string, unknown>): DocSectionBody {
	const tid = step.stepData?.prcTemplateStepId;
	if (tid === undefined || tid === null) return { hasData: true, unavailable: UNAVAILABLE, tables: [], notes: [] };

	const slice = agg[String(tid)];
	const data = normalizeInspectionStepAggregatedData(
		slice && typeof slice === 'object' ? (slice as Record<string, unknown>) : {}
	);
	const parameters = sortByNumericOrder(step.inspectionParameters ?? []);
	const byId = new Map(parameters.map(p => [String(p.id), p]));
	const entries = Object.entries(data).filter(([key]) => /^\d+$/.test(key));
	const ordered = [
		...parameters.flatMap(p => entries.filter(([key]) => key === String(p.id))),
		...entries.filter(([key]) => !byId.has(key))
	];

	let notOk = 0;
	let gates = 0;
	let photoCount = 0;

	const rows: DocRow[] = ordered.map(([id, rawPayload], index) => {
		const parameter = byId.get(id);
		const payload = (rawPayload && typeof rawPayload === 'object' ? rawPayload : { value: rawPayload }) as Payload;
		const no = index + 1;
		const files = (parameter?.files ?? []) as PreviewImageFile[];
		const details: DocDetail[] = [];

		const sub = compound(parameter, payload);
		let value: string;
		let result: string;
		if (sub) {
			value = sub.table.rows.length ? 'See below' : EMPTY;
			result = sub.result;
			if (parameter?.type === 'fixed-table') {
				// Photos marked against a table row print under that row of the sub-table.
				const rowMappings = parameter.rowMappings ?? [];
				for (const rowEntry of readStoredRowList<Record<string, unknown>>(payload.rowAnnotations)) {
					const rowIndex = Number(rowEntry?.rowIndex);
					const target = sub.table.rows[rowIndex];
					const rowFiles = (rowMappings.find(m => m.rowIndex === rowIndex)?.fileName ?? []) as PreviewImageFile[];
					const photos = photosFor(
						annotationsOf(rowEntry?.annotations),
						rowFiles,
						`Photo ${no}.R${rowIndex + 1}`,
						`${id}-r${rowIndex}`,
						files
					);
					if (!target || photos.length === 0) continue;
					photoCount += photos.length;
					target.details = [
						...(target.details ?? []),
						{ kind: 'photos', photos, defects: defectsLine(rowEntry?.defectCounts) }
					];
				}
			}
			if (sub.table.rows.length) details.push({ kind: 'table', table: sub.table });
		} else {
			({ value, result } = singleValue(parameter?.type ?? 'text', payload));
		}

		const annotations = annotationsOf(payload.annotations);
		const photos = photosFor(annotations, files, `Photo ${no}`, id, [], true);
		if (parameter?.type !== 'fixed-table') {
			// Row-mapped defects on a non-fixed-table parameter print after its own photos.
			for (const rowEntry of readStoredRowList<Record<string, unknown>>(payload.rowAnnotations)) {
				const rowIndex = Number(rowEntry?.rowIndex);
				const rowFiles = (parameter?.rowMappings?.find(m => m.rowIndex === rowIndex)?.fileName ??
					[]) as PreviewImageFile[];
				photos.push(
					...photosFor(
						annotationsOf(rowEntry?.annotations),
						rowFiles,
						`Photo ${no}.R${rowIndex + 1}`,
						`${id}-r${rowIndex}`,
						files
					)
				);
			}
		}
		const defects = defectsLine(payload.defectCounts);
		if (photos.length || defects) {
			photoCount += photos.length;
			details.push({ kind: 'photos', photos, defects });
		}

		if (isNotOk(result)) notOk += 1;
		if (parameter?.ctq) gates += 1;

		return {
			key: `insp-${id}`,
			cells: {
				no: String(no),
				parameter: parameter?.parameterName || `Parameter ${id}`,
				gate: formatInspectionCriticality(parameter),
				value,
				result,
				instrument: dash(payload.instrumentId)
			},
			strong: isNotOk(result) ? ['result'] : undefined,
			details: details.length ? details : undefined
		};
	});

	return {
		hasData: rows.length > 0,
		notes: [],
		tables: [
			{
				table: {
					columns: [
						{ key: 'no', label: 'No', width: '5%' },
						{ key: 'parameter', label: 'Parameter' },
						{ key: 'gate', label: 'Gate', width: '11%' },
						{ key: 'value', label: 'Value', width: '24%' },
						{ key: 'result', label: 'Result', width: '13%' },
						{ key: 'instrument', label: 'Instrument', width: '13%' }
					],
					rows,
					footer: rows.length
						? `Parameters ${rows.length} · Gate ${gates} · Not OK ${notOk} · Photos ${photoCount}`
						: undefined
				}
			}
		]
	};
}
