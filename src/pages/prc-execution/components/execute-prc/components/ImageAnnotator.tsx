import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Text, Group } from 'react-konva';
import type Konva from 'konva';
import {
	Box,
	Button,
	TextField,
	Typography,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Chip,
	Paper,
	FormControl,
	InputLabel,
	Select,
	MenuItem
} from '@mui/material';
import { Add, Delete, ZoomIn, ZoomOut, PanTool, CheckCircle, Cancel } from '@mui/icons-material';
import {
	type ImageAnnotation,
	type AnnotationRegion,
	type AnnotationPoint,
	type AnnotationPolygon
} from '../../../types/execution.types';

interface ImageAnnotatorProps {
	images: Array<{
		fileName: string;
		filePath: string;
		originalFileName: string;
	}>;
	existingAnnotations?: ImageAnnotation[];
	onSave: (annotations: ImageAnnotation[]) => void;
	readOnly?: boolean;
}

type AnnotationMode = 'none' | 'point' | 'polygon';

// Defect categories for annotations
const DEFECT_CATEGORIES = [
	'Surface Defect',
	'Dimensional Defect',
	'Material Defect',
	'Assembly Defect',
	'Functional Defect',
	'Cosmetic Defect',
	'Structural Defect',
	'Other'
];

const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
	images,
	existingAnnotations = [],
	onSave,
	readOnly = false
}) => {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [annotations, setAnnotations] = useState<ImageAnnotation[]>(existingAnnotations);
	const [mode, setMode] = useState<AnnotationMode>('none');

	// Update annotations when existingAnnotations prop changes
	useEffect(() => {
		console.log('ImageAnnotator: Updating annotations from existingAnnotations prop:', existingAnnotations);
		setAnnotations(existingAnnotations);
	}, [existingAnnotations]);
	const [isDrawing, setIsDrawing] = useState(false);
	const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
	const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationRegion | null>(null);
	const [commentDialog, setCommentDialog] = useState(false);
	const [comment, setComment] = useState('');
	const [category, setCategory] = useState('');
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [_imageSize, setImageSize] = useState({ width: 0, height: 0 }); // Keep for future use
	const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

	const stageRef = useRef<Konva.Stage>(null);
	const imageRef = useRef<Konva.Image>(null);

	const currentImage = images[currentImageIndex];
	const currentImageUrl = currentImage?.filePath ? `${process.env.API_BASE_URL_PRE_AUTH}${currentImage.filePath}` : '';

	// Get annotations for current image
	const getCurrentImageAnnotations = useCallback(() => {
		return annotations.find(ann => ann.imageFileName === currentImage?.fileName)?.regions || [];
	}, [annotations, currentImage]);

	// Calculate optimal canvas size based on image dimensions
	const calculateCanvasSize = useCallback((imgWidth: number, imgHeight: number) => {
		const maxWidth = 800;
		const maxHeight = 600;
		const minWidth = 400;
		const minHeight = 300;

		let canvasWidth = imgWidth;
		let canvasHeight = imgHeight;

		// Scale down if image is too large
		if (imgWidth > maxWidth || imgHeight > maxHeight) {
			const scaleX = maxWidth / imgWidth;
			const scaleY = maxHeight / imgHeight;
			const scale = Math.min(scaleX, scaleY);
			canvasWidth = imgWidth * scale;
			canvasHeight = imgHeight * scale;
		}

		// Scale up if image is too small
		if (imgWidth < minWidth || imgHeight < minHeight) {
			const scaleX = minWidth / imgWidth;
			const scaleY = minHeight / imgHeight;
			const scale = Math.min(scaleX, scaleY);
			canvasWidth = imgWidth * scale;
			canvasHeight = imgHeight * scale;
		}

		return { width: Math.round(canvasWidth), height: Math.round(canvasHeight) };
	}, []);

	// Load image
	useEffect(() => {
		if (currentImageUrl) {
			console.log('Loading image from URL:', currentImageUrl);
			const img = new window.Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				console.log('Image loaded successfully:', img.width, 'x', img.height);
				setImageSize({ width: img.width, height: img.height });
				const optimalSize = calculateCanvasSize(img.width, img.height);
				setCanvasSize(optimalSize);
				setImageLoaded(true);
				setKonvaImage(img);
			};
			img.onerror = error => {
				console.error('Failed to load image:', error);
				setImageError(true);
				setImageLoaded(false);
				setKonvaImage(null);
			};
			img.src = currentImageUrl;
		}
	}, [currentImageUrl, calculateCanvasSize]);

	// Check if point is close to existing point (for smart polygon closing)
	const isPointClose = useCallback((newPoint: [number, number], existingPoints: [number, number][], threshold = 15) => {
		return existingPoints.some(point => {
			const distance = Math.sqrt(Math.pow(newPoint[0] - point[0], 2) + Math.pow(newPoint[1] - point[1], 2));
			return distance <= threshold;
		});
	}, []);

	// Handle stage click
	const handleStageClick = useCallback(
		(_e: unknown) => {
			if (readOnly || mode === 'none') return;

			const stage = stageRef.current;
			if (!stage) return;

			const point = stage.getPointerPosition();
			if (!point) return;
			const scale = stage.scaleX();

			const x = (point.x - stage.x()) / scale;
			const y = (point.y - stage.y()) / scale;

			if (mode === 'point') {
				const newAnnotation: AnnotationPoint = {
					type: 'point',
					id: `point-${Date.now()}`,
					x: x / canvasSize.width,
					y: y / canvasSize.height,
					cls: 'defect',
					comment: '',
					category: ''
				};
				setSelectedAnnotation(newAnnotation);
				setCommentDialog(true);
			} else if (mode === 'polygon') {
				if (!isDrawing) {
					// Start new polygon
					setCurrentPolygon([[x, y]]);
					setIsDrawing(true);
				} else {
					// Check if clicking close to the first point (smart closing)
					if (currentPolygon.length >= 3 && isPointClose([x, y], [currentPolygon[0]])) {
						// Close the polygon by connecting to the first point
						const newAnnotation: AnnotationPolygon = {
							type: 'polygon',
							id: `polygon-${Date.now()}`,
							points: currentPolygon.map(
								([px, py]) => [px / canvasSize.width, py / canvasSize.height] as [number, number]
							),
							cls: 'inspection-area',
							comment: '',
							category: ''
						};
						setSelectedAnnotation(newAnnotation);
						setCommentDialog(true);
						setIsDrawing(false);
						setCurrentPolygon([]);
					} else {
						// Add point to current polygon
						setCurrentPolygon(prev => [...prev, [x, y]]);
					}
				}
			}
		},
		[mode, readOnly, canvasSize, isDrawing, currentPolygon, isPointClose]
	);

	// Handle stage double click (finish polygon)
	const handleStageDoubleClick = useCallback(
		(_e: unknown) => {
			if (readOnly || mode !== 'polygon' || !isDrawing || currentPolygon.length < 3) return;

			const newAnnotation: AnnotationPolygon = {
				type: 'polygon',
				id: `polygon-${Date.now()}`,
				points: currentPolygon.map(([x, y]) => [x / canvasSize.width, y / canvasSize.height] as [number, number]),
				cls: 'inspection-area',
				comment: '',
				category: ''
			};
			setSelectedAnnotation(newAnnotation);
			setCommentDialog(true);
			setIsDrawing(false);
			setCurrentPolygon([]);
		},
		[readOnly, mode, isDrawing, currentPolygon, canvasSize]
	);

	// Save annotation with comment and category
	const handleSaveAnnotation = useCallback(() => {
		if (!selectedAnnotation || !currentImage) return;

		const updatedAnnotation = { ...selectedAnnotation, comment, category };
		const currentImageAnnotations = getCurrentImageAnnotations();
		const updatedRegions = [...currentImageAnnotations, updatedAnnotation];

		const updatedAnnotations = annotations.filter(ann => ann.imageFileName !== currentImage.fileName);
		updatedAnnotations.push({
			imageFileName: currentImage.fileName,
			imageUrl: currentImageUrl,
			regions: updatedRegions
		});

		setAnnotations(updatedAnnotations);
		setCommentDialog(false);
		setComment('');
		setCategory('');
		setSelectedAnnotation(null);

		// Auto-save annotations when a new annotation is created
		console.log('ImageAnnotator: Auto-saving annotations after creating new annotation:', updatedAnnotations);
		onSave(updatedAnnotations);
	}, [
		selectedAnnotation,
		comment,
		category,
		currentImage,
		currentImageUrl,
		getCurrentImageAnnotations,
		annotations,
		onSave
	]);

	// Delete annotation
	const handleDeleteAnnotation = useCallback(
		(annotationId: string) => {
			if (!currentImage) return;

			const currentImageAnnotations = getCurrentImageAnnotations();
			const updatedRegions = currentImageAnnotations.filter(ann => ann.id !== annotationId);

			const updatedAnnotations = annotations.filter(ann => ann.imageFileName !== currentImage.fileName);
			if (updatedRegions.length > 0) {
				updatedAnnotations.push({
					imageFileName: currentImage.fileName,
					imageUrl: currentImageUrl,
					regions: updatedRegions
				});
			}

			setAnnotations(updatedAnnotations);

			// Auto-save annotations when an annotation is deleted
			console.log('ImageAnnotator: Auto-saving annotations after deleting annotation:', updatedAnnotations);
			onSave(updatedAnnotations);
		},
		[currentImage, getCurrentImageAnnotations, annotations, currentImageUrl, onSave]
	);

	// Save all annotations
	const handleSaveAll = useCallback(() => {
		console.log('ImageAnnotator: Saving annotations:', annotations);
		onSave(annotations);
	}, [annotations, onSave]);

	// Reset drawing state when mode changes
	useEffect(() => {
		setIsDrawing(false);

		setCurrentPolygon([]);
	}, [mode]);

	// Zoom and pan handlers
	const handleZoomIn = useCallback(() => {
		setScale(prev => Math.min(prev * 1.2, 3));
	}, []);

	const handleZoomOut = useCallback(() => {
		setScale(prev => Math.max(prev / 1.2, 0.5));
	}, []);

	const handleResetZoom = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	const handleStageMouseDown = useCallback(
		(e: unknown) => {
			const event = e as { target: { getStage: () => unknown }; evt: { clientX: number; clientY: number } };
			if (event.target === event.target.getStage()) {
				setIsDragging(true);
				setDragStart({ x: event.evt.clientX - position.x, y: event.evt.clientY - position.y });
			}
		},
		[position]
	);

	const handleStageMouseMove = useCallback(
		(e: unknown) => {
			if (isDragging) {
				const event = e as { evt: { clientX: number; clientY: number } };
				const newPos = {
					x: event.evt.clientX - dragStart.x,
					y: event.evt.clientY - dragStart.y
				};
				setPosition(newPos);
			}
		},
		[isDragging, dragStart]
	);

	const handleStageMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	const handleWheel = useCallback((e: unknown) => {
		const event = e as {
			evt: { preventDefault: () => void; deltaY: number };
			target: { getStage: () => { scaleX: () => number } };
		};
		event.evt.preventDefault();
		const scaleBy = 1.1;
		const stage = event.target.getStage();
		const oldScale = stage.scaleX();
		// const pointer = stage.getPointerPosition();

		// const mousePointTo = {
		// 	x: (pointer.x - stage.x()) / oldScale,
		// 	y: (pointer.y - stage.y()) / oldScale,
		// };

		const newScale = event.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
		setScale(Math.max(0.5, Math.min(3, newScale)));
	}, []);

	// Render annotation
	const renderAnnotation = (annotation: AnnotationRegion, index: number) => {
		if (annotation.type === 'point') {
			const x = annotation.x * canvasSize.width;
			const y = annotation.y * canvasSize.height;
			return (
				<Group key={annotation.id}>
					{/* Professional annotation marker */}
					<Group>
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
							radius={9}
							fill="white"
							stroke="#f44336"
							strokeWidth={2}
							shadowColor="rgba(0,0,0,0.25)"
							shadowBlur={3}
							shadowOffset={{ x: 0, y: 1 }}
							shadowOpacity={0.4}
						/>
						{/* Inner highlight */}
						<Circle x={x} y={y} radius={7} fill="rgba(255,255,255,0.8)" stroke="none" />
						{/* Number text positioned slightly away from center */}
						<Text
							x={x + 12}
							y={y - 8}
							text={`${index + 1}`}
							fontSize={12}
							fontWeight="bold"
							fill="#f44336"
							align="center"
							verticalAlign="middle"
							width={18}
							height={12}
							onClick={() => setSelectedAnnotation(annotation)}
						/>
					</Group>
				</Group>
			);
		} else if (annotation.type === 'polygon') {
			const points = annotation.points.flatMap(([x, y]) => [x * canvasSize.width, y * canvasSize.height]);
			// Calculate center of polygon for number placement
			const centerX = points.reduce((sum, point, i) => (i % 2 === 0 ? sum + point : sum), 0) / (points.length / 2);
			const centerY = points.reduce((sum, point, i) => (i % 2 === 1 ? sum + point : sum), 0) / (points.length / 2);

			return (
				<Group key={annotation.id}>
					<Line
						points={points}
						closed
						stroke="#1976d2"
						strokeWidth={2}
						fill="rgba(25, 118, 210, 0.1)"
						onClick={() => setSelectedAnnotation(annotation)}
					/>
					{/* Professional annotation marker */}
					<Group>
						{/* Outer glow effect */}
						<Circle
							x={centerX}
							y={centerY}
							radius={10}
							fill="rgba(25, 118, 210, 0.15)"
							stroke="rgba(25, 118, 210, 0.3)"
							strokeWidth={1}
						/>
						{/* Main badge circle */}
						<Circle
							x={centerX}
							y={centerY}
							radius={9}
							fill="white"
							stroke="#1976d2"
							strokeWidth={2}
							shadowColor="rgba(0,0,0,0.25)"
							shadowBlur={3}
							shadowOffset={{ x: 0, y: 1 }}
							shadowOpacity={0.4}
						/>
						{/* Inner highlight */}
						<Circle x={centerX} y={centerY} radius={7} fill="rgba(255,255,255,0.8)" stroke="none" />
						{/* Number text positioned slightly away from center */}
						<Text
							x={centerX + 12}
							y={centerY - 8}
							text={`${index + 1}`}
							fontSize={12}
							fontWeight="bold"
							fill="#1976d2"
							align="center"
							verticalAlign="middle"
							width={18}
							height={12}
						/>
					</Group>
				</Group>
			);
		}
		return null;
	};

	// Render current polygon being drawn
	const renderCurrentPolygon = () => {
		if (!isDrawing || currentPolygon.length === 0) return null;

		const points = currentPolygon.flat();
		return (
			<Group>
				<Line points={points} stroke="#4caf50" strokeWidth={2} dash={[5, 5]} />
				{currentPolygon.map(([x, y], index) => (
					<Circle key={index} x={x} y={y} radius={4} fill="#4caf50" stroke="white" strokeWidth={1} />
				))}
			</Group>
		);
	};

	if (!currentImage) {
		return (
			<Box sx={{ p: 2, textAlign: 'center' }}>
				<Typography variant="body1" color="text.secondary">
					No images available for annotation
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 2 }}>
			{/* Header */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
				<Typography variant="h6">
					Image Annotation ({currentImageIndex + 1} of {images.length})
				</Typography>
				<Box sx={{ display: 'flex', gap: 1 }}>
					{!readOnly && (
						<>
							<Button
								variant={mode === 'point' ? 'contained' : 'outlined'}
								size="small"
								startIcon={<Add />}
								onClick={() => setMode(mode === 'point' ? 'none' : 'point')}
							>
								Point
							</Button>
							<Button
								variant={mode === 'polygon' ? 'contained' : 'outlined'}
								size="small"
								startIcon={<Add />}
								onClick={() => setMode(mode === 'polygon' ? 'none' : 'polygon')}
							>
								Polygon
							</Button>
							<Button
								variant="contained"
								size="small"
								startIcon={<CheckCircle />}
								onClick={handleSaveAll}
								color="primary"
							>
								Save Annotations
							</Button>
						</>
					)}
				</Box>
			</Box>

			{/* Image Navigation */}
			{images.length > 1 && (
				<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
					{images.map((_image, index) => (
						<Chip
							key={index}
							label={`Image ${index + 1}`}
							variant={index === currentImageIndex ? 'filled' : 'outlined'}
							onClick={() => setCurrentImageIndex(index)}
							clickable
						/>
					))}
				</Box>
			)}

			{/* Canvas Area */}
			<Paper sx={{ p: 2, mb: 2 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
					<Typography variant="subtitle1">Annotation Canvas</Typography>
					{/* Zoom Controls */}
					<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
						<IconButton size="small" onClick={handleZoomOut} disabled={scale <= 0.5}>
							<ZoomOut />
						</IconButton>
						<Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
							{Math.round(scale * 100)}%
						</Typography>
						<IconButton size="small" onClick={handleZoomIn} disabled={scale >= 3}>
							<ZoomIn />
						</IconButton>
						<IconButton size="small" onClick={handleResetZoom}>
							<PanTool />
						</IconButton>
					</Box>
				</Box>

				<Box
					sx={{
						border: '1px solid #e0e0e0',
						borderRadius: 1,
						overflow: 'hidden',
						position: 'relative',
						background: '#fafafa',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center'
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
							<Typography>Loading image...</Typography>
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
							<Typography color="error">Failed to load image</Typography>
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
							onClick={handleStageClick}
							onDblClick={handleStageDoubleClick}
							onMouseDown={handleStageMouseDown}
							onMouseMove={handleStageMouseMove}
							onMouseUp={handleStageMouseUp}
							onWheel={handleWheel}
							draggable={false}
						>
							<Layer>
								<KonvaImage
									ref={imageRef}
									image={konvaImage || undefined}
									width={canvasSize.width}
									height={canvasSize.height}
								/>
								{getCurrentImageAnnotations().map((annotation, index) => renderAnnotation(annotation, index))}
								{renderCurrentPolygon()}
							</Layer>
						</Stage>
					)}
				</Box>
			</Paper>

			{/* Annotations List - Compact Design */}
			{getCurrentImageAnnotations().length > 0 && (
				<Paper sx={{ p: 2 }}>
					<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
						Annotations ({getCurrentImageAnnotations().length})
					</Typography>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{getCurrentImageAnnotations().map((annotation, index) => (
							<Box
								key={annotation.id}
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									p: 1.5,
									border: '1px solid #e0e0e0',
									borderRadius: 1,
									bgcolor: 'white',
									'&:hover': { bgcolor: '#f5f5f5' }
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
									<Box
										sx={{
											width: 24,
											height: 24,
											borderRadius: '50%',
											bgcolor: annotation.type === 'point' ? '#f44336' : '#1976d2',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
											fontSize: '12px',
											fontWeight: 'bold'
										}}
									>
										{index + 1}
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{annotation.type === 'point' ? 'Point' : 'Polygon'} • {annotation.cls}
										</Typography>
										{annotation.category && (
											<Chip
												label={annotation.category}
												size="small"
												sx={{
													backgroundColor: '#e3f2fd',
													color: '#1976d2',
													fontSize: '0.625rem',
													height: '20px',
													mt: 0.5,
													mr: 1
												}}
											/>
										)}
										{annotation.comment && (
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}
											>
												"{annotation.comment}"
											</Typography>
										)}
									</Box>
								</Box>
								{!readOnly && (
									<IconButton
										size="small"
										onClick={() => handleDeleteAnnotation(annotation.id)}
										sx={{ color: 'error.main' }}
									>
										<Delete fontSize="small" />
									</IconButton>
								)}
							</Box>
						))}
					</Box>
				</Paper>
			)}

			{/* Comment Dialog */}
			<Dialog open={commentDialog} onClose={() => setCommentDialog(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Add Details to Annotation</DialogTitle>
				<DialogContent>
					<FormControl fullWidth margin="dense" required>
						<InputLabel>Defect Category</InputLabel>
						<Select
							value={category}
							onChange={e => setCategory(e.target.value)}
							label="Defect Category"
							variant="outlined"
						>
							{DEFECT_CATEGORIES.map(cat => (
								<MenuItem key={cat} value={cat}>
									{cat}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<TextField
						margin="dense"
						label="Description"
						fullWidth
						multiline
						rows={3}
						value={comment}
						onChange={e => setComment(e.target.value)}
						placeholder="Add a description..."
						variant="outlined"
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCommentDialog(false)} startIcon={<Cancel />}>
						Cancel
					</Button>
					<Button
						onClick={handleSaveAnnotation}
						variant="contained"
						startIcon={<CheckCircle />}
						disabled={!category.trim()}
					>
						Save Annotation
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ImageAnnotator;
