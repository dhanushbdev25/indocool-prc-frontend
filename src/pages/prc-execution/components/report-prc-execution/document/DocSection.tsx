import indocoolLogo from '../../../../../assets/images/auth/Indocool-main-logo.png';
import { DocTable } from './DocTable';
import type { DocField, DocHeaderModel, DocSectionModel } from './types';

/** Boxed label / value grid; `attached` drops the top border so it joins the box above. */
export function DocFieldGrid({
	fields,
	columns = 4,
	attached = false
}: {
	fields: DocField[];
	columns?: number;
	attached?: boolean;
}) {
	return (
		<div
			className={attached ? 'prc-doc-grid prc-doc-grid-attached' : 'prc-doc-grid'}
			style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
		>
			{fields.map(field => (
				<div key={field.label} style={field.span ? { gridColumn: `span ${field.span}` } : undefined}>
					<span className="prc-doc-label">{field.label}</span>
					<span className="prc-doc-value">{field.value}</span>
				</div>
			))}
		</div>
	);
}

export function DocHeader({ header }: { header: DocHeaderModel }) {
	return (
		<header>
			<div className="prc-doc-head">
				{/* The logo artwork is white, so it sits on the same dark band as the QR label's. */}
				<div className="prc-doc-logo-cell">
					<img className="prc-doc-logo" src={indocoolLogo} alt="Indocool" />
				</div>
				<div>
					<span className="prc-doc-label">Order no.</span>
					<span className="prc-doc-value">{header.orderNo}</span>
				</div>
				<div>
					<span className="prc-doc-label">Date</span>
					<span className="prc-doc-value">{header.date}</span>
				</div>
				{header.subtitle && (
					<div>
						<span className="prc-doc-label">Step</span>
						<span className="prc-doc-value">{header.subtitle}</span>
					</div>
				)}
			</div>
			<DocFieldGrid attached fields={[...header.fields, { label: 'Remarks', value: header.remarks, span: 4 }]} />
			<p className="prc-doc-signature-note">
				Physical signature is not required for Digital PRC; electronic approval shall serve as evidence of
				authorization.
			</p>
		</header>
	);
}

export function DocSection({ section }: { section: DocSectionModel }) {
	const flags = [section.gate && 'Gate', section.partialGate && 'Partial gate approval', section.status]
		.filter(Boolean)
		.join(' · ');
	return (
		<section className="prc-doc-section">
			<div className="prc-doc-section-title">
				<span>
					{section.number}. {section.title}
				</span>
				<span className="prc-doc-section-flags">{flags}</span>
			</div>
			{section.meta.length > 0 && (
				<div className="prc-doc-strip">
					{section.meta.map(field => (
						<div key={field.label}>
							<span className="prc-doc-label">{field.label}</span>
							<span className="prc-doc-value">{field.value}</span>
						</div>
					))}
				</div>
			)}
			{section.notices.map(notice => (
				<div key={notice} className="prc-doc-box-line">
					{notice}
				</div>
			))}
			{section.unavailable ? (
				<div className="prc-doc-box-line prc-doc-empty">{section.unavailable}</div>
			) : !section.hasData ? (
				<div className="prc-doc-box-line prc-doc-empty">Not started — no data recorded</div>
			) : (
				section.tables.map((block, i) => (
					<div key={block.title ?? i} className="prc-doc-block">
						{block.title && <div className="prc-doc-block-title">{block.title}</div>}
						<DocTable table={block.table} />
					</div>
				))
			)}
			{section.hasData && !section.unavailable && section.notes.length > 0 && (
				<ul className="prc-doc-notes">
					{section.notes.map(note => (
						<li key={note}>{note}</li>
					))}
				</ul>
			)}
			{section.approvals.length > 0 && (
				<div className="prc-doc-approvals">
					<DocFieldGrid attached columns={Math.min(section.approvals.length, 3)} fields={section.approvals} />
				</div>
			)}
		</section>
	);
}
