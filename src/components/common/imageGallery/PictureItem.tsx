import { Grid, Paper, IconButton, CircularProgress } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { ImageItem } from '../../../hooks/useImageGallery';
import { useAuthenticatedFileUrl } from '../../../hooks/useAuthenticatedFileUrl';

interface PictureItemProps {
	item: ImageItem;
	onRemoveImage: (id: number | string) => void;
	view?: boolean;
}

const PictureItem = ({ item, onRemoveImage, view }: PictureItemProps) => {
	const { src, loading, error } = useAuthenticatedFileUrl(item.filePath || item.image);

	return (
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
					m: 1
				}}
			>
				{loading && <CircularProgress size={24} />}
				{error && !loading && <BrokenImageIcon sx={{ color: 'text.disabled', fontSize: 32 }} />}
				{!loading && !error && src && (
					<img src={src} alt={`IMAGE-${item.id}`} width={120} height={120} style={{ objectFit: 'cover' }} />
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
	);
};

export default PictureItem;
