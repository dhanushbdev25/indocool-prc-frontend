import { Grid, Paper, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import { ImageItem } from '../../../../../../hooks/useImageGallery';

interface PartImageUploadProps {
	gallery: ImageItem[];
	onAddImage: (file: File) => void;
	onRemoveImage: (id: number | string) => void;
	view?: boolean;
}

const PartImageUpload = ({ gallery, onAddImage, onRemoveImage, view = false }: PartImageUploadProps) => {
	return (
		<Grid container spacing={1} columns={3}>
			{gallery.map(item => (
				<Grid key={item.id}>
					<Paper
						variant="outlined"
						sx={{
							width: 120,
							height: 120,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
							overflow: 'hidden',
							m: 1
						}}
					>
						<img src={item.image} alt={`IMAGE-${item.id}`} width={120} height={100} style={{ objectFit: 'cover' }} />
						{item.fileName && (
							<Typography
								variant="caption"
								sx={{
									position: 'absolute',
									bottom: 0,
									left: 0,
									right: 0,
									backgroundColor: 'rgba(0,0,0,0.7)',
									color: 'white',
									p: 0.5,
									fontSize: '0.7rem',
									textAlign: 'center',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}
							>
								{item.fileName}
							</Typography>
						)}
						{!view && (
							<IconButton
								onClick={() => onRemoveImage(item.id)}
								sx={{
									position: 'absolute',
									top: 2,
									right: 2,
									backgroundColor: 'rgba(255,255,255,0.7)',
									zIndex: 999999,
									'&:hover': {
										backgroundColor: 'rgba(255,0,0,0.7)',
										color: 'white'
									}
								}}
								size="small"
							>
								<CloseIcon fontSize="small" />
							</IconButton>
						)}
					</Paper>
				</Grid>
			))}
			{!view && (
				<Grid>
					<Paper
						variant="outlined"
						sx={{
							width: 120,
							height: 120,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
							overflow: 'hidden',
							m: 1,
							border: '2px dashed #e0e0e0',
							'&:hover': {
								borderColor: '#1976d2',
								backgroundColor: 'rgba(25, 118, 210, 0.04)'
							}
						}}
					>
						<input
							accept="image/*"
							type="file"
							onChange={e => {
								const file = e.target.files?.[0];
								if (file) {
									onAddImage(file);
								}
							}}
							style={{
								opacity: 0,
								position: 'absolute',
								width: '100%',
								height: '100%',
								cursor: 'pointer'
							}}
						/>
						<AddIcon sx={{ color: '#666', fontSize: 32 }} />
					</Paper>
				</Grid>
			)}
		</Grid>
	);
};

export default PartImageUpload;
