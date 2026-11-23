import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExecutionData, TimelineStep } from '../../../types/execution.types';
import { DocHeader, DocSection } from './DocSection';
import { mapHeader } from './mapHeader';
import { mapSection } from './mapSection';
import { PhotoSettledContext } from './photoSettledContext';
import type { DocDetail, DocSectionModel, DocTableModel } from './types';
import './reportDocument.css';

function countPhotos(sections: DocSectionModel[]): number {
	const inDetails = (details: DocDetail[] = []): number =>
		details.reduce(
			(sum, detail) =>
				sum + (detail.kind === 'photos' ? detail.photos.length : detail.kind === 'table' ? inTable(detail.table) : 0),
			0
		);
	const inTable = (table: DocTableModel): number => table.rows.reduce((sum, row) => sum + inDetails(row.details), 0);
	return sections.reduce((sum, s) => sum + s.tables.reduce((t, block) => t + inTable(block.table), 0), 0);
}

/** Page-footer text must be a CSS string; keep only characters that are safe inside one. */
const cssSafe = (text: string) => text.replace(/[^A-Za-z0-9 ._/-]/g, '');

export interface ReportDocumentProps {
	execution: ExecutionData;
	steps: TimelineStep[];
	/** Set for a one-step report; its title goes into the header. */
	singleStep?: TimelineStep | null;
	/** Called with the number of photos still loading, so Print can wait for them. */
	onPendingPhotosChange?: (pending: number) => void;
}

/** The PRC report as a boxed, data-only document; the same markup is shown on screen and printed. */
export function ReportDocument({ execution, steps, singleStep, onPendingPhotosChange }: ReportDocumentProps) {
	const agg = useMemo(
		() =>
			execution.prcAggregatedSteps && typeof execution.prcAggregatedSteps === 'object'
				? (execution.prcAggregatedSteps as Record<string, unknown>)
				: {},
		[execution]
	);
	const tim = useMemo(
		() =>
			execution.stepStartEndTime && typeof execution.stepStartEndTime === 'object'
				? (execution.stepStartEndTime as Record<string, unknown>)
				: {},
		[execution]
	);
	const header = useMemo(() => mapHeader(execution, singleStep), [execution, singleStep]);
	const sections = useMemo(
		() => steps.map((step, index) => mapSection(step, index, execution, agg, tim)),
		[steps, execution, agg, tim]
	);
	const totalPhotos = useMemo(() => countPhotos(sections), [sections]);

	const [settled, setSettled] = useState<ReadonlySet<string>>(() => new Set());
	const onSettled = useCallback((key: string) => {
		setSettled(prev => (prev.has(key) ? prev : new Set(prev).add(key)));
	}, []);

	useEffect(() => {
		onPendingPhotosChange?.(Math.max(0, totalPhotos - settled.size));
	}, [onPendingPhotosChange, totalPhotos, settled]);

	const footerLeft = cssSafe(`PRC ${header.orderNo === '—' ? execution.id : header.orderNo}`);

	return (
		<PhotoSettledContext.Provider value={onSettled}>
			<style>{`@page { @bottom-left { content: "${footerLeft}"; font-size: 8pt; color: #4b5563; } }`}</style>
			<div className="prc-doc-root">
				<article className="prc-doc-sheet">
					<DocHeader header={header} />
					{sections.map(section => (
						<DocSection key={section.key} section={section} />
					))}
				</article>
			</div>
		</PhotoSettledContext.Provider>
	);
}

export default ReportDocument;
