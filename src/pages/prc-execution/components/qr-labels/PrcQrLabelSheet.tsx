import PrcQrLabel from './PrcQrLabel';
import type { PrcQrLabelFields } from './mapExecutionToQrLabel';

const LABELS_PER_PAGE = 9;

type PrcQrLabelSheetProps = {
	labels: PrcQrLabelFields[];
};

const PrcQrLabelSheet = ({ labels }: PrcQrLabelSheetProps) => {
	const pages: PrcQrLabelFields[][] = [];
	for (let i = 0; i < labels.length; i += LABELS_PER_PAGE) {
		pages.push(labels.slice(i, i + LABELS_PER_PAGE));
	}

	if (pages.length === 0) {
		return <div className="prc-qr-label-sheet prc-qr-label-sheet--empty">No labels to display.</div>;
	}

	return (
		<div className="prc-qr-label-sheet-root">
			{pages.map((pageLabels, pageIndex) => (
				<section
					key={`page-${pageIndex}`}
					className={`prc-qr-label-sheet${pageIndex < pages.length - 1 ? ' prc-qr-label-sheet--break' : ''}`}
					aria-label={`QR label sheet page ${pageIndex + 1}`}
				>
					{pageLabels.map(fields => (
						<PrcQrLabel key={fields.executionId} fields={fields} />
					))}
				</section>
			))}
		</div>
	);
};

export default PrcQrLabelSheet;
