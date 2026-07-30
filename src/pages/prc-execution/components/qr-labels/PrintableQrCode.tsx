import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type PrintableQrCodeProps = {
	value: string;
	size?: number;
	title?: string;
};

/**
 * Generates QR as a PNG data-URL <img>.
 * Avoids DOM canvas rasterization — off-screen / print-portal canvases often
 * paint blank in production browsers, which made printed QRs empty.
 */
const PrintableQrCode = ({ value, size = 72, title }: PrintableQrCodeProps) => {
	const [dataUrl, setDataUrl] = useState('');

	useEffect(() => {
		let cancelled = false;
		setDataUrl('');

		void QRCode.toDataURL(value, {
			width: size,
			margin: 0,
			errorCorrectionLevel: 'M',
			color: {
				dark: '#000000',
				light: '#FFFFFF'
			}
		})
			.then(url => {
				if (!cancelled) setDataUrl(url);
			})
			.catch(() => {
				if (!cancelled) setDataUrl('');
			});

		return () => {
			cancelled = true;
		};
	}, [value, size]);

	if (!dataUrl) {
		return (
			<span
				className="prc-qr-label__qr-img prc-qr-label__qr-img--placeholder"
				style={{ width: size, height: size, display: 'inline-block' }}
				aria-hidden
			/>
		);
	}

	return (
		<img
			className="prc-qr-label__qr-img"
			src={dataUrl}
			alt={title || 'QR code'}
			width={size}
			height={size}
			decoding="sync"
		/>
	);
};

export default PrintableQrCode;
