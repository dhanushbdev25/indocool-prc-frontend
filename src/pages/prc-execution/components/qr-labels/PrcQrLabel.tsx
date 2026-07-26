import indocoolLogo from '../../../../assets/images/auth/Indocool-main-logo.png';
import PrintableQrCode from './PrintableQrCode';
import type { PrcQrLabelFields } from './mapExecutionToQrLabel';

const ROWS: { key: keyof PrcQrLabelFields; label: string }[] = [
	{ key: 'customerName', label: 'Customer Name' },
	{ key: 'partNumber', label: 'Part No.' },
	{ key: 'partDescription', label: 'Part Description' },
	{ key: 'drawingNumber', label: 'Drawing No.' },
	{ key: 'revNo', label: 'Rev. No.' },
	{ key: 'modelNo', label: 'Model No.' },
	{ key: 'setIdSerialNo', label: 'Set ID/Serial No.' },
	{ key: 'productionDate', label: 'Production Date' },
	{ key: 'purchaseOrderNo', label: 'Purchase Order No.' }
];

type PrcQrLabelProps = {
	fields: PrcQrLabelFields;
};

const PrcQrLabel = ({ fields }: PrcQrLabelProps) => (
	<article className="prc-qr-label" aria-label={`QR label for PRC ${fields.executionId}`}>
		<header className="prc-qr-label__header">
			<img className="prc-qr-label__logo" src={indocoolLogo} alt="Indocool Logo" />
			<div className="prc-qr-label__company">INDOCOOL COMPOSITES PRIVATE LIMITED - INDIA</div>
		</header>

		<div className="prc-qr-label__body">
			<span className="prc-qr-label__mark-e" aria-hidden>
				E
			</span>

			<table className="prc-qr-label__table">
				<tbody>
					{ROWS.map(row => (
						<tr key={row.key}>
							<th scope="row">{row.label}</th>
							<td>{fields[row.key]}</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className="prc-qr-label__qr-block">
				<div className="prc-qr-label__qr">
					<PrintableQrCode value={fields.qrUrl} size={68} title={`PRC ${fields.executionId}`} />
				</div>
				<div className="prc-qr-label__mark-m" aria-hidden>
					M 1
				</div>
			</div>
		</div>
	</article>
);

export default PrcQrLabel;
