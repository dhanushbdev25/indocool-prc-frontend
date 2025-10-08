import { Grid, Paper } from '@mui/material';
import PictureItem from './PictureItem';
import { ImageItem } from '../../../hooks/useImageGallery';

interface PicturesProps {
	gallery: ImageItem[];
	onAddImage: (file: File) => void;
	onRemoveImage: (id: string | number) => void;
	view?: boolean;
}

const Pictures = ({ gallery, onAddImage, onRemoveImage, view }: PicturesProps) => {
	return (
		<Grid container spacing={1} columns={3}>
			{gallery.map(item => (
				<PictureItem key={item.id} item={item} onRemoveImage={onRemoveImage} view={view} />
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
							m: 1
						}}
					>
						<input
							accept="image/*"
							type="file"
							disabled={view}
							onChange={e => {
								const file = e.target.files?.[0];
								if (file) {
									onAddImage(file);
								}
							}}
							style={{
								opacity: 50,
								position: 'absolute',
								width: '100%',
								top: 50,
								left: 20,
								color: 'transparent',
								height: '100%',
								cursor: 'pointer'
							}}
						/>

						<img src={`/no-image.jpg`} alt="no-image" width={120} height={120} style={{ objectFit: 'cover' }} />
					</Paper>
				</Grid>
			)}
		</Grid>
	);
};

export default Pictures;
