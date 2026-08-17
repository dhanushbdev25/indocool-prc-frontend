import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
	Box,
	Button,
	CircularProgress,
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
import dayjs from '../../../../utils/dayjsSetup';
import { APP_TIMEZONE } from '../../../../utils/dateConfig';
import type { PrcExecution } from '../../../../store/api/business/prc-execution/prc-execution.validators';
import {
	useLazyFetchPrcExecutionsQuery,
	type PrcExecutionsListArgs
} from '../../../../store/api/business/prc-execution/prc-execution.api';

type BulkQrSelectionDialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: (executionIds: number[]) => void;
};

const asKey = (value: unknown): string => {
	if (value == null) return '';
	return String(value).trim();
};

/** Server forces a last-80-days window when dates are absent, so search all-time explicitly. */
const LOOKUP_FROM_DATE = '2000-01-01';

const BulkQrSelectionDialog = ({ open, onClose, onConfirm }: BulkQrSelectionDialogProps) => {
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState<PrcExecution[]>([]);
	const [message, setMessage] = useState<string | null>(null);
	const [isSearching, setIsSearching] = useState(false);
	const [triggerFetchPrcExecutions] = useLazyFetchPrcExecutionsQuery();

	useEffect(() => {
		if (!open) {
			setSearch('');
			setSelected([]);
			setMessage(null);
			setIsSearching(false);
		}
	}, [open]);

	const selectedIds = useMemo(() => new Set(selected.map(row => row.id)), [selected]);

	const addFromSearch = async () => {
		const q = search.trim();
		if (!q) {
			setMessage('Enter an Order No or Reservation.');
			return;
		}
		if (isSearching) return;

		setIsSearching(true);
		setMessage(null);
		try {
			const runLookup = async (term: string) => {
				const base: PrcExecutionsListArgs = {
					page: 1,
					pageSize: 2,
					fromDate: LOOKUP_FROM_DATE,
					// Server bounds the range in APP_TIMEZONE, so resolve "today" there, not in the browser's zone.
					toDate: dayjs.tz(undefined, APP_TIMEZONE).format('YYYY-MM-DD')
				};
				const [byOrder, byReservation] = await Promise.all([
					triggerFetchPrcExecutions({ ...base, orderId: [term] }, true).unwrap(),
					triggerFetchPrcExecutions({ ...base, reservation: [term] }, true).unwrap()
				]);
				return {
					byOrder,
					byReservation,
					totalMatches: byOrder.pagination.totalCount + byReservation.pagination.totalCount
				};
			};

			// Server matching is case-sensitive; retry uppercased (SAP identifiers are stored uppercase).
			let lookup = await runLookup(q);
			const qUpper = q.toUpperCase();
			if (lookup.totalMatches === 0 && qUpper !== q) {
				lookup = await runLookup(qUpper);
			}
			const { byOrder, byReservation, totalMatches } = lookup;

			const merged = new Map<number, PrcExecution>();
			for (const row of [...byOrder.data, ...byReservation.data]) merged.set(row.id, row);

			if (totalMatches === 0) {
				setMessage('No PRC found for that Order No or Reservation.');
				return;
			}
			if (
				merged.size > 1 ||
				byOrder.pagination.totalCount > 1 ||
				byReservation.pagination.totalCount > 1
			) {
				setMessage('Multiple PRCs match that search. Use the exact Order No or Reservation.');
				return;
			}

			const [match] = merged.values();
			if (selectedIds.has(match.id)) {
				setMessage('That PRC is already in the list.');
				return;
			}

			setSelected(prev => [...prev, match]);
			setSearch('');
		} catch {
			setMessage('Search failed. Try again.');
		} finally {
			setIsSearching(false);
		}
	};

	const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		void addFromSearch();
	};

	const handleSearchSubmit = (event: FormEvent) => {
		event.preventDefault();
		void addFromSearch();
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
					Search by exact Order No or Reservation and press Enter to add that PRC. Generate when the list is ready.
				</Typography>

				<Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
					<TextField
						fullWidth
						autoFocus
						size="small"
						value={search}
						disabled={isSearching}
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
							),
							endAdornment: isSearching ? (
								<InputAdornment position="end">
									<CircularProgress size={16} />
								</InputAdornment>
							) : null
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
