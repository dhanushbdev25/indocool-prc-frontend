import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Group } from 'react-konva';
import type Konva from 'konva';
import {
	Box,
	Typography,
	Paper,
	IconButton,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	Button,
	Chip
} from '@mui/material';
import { ZoomIn, ZoomOut, Fullscreen, Image as ImageIcon } from '@mui/icons-material';
import { type AnnotationRegion } from '../../../types/execution.types';

interface ImageDisplayProps {
	imageUrl: string;
	imageFileName: string;
	originalFileName: string;
	annotations: AnnotationRegion[];
	readOnly?: boolean;
	showAnnotations?: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
	imageUrl,
	imageFileName: _imageFileName,
	originalFileName,
	annotations,
	readOnly = true,
	showAnnotations = true
}) => {
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [showFullscreen, setShowFullscreen] = useState(false);

	const stageRef = useRef<Konva.Stage>(null);
	const imageRef = useRef<Konva.Image>(null);

	// Load image
	useEffect(() => {
		if (!imageUrl) {
			// Use setTimeout to avoid synchronous setState in effect
			const timeoutId = setTimeout(() => {
				setImageError(true);
				setImageLoaded(false);
				setKonvaImage(null);
			}, 0);
			return () => clearTimeout(timeoutId);
		}

		// Reset state when image URL changes
		const resetTimeoutId = setTimeout(() => {
			setImageLoaded(false);
			setImageError(false);
			setKonvaImage(null);
		}, 0);

		const img = new Image();
		img.crossOrigin = 'anonymous';

		let isMounted = true;

		img.onload = () => {
			if (!isMounted) return;

			setKonvaImage(img);
			setImageLoaded(true);
			setImageError(false);

			// Calculate optimal canvas size
			const maxWidth = 300;
			const maxHeight = 200;
			const aspectRatio = img.width / img.height;

			let width = maxWidth;
			let height = maxWidth / aspectRatio;

			if (height > maxHeight) {
				height = maxHeight;
				width = maxHeight * aspectRatio;
			}

			setCanvasSize({ width, height });
		};

		img.onerror = () => {
			if (!isMounted) return;

			setImageError(true);
			setImageLoaded(false);
		};

		img.src = imageUrl;

		// Cleanup function
		return () => {
			clearTimeout(resetTimeoutId);
			isMounted = false;
		};
	}, [imageUrl]);

	// Handle zoom
	const handleZoom = (direction: 'in' | 'out') => {
		const newScale = direction === 'in' ? scale * 1.2 : scale / 1.2;
		setScale(Math.max(0.1, Math.min(5, newScale)));
	};

	// Handle drag
	const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
		if (!readOnly) {
			setIsDragging(true);
			setDragStart({ x: e.evt.clientX - position.x, y: e.evt.clientY - position.y });
		}
	};

	const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
		if (isDragging && !readOnly) {
			const newPosition = {
				x: e.evt.clientX - dragStart.x,
				y: e.evt.clientY - dragStart.y
			};
			setPosition(newPosition);
		}
	};

	const handleStageMouseUp = () => {
		setIsDragging(false);
	};

	// Render annotation for a specific canvas size
	const renderAnnotationForCanvas = (
		annotation: AnnotationRegion,
		index: number,
		canvasSize: { width: number; height: number }
	) => {
		if (!showAnnotations) return null;

		if (annotation.type === 'point') {
			// Convert normalized coordinates to pixel coordinates
			const x = annotation.x * canvasSize.width;
			const y = annotation.y * canvasSize.height;

			return (
				<Group key={index}>
					{/* Outer glow effect */}
					<Circle
						x={x}
						y={y}
						radius={10}
						fill="rgba(244, 67, 54, 0.15)"
						stroke="rgba(244, 67, 54, 0.3)"
						strokeWidth={1}
					/>
					{/* Main badge circle */}
					<Circle
						x={x}
						y={y}
						radius={8}
						fill="#f44336"
						stroke="#ffffff"
						strokeWidth={2}
						shadowColor="rgba(0, 0, 0, 0.3)"
						shadowBlur={4}
						shadowOffset={{ x: 1, y: 1 }}
					/>
					{/* Inner highlight */}
					<Circle x={x} y={y} radius={4} fill="#ffffff" opacity={0.9} />
				</Group>
			);
		} else if (annotation.type === 'polygon' && annotation.points.length > 0) {
			// Convert normalized coordinates to pixel coordinates
			const points = annotation.points.flat().map((coord, coordIndex) => {
				if (coordIndex % 2 === 0) {
					// x coordinate
					return coord * canvasSize.width;
				} else {
					// y coordinate
					return coord * canvasSize.height;
				}
			});

			return (
				<Group key={index}>
					{/* Polygon fill */}
					<Line
						points={points}
						stroke="#f44336"
						strokeWidth={2}
						fill="rgba(244, 67, 54, 0.2)"
						closed
						opacity={0.8}
						shadowColor="rgba(0, 0, 0, 0.2)"
						shadowBlur={2}
					/>
					{/* Polygon vertices */}
					{annotation.points.map((point, pointIndex) => {
						const x = point[0] * canvasSize.width;
						const y = point[1] * canvasSize.height;

						return (
							<Circle
								key={pointIndex}
								x={x}
								y={y}
								radius={4}
								fill="#f44336"
								stroke="#ffffff"
								strokeWidth={1}
								opacity={0.9}
								shadowColor="rgba(0, 0, 0, 0.2)"
								shadowBlur={2}
							/>
						);
					})}
				</Group>
			);
		}
		return null;
	};

	// Render annotation using current canvas size
	const renderAnnotation = (annotation: AnnotationRegion, index: number) => {
		return renderAnnotationForCanvas(annotation, index, canvasSize);
	};

	// Fullscreen dialog content
	const renderFullscreenContent = () => (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
				<ImageIcon color="primary" />
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					{originalFileName}
				</Typography>
				<Chip
					label={`${annotations.length} annotations`}
					size="small"
					sx={{
						backgroundColor: '#e3f2fd',
						color: '#1976d2',
						fontSize: '0.7rem'
					}}
				/>
			</Box>

			<Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Box
					sx={{
						border: '1px solid #e0e0e0',
						borderRadius: 1,
						overflow: 'hidden',
						position: 'relative',
						background: '#fafafa',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
						height: '100%',
						maxWidth: '90vw',
						maxHeight: '80vh'
					}}
				>
					{!imageLoaded && !imageError && (
						<Box
							sx={{
								width: 400,
								height: 300,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: 'grey.100'
							}}
						>
							<Typography>Loading image...</Typography>
						</Box>
					)}
					{imageError && (
						<Box
							sx={{
								width: 400,
								height: 300,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: 'grey.100'
							}}
						>
							<Typography color="error">Failed to load image</Typography>
						</Box>
					)}
					{imageLoaded && (
						<Stage
							ref={stageRef}
							width={800}
							height={600}
							scaleX={scale}
							scaleY={scale}
							x={position.x}
							y={position.y}
							onMouseDown={handleStageMouseDown}
							onMouseMove={handleStageMouseMove}
							onMouseUp={handleStageMouseUp}
							draggable={!readOnly}
						>
							<Layer>
								<KonvaImage ref={imageRef} image={konvaImage || undefined} width={800} height={600} />
								{annotations.map((annotation, index) => {
									// For fullscreen, we need to use the fullscreen canvas size
									const fullscreenCanvasSize = { width: 800, height: 600 };
									return renderAnnotationForCanvas(annotation, index, fullscreenCanvasSize);
								})}
							</Layer>
						</Stage>
					)}
				</Box>
			</Box>

			<Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
				<IconButton onClick={() => handleZoom('out')} size="small">
					<ZoomOut />
				</IconButton>
				<Typography variant="body2" sx={{ alignSelf: 'center', mx: 1 }}>
					{Math.round(scale * 100)}%
				</Typography>
				<IconButton onClick={() => handleZoom('in')} size="small">
					<ZoomIn />
				</IconButton>
			</Box>
		</Box>
	);

	return (
		<Box>
			<Paper
				variant="outlined"
				sx={{
					p: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					position: 'relative'
				}}
			>
				{/* Image header */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
					<ImageIcon color="primary" fontSize="small" />
					<Typography variant="body2" sx={{ fontWeight: 500, color: '#333', flex: 1 }}>
						{originalFileName}
					</Typography>
					<Chip
						label={`${annotations.length} annotations`}
						size="small"
						sx={{
							backgroundColor: '#e3f2fd',
							color: '#1976d2',
							fontSize: '0.6rem',
							height: 16,
							'& .MuiChip-label': { px: 0.5 }
						}}
					/>
					<IconButton size="small" onClick={() => setShowFullscreen(true)} sx={{ ml: 0.5 }}>
						<Fullscreen fontSize="small" />
					</IconButton>
				</Box>

				{/* Image display */}
				<Box
					sx={{
						border: '1px solid #e0e0e0',
						borderRadius: 1,
						overflow: 'hidden',
						position: 'relative',
						background: '#fafafa',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						width: canvasSize.width,
						height: canvasSize.height
					}}
				>
					{!imageLoaded && !imageError && (
						<Box
							sx={{
								width: canvasSize.width,
								height: canvasSize.height,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: 'grey.100'
							}}
						>
							<Typography variant="caption">Loading...</Typography>
						</Box>
					)}
					{imageError && (
						<Box
							sx={{
								width: canvasSize.width,
								height: canvasSize.height,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: 'grey.100'
							}}
						>
							<Typography variant="caption" color="error">
								Failed to load
							</Typography>
						</Box>
					)}
					{imageLoaded && (
						<Stage
							ref={stageRef}
							width={canvasSize.width}
							height={canvasSize.height}
							scaleX={scale}
							scaleY={scale}
							x={position.x}
							y={position.y}
							onMouseDown={handleStageMouseDown}
							onMouseMove={handleStageMouseMove}
							onMouseUp={handleStageMouseUp}
							draggable={!readOnly}
						>
							<Layer>
								<KonvaImage
									ref={imageRef}
									image={konvaImage || undefined}
									width={canvasSize.width}
									height={canvasSize.height}
								/>
								{annotations.map((annotation, index) => renderAnnotation(annotation, index))}
							</Layer>
						</Stage>
					)}
				</Box>

				{/* Zoom controls */}
				<Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1 }}>
					<IconButton onClick={() => handleZoom('out')} size="small" sx={{ p: 0.5 }}>
						<ZoomOut fontSize="small" />
					</IconButton>
					<Typography variant="caption" sx={{ alignSelf: 'center', mx: 0.5 }}>
						{Math.round(scale * 100)}%
					</Typography>
					<IconButton onClick={() => handleZoom('in')} size="small" sx={{ p: 0.5 }}>
						<ZoomIn fontSize="small" />
					</IconButton>
				</Box>
			</Paper>

			{/* Fullscreen Dialog */}
			<Dialog open={showFullscreen} onClose={() => setShowFullscreen(false)} maxWidth="lg" fullWidth fullScreen>
				<DialogTitle>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<ImageIcon color="primary" />
						<Typography variant="h6" sx={{ fontWeight: 600 }}>
							{originalFileName}
						</Typography>
					</Box>
				</DialogTitle>
				<DialogContent sx={{ p: 0 }}>{renderFullscreenContent()}</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowFullscreen(false)}>Close</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ImageDisplay;
