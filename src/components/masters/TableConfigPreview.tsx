import {
	Box,
	Chip,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import type { TableConfig } from '../../types/table-config.types';
import { formatOkNotOkTypeForDisplay } from '../../utils/okNotOkLabels';
import { formatAcceptanceRange } from './acceptanceRange';

export interface TableConfigPreviewProps {
	config?: TableConfig | null;
	/** Heading above the grid. */
	title?: string;
	/** Shown in place of the grid when the master defined no columns. */
	emptyMessage?: string;
}

/**
 * Renders a configured table the way it will appear at execution: every column with its type and
 * acceptance range, and every pre-defined row with its seeded values and read-only cells. The
 * master screens used to summarise this as "4 columns, 2 rows", which hid the part a reviewer
 * actually needs to check.
 */

const TableConfigPreview = ({
	config,
	title = 'Table Structure',
	emptyMessage = 'No columns defined'
}: TableConfigPreviewProps) => {
	const columns = config?.columns || [];
	const rows = config?.rows || [];

	return (
		<Box sx={{ p: 2, backgroundColor: '#f0f4ff', borderRadius: '12px' }}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					mb: 1.5,
					flexWrap: 'wrap',
					gap: 1
				}}
			>
				<Typography variant="body2" sx={{ color: '#1a237e', fontWeight: 600 }}>
					{title}
				</Typography>
				<Chip
					label={`${columns.length} col${columns.length !== 1 ? 's' : ''} · ${rows.length} row${rows.length !== 1 ? 's' : ''}`}
					size="small"
					sx={{ backgroundColor: '#ede7f6', color: '#5e35b1', fontWeight: 500, fontSize: '0.7rem' }}
				/>
			</Box>

			{columns.length === 0 ? (
				<Typography variant="body2" sx={{ color: '#888', py: 1 }}>
					{emptyMessage}
				</Typography>
			) : (
				<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'auto' }}>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75, width: 40, textAlign: 'center' }}>
									#
								</TableCell>
								{columns.map((column, colIndex) => {
									const range = formatAcceptanceRange(column.minimumAcceptanceValue, column.maximumAcceptanceValue);
									return (
										<TableCell
											key={`${column.name}-${colIndex}`}
											sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75, verticalAlign: 'top' }}
										>
											{column.name}
											<Typography
												variant="caption"
												sx={{ display: 'block', color: '#666', fontWeight: 400, fontSize: '0.65rem' }}
											>
												{formatOkNotOkTypeForDisplay(column.type)}
											</Typography>
											{range && (
												<Typography
													variant="caption"
													sx={{ display: 'block', color: '#5e35b1', fontWeight: 500, fontSize: '0.65rem' }}
												>
													Range: {range}
												</Typography>
											)}
										</TableCell>
									);
								})}
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.map((row, rowIndex) => (
								<TableRow key={rowIndex} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
									<TableCell sx={{ textAlign: 'center', color: '#999', fontSize: '0.7rem' }}>{rowIndex + 1}</TableCell>
									{columns.map((column, colIndex) => {
										const cell = row.cells?.[column.name] || { value: '', readOnly: false };
										return (
											<TableCell key={`${column.name}-${colIndex}`} sx={{ fontSize: '0.8rem' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
													{cell.readOnly && <LockIcon sx={{ fontSize: 12, color: '#1976d2' }} />}
													<Typography
														variant="body2"
														sx={{
															fontSize: '0.8rem',
															...(cell.readOnly
																? { color: '#1565c0', fontWeight: 500 }
																: { color: '#999', fontStyle: 'italic' })
														}}
													>
														{cell.value || (cell.readOnly ? '-' : 'Editable')}
													</Typography>
												</Box>
											</TableCell>
										);
									})}
								</TableRow>
							))}
							{rows.length === 0 && (
								<TableRow>
									<TableCell colSpan={columns.length + 1} sx={{ textAlign: 'center', py: 2, color: '#aaa' }}>
										No rows defined — rows are added at execution
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
};

export default TableConfigPreview;
