import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	InputAdornment,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography
} from '@mui/material';
import {
	DeleteOutline as DeleteOutlineIcon,
	QrCode2 as QrCode2Icon,
	Search as SearchIcon
} from '@mui/icons-material';
import type { PrcExecution } from '../../../../store/api/business/prc-execution/prc-execution.validators';

type BulkQrSelectionDialogProps = {
	open: boolean;
	onClose: () => void;
	/** Pool of PRC executions available to search/add. */
	executions: PrcExecution[];
	onConfirm: (executionIds: number[]) => void;
};

const asKey = (value: unknown): string => {
	if (value == null) return '';
	return String(value).trim();
};

const normalize = (value: unknown): string => asKey(value).toLowerCase();

/** Prefer exact unique-key match, then unique substring match on order / reservation only. */
function findExecutionBySearch(executions: PrcExecution[], query: string): PrcExecution | null {
	const q = query.trim();
	if (!q) return null;
	const qNorm = q.toLowerCase();

	const exact = executions.filter(row => {
		const order = normalize(row.orderId);
		const reservation = normalize(row.reservation);
		return order === qNorm || reservation === qNorm;
	});
	if (exact.length === 1) return exact[0];
	if (exact.length > 1) return null;

	const partial = executions.filter(row => {
		const order = normalize(row.orderId);
		const reservation = normalize(row.reservation);
		return (order && order.includes(qNorm)) || (reservation && reservation.includes(qNorm));
	});
	return partial.length === 1 ? partial[0] : null;
}

const BulkQrSelectionDialog = ({ open, onClose, executions, onConfirm }: BulkQrSelectionDialogProps) => {
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState<PrcExecution[]>([]);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			setSearch('');
			setSelected([]);
			setMessage(null);
		}
	}, [open]);

	const selectedIds = useMemo(() => new Set(selected.map(row => row.id)), [selected]);

	const addFromSearch = () => {
		const q = search.trim();
		if (!q) {
			setMessage('Enter an Order No or Reservation.');
			return;
		}

		const match = findExecutionBySearch(executions, q);
		if (!match) {
			const qNorm = q.toLowerCase();
			const ambiguous = executions.filter(row => {
				const order = normalize(row.orderId);
				const reservation = normalize(row.reservation);
				return (
					order === qNorm ||
					reservation === qNorm ||
					(order && order.includes(qNorm)) ||
					(reservation && reservation.includes(qNorm))
				);
			});
			setMessage(
				ambiguous.length > 1
					? 'Multiple PRCs match that search. Use a more specific Order No or Reservation.'
					: 'No PRC found for that Order No or Reservation.'
			);
			return;
		}

		if (selectedIds.has(match.id)) {
			setMessage('That PRC is already in the list.');
			return;
		}

		setSelected(prev => [...prev, match]);
		setSearch('');
		setMessage(null);
	};

	const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		addFromSearch();
	};

	const handleSearchSubmit = (event: FormEvent) => {
		event.preventDefault();
		addFromSearch();
	};

	const handleRemove = (id: number) => {
		setSelected(prev => prev.filter(row => row.id !== id));
		setMessage(null);
	};

	const handleGenerate = () => {
		if (selected.length === 0) return;
		onConfirm(selected.map(row => row.id));
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-labelledby="bulk-qr-select-title">
			<DialogTitle id="bulk-qr-select-title">Generate QR Codes</DialogTitle>
			<DialogContent dividers>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
					Search by Order No or Reservation and press Enter to add that PRC. Generate when the list is ready.
				</Typography>

				<Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
					<TextField
						fullWidth
						autoFocus
						size="small"
						value={search}
						onChange={e => {
							setSearch(e.target.value);
							if (message) setMessage(null);
						}}
						onKeyDown={handleSearchKeyDown}
						placeholder="Search Order No / Reservation"
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon fontSize="small" color="action" />
								</InputAdornment>
							)
						}}
					/>
				</Box>

				{message ? (
					<Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
						{message}
					</Typography>
				) : null}

				{selected.length === 0 ? (
					<Box
						sx={{
							py: 5,
							px: 2,
							textAlign: 'center',
							border: '1px dashed',
							borderColor: 'divider',
							borderRadius: 1,
							bgcolor: theme =>
								theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'grey.50'
						}}
					>
						<Typography variant="body2" color="text.secondary">
							No PRCs added yet. Search and press Enter to add rows.
						</Typography>
					</Box>
				) : (
					<Stack spacing={1}>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{selected.length} PRC{selected.length === 1 ? '' : 's'} selected
						</Typography>
						<Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'auto' }}>
							<Table size="small" stickyHeader>
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 700 }}>Order No</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Reservation</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Part Number</TableCell>
										<TableCell align="right" sx={{ fontWeight: 700, width: 56 }} />
									</TableRow>
								</TableHead>
								<TableBody>
									{selected.map(row => (
										<TableRow key={row.id} hover>
											<TableCell>{asKey(row.orderId) || '—'}</TableCell>
											<TableCell
												sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem' }}
											>
												{asKey(row.reservation) || '—'}
											</TableCell>
											<TableCell>{asKey(row.partNumber) || '—'}</TableCell>
											<TableCell align="right">
												<IconButton
													size="small"
													aria-label={`Remove PRC ${row.id}`}
													onClick={() => handleRemove(row.id)}
												>
													<DeleteOutlineIcon fontSize="small" />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					</Stack>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
				<Button onClick={onClose} color="inherit">
					Cancel
				</Button>
				<Button
					variant="contained"
					startIcon={<QrCode2Icon />}
					onClick={handleGenerate}
					disabled={selected.length === 0}
				>
					Generate QR Codes ({selected.length})
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default BulkQrSelectionDialog;
