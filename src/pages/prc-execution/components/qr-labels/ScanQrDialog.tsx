import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { parsePrcExecutionIdFromQrPayload } from './mapExecutionToQrLabel';

const READER_ELEMENT_ID = 'prc-qr-scan-reader';

type ScanQrDialogProps = {
	open: boolean;
	onClose: () => void;
	/** Called with the parsed PRC execution id when a valid QR is scanned. */
	onScanned: (executionId: number) => void;
};

const ScanQrDialog = ({ open, onClose, onScanned }: ScanQrDialogProps) => {
	const [error, setError] = useState<string | null>(null);
	const [starting, setStarting] = useState(false);
	const [readerMounted, setReaderMounted] = useState(false);
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const handledRef = useRef(false);
	const onScannedRef = useRef(onScanned);
	onScannedRef.current = onScanned;

	const readerRef = useCallback((node: HTMLDivElement | null) => {
		setReaderMounted(Boolean(node));
	}, []);

	useEffect(() => {
		if (!open) {
			setReaderMounted(false);
			setError(null);
			setStarting(false);
			handledRef.current = false;
			return;
		}
	}, [open]);

	useEffect(() => {
		if (!open || !readerMounted) return;

		handledRef.current = false;
		setError(null);
		setStarting(true);

		let cancelled = false;
		let scanner: Html5Qrcode | null = null;

		const stopScanner = async (instance: Html5Qrcode | null) => {
			if (!instance) return;
			try {
				if (instance.isScanning) {
					await instance.stop();
				}
			} catch {
				/* ignore stop errors */
			}
			try {
				instance.clear();
			} catch {
				/* ignore clear errors */
			}
		};

		const start = async () => {
			// Dialog portal / transition can lag one frame behind the callback ref.
			await new Promise<void>(resolve => {
				requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
			});
			if (cancelled) return;

			const el = document.getElementById(READER_ELEMENT_ID);
			if (!el) {
				setStarting(false);
				setError('Camera view failed to initialize. Close and try again.');
				return;
			}

			const boxSize = Math.max(140, Math.min(220, Math.floor(el.clientWidth * 0.7)));

			try {
				scanner = new Html5Qrcode(READER_ELEMENT_ID);
				scannerRef.current = scanner;

				await scanner.start(
					{ facingMode: 'environment' },
					{ fps: 10, qrbox: { width: boxSize, height: boxSize }, aspectRatio: 1 },
					decodedText => {
						if (cancelled || handledRef.current) return;
						const id = parsePrcExecutionIdFromQrPayload(decodedText);
						if (id == null) {
							setError('QR code is not a valid PRC execution link.');
							return;
						}
						handledRef.current = true;
						const instance = scanner;
						void stopScanner(instance).then(() => {
							scannerRef.current = null;
							if (!cancelled) onScannedRef.current(id);
						});
					},
					() => {
						/* frame scan miss — ignore */
					}
				);
				if (!cancelled) setStarting(false);
			} catch (err) {
				if (cancelled) return;
				setStarting(false);
				const message =
					err instanceof Error && err.message
						? err.message
						: 'Unable to access the camera. Check browser permissions and try again.';
				setError(message);
			}
		};

		void start();

		return () => {
			cancelled = true;
			const instance = scannerRef.current ?? scanner;
			scannerRef.current = null;
			void stopScanner(instance);
		};
	}, [open, readerMounted]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			aria-labelledby="scan-qr-title"
			slotProps={{
				paper: {
					sx: {
						m: { xs: 1, sm: 2 },
						width: 'calc(100% - 16px)',
						maxHeight: 'calc(100dvh - 16px)',
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden'
					}
				}
			}}
		>
			<DialogTitle id="scan-qr-title" sx={{ flexShrink: 0, py: 1.5, px: 2 }}>
				Scan QR Code
			</DialogTitle>
			<DialogContent
				dividers
				sx={{
					flex: 1,
					minHeight: 0,
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					gap: 1,
					px: 2,
					py: 1.5
				}}
			>
				<Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
					Point the camera at a PRC QR label. When recognized, you will be taken to that PRC execute
					screen.
				</Typography>

				{error ? (
					<Alert severity="error" sx={{ flexShrink: 0 }}>
						{error}
					</Alert>
				) : null}

				<Box
					sx={{
						position: 'relative',
						flex: 1,
						minHeight: { xs: 180, sm: 220 },
						maxHeight: '100%',
						borderRadius: 1,
						overflow: 'hidden',
						bgcolor: '#111',
						border: 1,
						borderColor: 'divider',
						[`& #${READER_ELEMENT_ID}`]: {
							width: '100%',
							height: '100%',
							'& video, & canvas, & img': {
								width: '100% !important',
								height: '100% !important',
								maxWidth: '100% !important',
								maxHeight: '100% !important',
								objectFit: 'cover',
								display: 'block'
							},
							'& > div': {
								width: '100% !important',
								height: '100% !important'
							}
						}
					}}
				>
					{starting && !error ? (
						<Box
							sx={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								zIndex: 1,
								pointerEvents: 'none'
							}}
						>
							<CircularProgress size={36} sx={{ color: '#fff' }} />
						</Box>
					) : null}
					{open ? (
						<div id={READER_ELEMENT_ID} ref={readerRef} style={{ width: '100%', height: '100%' }} />
					) : null}
				</Box>
			</DialogContent>
			<DialogActions sx={{ flexShrink: 0, px: 2, py: 1.25 }}>
				<Button onClick={onClose} color="inherit">
					Cancel
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ScanQrDialog;
