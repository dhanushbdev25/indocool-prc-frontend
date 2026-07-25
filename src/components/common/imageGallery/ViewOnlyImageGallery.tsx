import { useState } from 'react';
import {
	Box,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	Grid,
	IconButton,
	Paper,
	Typography
} from '@mui/material';
import BrokenImage from '@mui/icons-material/BrokenImage';
import Close from '@mui/icons-material/Close';
import ZoomIn from '@mui/icons-material/ZoomIn';
import { useAuthenticatedFileUrl } from '../../../hooks/useAuthenticatedFileUrl';

export interface ViewOnlyImage {
	id?: number | string;
	file?: File | null;
	image?: string;
	fileName?: string;
	filePath?: string;
	originalFileName?: string;
}

interface ViewOnlyImageGalleryProps {
	images: ViewOnlyImage[];
	emptyMessage?: string;
}

const getDisplayName = (image: ViewOnlyImage, index: number): string =>
	image.originalFileName?.trim() || image.file?.name || image.fileName?.trim() || `Image ${index + 1}`;

const GalleryImage = ({ image, alt, expanded = false }: { image: ViewOnlyImage; alt: string; expanded?: boolean }) => {
	const { src, loading, error } = useAuthenticatedFileUrl(image.filePath || image.image);

	if (loading) {
		return <CircularProgress size={expanded ? 36 : 24} aria-label={`Loading ${alt}`} />;
	}

	if (error || !src) {
		return (
			<BrokenImage sx={{ color: 'text.disabled', fontSize: expanded ? 64 : 32 }} aria-label={`Unable to load ${alt}`} />
		);
	}

	return (
		<Box
			component="img"
			src={src}
			alt={alt}
			sx={{
				display: 'block',
				width: '100%',
				height: expanded ? 'auto' : 120,
				maxHeight: expanded ? 'calc(100vh - 180px)' : 120,
				objectFit: expanded ? 'contain' : 'cover'
			}}
		/>
	);
};

const ViewOnlyImageGallery = ({ images, emptyMessage = 'No part images available' }: ViewOnlyImageGalleryProps) => {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const selectedImage = selectedIndex === null ? null : images[selectedIndex];
	const selectedName = selectedImage && selectedIndex !== null ? getDisplayName(selectedImage, selectedIndex) : '';

	if (images.length === 0) {
		return (
			<Typography variant="body2" color="text.secondary">
				{emptyMessage}
			</Typography>
		);
	}

	return (
		<>
			<Grid container spacing={2}>
				{images.map((image, index) => {
					const displayName = getDisplayName(image, index);
					return (
						<Grid key={image.id ?? image.filePath ?? image.image ?? `${displayName}-${index}`}>
							<Paper
								component="button"
								type="button"
								variant="outlined"
								onClick={() => setSelectedIndex(index)}
								aria-label={`View ${displayName}`}
								sx={{
									width: 160,
									height: 160,
									p: 0,
									display: 'flex',
									flexDirection: 'column',
									position: 'relative',
									overflow: 'hidden',
									cursor: 'zoom-in',
									backgroundColor: 'background.paper',
									borderColor: 'divider',
									'&:hover': { borderColor: 'primary.main', boxShadow: 2 },
									'&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
								}}
							>
								<Box
									sx={{
										height: 120,
										width: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: 'action.hover'
									}}
								>
									<GalleryImage image={image} alt={displayName} />
									<ZoomIn
										sx={{
											position: 'absolute',
											top: 6,
											right: 6,
											p: 0.4,
											borderRadius: 1,
											color: 'common.white',
											backgroundColor: 'rgba(0, 0, 0, 0.55)'
										}}
									/>
								</Box>
								<Typography
									variant="caption"
									title={displayName}
									sx={{
										width: '100%',
										height: 40,
										px: 1,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: 'text.primary',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap'
									}}
								>
									{displayName}
								</Typography>
							</Paper>
						</Grid>
					);
				})}
			</Grid>

			<Dialog
				open={selectedImage !== null}
				onClose={() => setSelectedIndex(null)}
				fullWidth
				maxWidth="lg"
				aria-labelledby="part-image-dialog-title"
			>
				<DialogTitle
					id="part-image-dialog-title"
					sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
				>
					<Typography variant="h6" component="span" noWrap title={selectedName}>
						{selectedName}
					</Typography>
					<IconButton onClick={() => setSelectedIndex(null)} aria-label="Close image preview" edge="end">
						<Close />
					</IconButton>
				</DialogTitle>
				<DialogContent
					dividers
					sx={{ p: 2, minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
				>
					{selectedImage && <GalleryImage image={selectedImage} alt={selectedName} expanded />}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default ViewOnlyImageGallery;
