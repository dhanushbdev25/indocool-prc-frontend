import { Box, Typography, IconButton, Checkbox, FormControlLabel, Chip } from '@mui/material';
import { KeyboardArrowUp as UpIcon, KeyboardArrowDown as DownIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Controller, Control } from 'react-hook-form';
import { PartMasterFormData } from '../schemas';
import { ExtendedPrcTemplateStep } from '../types';
import PartImageUpload from './PartImageUpload';
import { ImageItem } from '../../../../../../hooks/useImageGallery';

interface SelectedStepItemProps {
	step: ExtendedPrcTemplateStep;
	index: number;
	totalSteps: number;
	onReorder: (fromIndex: number, toIndex: number) => void;
	onRemove: (index: number) => void;
	control: Control<PartMasterFormData>;
	stepGallery?: ImageItem[];
	onAddStepImage?: (file: File) => void;
	onRemoveStepImage?: (id: number | string) => void;
}

const SelectedStepItem = ({
	step,
	index,
	totalSteps,
	onReorder,
	onRemove,
	control,
	stepGallery,
	onAddStepImage,
	onRemoveStepImage
}: SelectedStepItemProps) => {
	const canMoveUp = index > 0;
	const canMoveDown = index < totalSteps - 1;

	const getTypeColor = () => {
		return step.itemType === 'sequence' ? '#1976d2' : '#4caf50';
	};

	return (
		<Box
			sx={{
				border: '1px solid #e0e0e0',
				borderRadius: '8px',
				p: 2,
				mb: 2,
				backgroundColor: 'white',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: '50%',
							backgroundColor: getTypeColor(),
							color: 'white',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontWeight: 'bold',
							fontSize: '0.9rem'
						}}
					>
						{index + 3}
					</Box>
					<Box>
						<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
							{step.itemName}
						</Typography>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
							<Chip
								label={step.itemType.toUpperCase()}
								size="small"
								sx={{
									backgroundColor: getTypeColor(),
									color: 'white',
									fontSize: '0.7rem',
									height: 20
								}}
							/>
							<Typography variant="caption" color="textSecondary">
								ID: {step.itemId}
							</Typography>
						</Box>
					</Box>
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<IconButton
						size="small"
						onClick={() => canMoveUp && onReorder(index, index - 1)}
						disabled={!canMoveUp}
						sx={{ color: canMoveUp ? '#666' : '#ccc' }}
					>
						<UpIcon />
					</IconButton>
					<IconButton
						size="small"
						onClick={() => canMoveDown && onReorder(index, index + 1)}
						disabled={!canMoveDown}
						sx={{ color: canMoveDown ? '#666' : '#ccc' }}
					>
						<DownIcon />
					</IconButton>
					<IconButton
						size="small"
						onClick={() => onRemove(index)}
						sx={{ color: '#f44336', '&:hover': { backgroundColor: '#ffebee' } }}
					>
						<DeleteIcon />
					</IconButton>
				</Box>
			</Box>

			<Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
				<Controller
					name={`prcTemplateSteps.${index}.blockCatalystMixing`}
					control={control}
					render={({ field }) => (
						<FormControlLabel
							control={<Checkbox {...field} checked={field.value || false} color="primary" size="small" />}
							label="Block Catalyst Mixing"
							sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.85rem', color: '#666' } }}
						/>
					)}
				/>
				<Controller
					name={`prcTemplateSteps.${index}.requestSupervisorApproval`}
					control={control}
					render={({ field }) => (
						<FormControlLabel
							control={<Checkbox {...field} checked={field.value || false} color="primary" size="small" />}
							label="Request Supervisor Approval"
							sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.85rem', color: '#666' } }}
						/>
					)}
				/>
			</Box>

			{step.itemType === 'inspection' && stepGallery && onAddStepImage && onRemoveStepImage && (
				<Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
					<Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
						Part Drawings for this Inspection
					</Typography>
					<Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
						Upload images specific to this inspection step
					</Typography>
					<PartImageUpload
						gallery={stepGallery}
						onAddImage={onAddStepImage}
						onRemoveImage={onRemoveStepImage}
						view={false}
					/>
				</Box>
			)}
		</Box>
	);
};

export default SelectedStepItem;
