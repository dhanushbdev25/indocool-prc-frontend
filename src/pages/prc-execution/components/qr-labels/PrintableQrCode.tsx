import { useLayoutEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

type PrintableQrCodeProps = {
	value: string;
	size?: number;
	title?: string;
};

/**
 * Renders QR as a PNG <img> so it survives browser print / Save-as-PDF.
 * SVG/canvas QR codes are frequently dropped by print engines when nested
 * in dialogs that use visibility/overflow/transform.
 */
const PrintableQrCode = ({ value, size = 72, title }: PrintableQrCodeProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [dataUrl, setDataUrl] = useState('');

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		try {
			setDataUrl(canvas.toDataURL('image/png'));
		} catch {
			setDataUrl('');
		}
	}, [value, size]);

	return (
		<>
			{/* Off-screen source canvas used only to rasterize the QR */}
			<span className="prc-qr-label__qr-source" aria-hidden>
				<QRCodeCanvas
					ref={canvasRef}
					value={value}
					size={size}
					level="M"
					marginSize={0}
					bgColor="#FFFFFF"
					fgColor="#000000"
				/>
			</span>
			{dataUrl ? (
				<img className="prc-qr-label__qr-img" src={dataUrl} alt={title || 'QR code'} width={size} height={size} />
			) : (
				// Fallback while canvas paints (or if toDataURL fails)
				<canvas width={size} height={size} className="prc-qr-label__qr-img" aria-hidden />
			)}
		</>
	);
};

export default PrintableQrCode;
