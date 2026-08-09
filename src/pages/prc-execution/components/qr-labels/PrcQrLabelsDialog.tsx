import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import PrcQrLabelSheet from './PrcQrLabelSheet';
import type { PrcQrLabelFields } from './mapExecutionToQrLabel';
import './prcQrLabelPrint.css';

type PrcQrLabelsDialogProps = {
	open: boolean;
	onClose: () => void;
	labels: PrcQrLabelFields[];
	loading?: boolean;
	error?: string | null;
};

const PAGE_RULE_STYLE_ID = 'prc-qr-labels-page-rule';

/**
 * `@page` cannot be scoped to a component and its declarations cascade globally,
 * so another screen's stylesheet (the execution report ships `@page { size: A4
 * portrait }`) stays in effect once its chunk has loaded. `size: auto` explicitly
 * resets that and is the only value that leaves the paper-size and layout pickers
 * enabled in the browser's print dialog. Injected last so it wins the cascade,
 * and removed on close so it cannot leak into other screens' printing.
 */
const usePrintPageRule = (active: boolean) => {
	useEffect(() => {
		if (!active) return;
		const style = document.createElement('style');
		style.id = PAGE_RULE_STYLE_ID;
		style.textContent = '@page { size: auto; margin: 8mm; }';
		document.head.appendChild(style);
		return () => {
			style.remove();
		};
	}, [active]);
};

const PrcQrLabelsDialog = ({ open, onClose, labels, loading = false, error = null }: PrcQrLabelsDialogProps) => {
	const canPrint = !loading && !error && labels.length > 0;

	usePrintPageRule(open);

	useEffect(() => {
		if (!open) return;
		document.body.classList.add('prc-qr-labels-print-active');
		return () => {
			document.body.classList.remove('prc-qr-labels-print-active');
		};
	}, [open]);

	const handlePrint = () => {
		// Avoid aria-hidden focus warning from MUI Dialog while printing.
		const active = document.activeElement;
		if (active instanceof HTMLElement) {
			active.blur();
		}

		let attempts = 0;
		const tryPrint = () => {
			const root = document.querySelector('body > .prc-qr-labels-print-root');
			const imgs = root ? Array.from(root.querySelectorAll<HTMLImageElement>('img.prc-qr-label__qr-img')) : [];
			const ready =
				imgs.length > 0 &&
				imgs.length >= labels.length &&
				imgs.every(img => img.complete && img.naturalWidth > 0 && img.src.startsWith('data:image'));
			if (ready || attempts > 60) {
				window.print();
				return;
			}
			attempts += 1;
			requestAnimationFrame(tryPrint);
		};
		requestAnimationFrame(tryPrint);
	};

	const title =
		labels.length === 1
			? `QR Label — PRC #${labels[0]?.executionId ?? ''}`
			: `QR Labels (${labels.length})`;

	const sheet = canPrint ? <PrcQrLabelSheet labels={labels} /> : null;

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth="lg"
				fullWidth
				aria-labelledby="prc-qr-labels-dialog-title"
				className="prc-qr-labels-dialog-root"
				slotProps={{
					backdrop: { className: 'prc-qr-labels-no-print' },
					paper: {
						className: 'prc-qr-labels-no-print',
						sx: { maxHeight: '92vh' }
					}
				}}
			>
				<DialogTitle id="prc-qr-labels-dialog-title" className="prc-qr-labels-no-print">
					{title}
				</DialogTitle>
				<DialogContent dividers sx={{ p: 0 }} className="prc-qr-labels-no-print">
					{loading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
							<CircularProgress size={36} />
						</Box>
					) : error ? (
						<Box sx={{ p: 3 }}>
							<Typography color="error">{error}</Typography>
						</Box>
					) : (
						<div className="prc-qr-labels-dialog-preview">{sheet}</div>
					)}
				</DialogContent>
				<DialogActions className="prc-qr-labels-no-print" sx={{ px: 2, py: 1.5, gap: 1 }}>
					<Button onClick={onClose} color="inherit">
						Close
					</Button>
					<Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!canPrint}>
						Print / Save as PDF
					</Button>
				</DialogActions>
			</Dialog>

			{/* Body-level print surface — PNG data-URL QRs (not canvas) so off-screen portal still prints */}
			{open &&
				canPrint &&
				createPortal(
					<div className="prc-qr-labels-print-root" aria-hidden>
						{sheet}
					</div>,
					document.body
				)}
		</>
	);
};

export default PrcQrLabelsDialog;
