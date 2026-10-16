import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import type { ListConfig } from '../../types/list-config.types';
import { LIST_ITEM_TYPE_OPTIONS } from '../../utils/listConfig';
import { formatAcceptanceRange } from './acceptanceRange';

export interface ListConfigPreviewProps {
	config?: ListConfig | null;
	title?: string;
}

const typeLabel = (type: string) => LIST_ITEM_TYPE_OPTIONS.find(option => option.value === type)?.label ?? type;

/** Read-only view of a configured list, laid out the way the operator will see it. */
const ListConfigPreview = ({ config, title = 'List Items' }: ListConfigPreviewProps) => {
	const items = config?.items ?? [];

	return (
		<Box sx={{ p: 2, backgroundColor: '#f0f4ff', borderRadius: '12px' }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
				<Typography variant="body2" sx={{ color: '#1a237e', fontWeight: 600 }}>
					{title}
				</Typography>
				<Chip
					label={`${items.length} item${items.length !== 1 ? 's' : ''}`}
					size="small"
					sx={{ backgroundColor: '#ede7f6', color: '#5e35b1', fontWeight: 500, fontSize: '0.7rem' }}
				/>
			</Box>
			{items.length === 0 ? (
				<Typography variant="body2" sx={{ color: '#888', py: 1 }}>
					No items defined
				</Typography>
			) : (
				<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
					<Table size="small">
						<TableBody>
							{items.map(item => {
								const range =
									item.type === 'number'
										? formatAcceptanceRange(item.minimumAcceptanceValue, item.maximumAcceptanceValue)
										: null;
								return (
									<TableRow key={item.id}>
										<TableCell sx={{ width: '40%', fontWeight: 600, fontSize: '0.8rem', backgroundColor: '#f5f5f5' }}>
											{item.label || <em style={{ color: '#bbb' }}>Untitled</em>}
											{item.required && !item.readOnly && <span style={{ color: '#d32f2f' }}> *</span>}
										</TableCell>
										<TableCell sx={{ fontSize: '0.8rem' }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
												{item.readOnly && <LockIcon sx={{ fontSize: 12, color: '#1976d2' }} />}
												<Typography
													variant="body2"
													sx={{
														fontSize: '0.8rem',
														...(item.readOnly
															? { color: '#1565c0', fontWeight: 500 }
															: { color: '#999', fontStyle: 'italic' })
													}}
												>
													{item.readOnly
														? item.defaultValue || '-'
														: item.defaultValue
															? `Default: ${item.defaultValue}`
															: 'Entered at execution'}
												</Typography>
												<Typography variant="caption" sx={{ color: '#666' }}>
													· {typeLabel(item.type)}
												</Typography>
												{range && (
													<Typography variant="caption" sx={{ color: '#5e35b1', fontWeight: 500 }}>
														· Range: {range}
													</Typography>
												)}
											</Box>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
};

export default ListConfigPreview;
