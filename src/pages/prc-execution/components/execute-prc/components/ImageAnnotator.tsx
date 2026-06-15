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
	MenuItem,
	Grid
} from '@mui/material';
import {
	Add,
	Delete,
	ZoomIn,
	ZoomOut,
	PanTool,
	CheckCircle,
	Cancel,
	Fullscreen,
	Close
} from '@mui/icons-material';
import {
	type ImageAnnotation,
	type AnnotationRegion,
	type AnnotationPoint,
	type AnnotationPolygon,
	type AnnotationCircle
} from '../../../types/execution.types';
import { toFileRenderUrl } from '../../../../../utils/fileUrl';
import {
	DEFECT_CATEGORIES,
	getDefectStyle,
	countAnnotationsByCategory
} from './defectAnnotationStyles';
import { GATE_FIELD_LABEL, formatGateValueForDisplay } from '../../../../../utils/gateLabels';

export interface ImageAnnotatorParameterContext {
	parameterName: string;
	specification?: string;
	ctq?: boolean;
	minimumAcceptanceValue?: string | number;
	maximumAcceptanceValue?: string | number;
	parameterType?: string;
	/** e.g. "Row 3" for fixed-table image mapping */
	fixedTableRowLabel?: string;
}

interface ImageAnnotatorProps {
	images: Array<{
		fileName: string;
		filePath: string;
		originalFileName: string;
	}>;
	existingAnnotations?: ImageAnnotation[];
	onSave: (annotations: ImageAnnotation[]) => void;
	readOnly?: boolean;
	parameterContext?: ImageAnnotatorParameterContext;
}

type AnnotationMode = 'none' | 'pan' | 'point' | 'polygon' | 'circle';

const SCALE_MIN = 0.25;
const SCALE_MAX = 5;

function calculateCanvasSize(
	imgWidth: number,
	imgHeight: number,
	opts?: { maxWidth?: number; maxHeight?: number; minWidth?: number; minHeight?: number }
) {
	const maxWidth = opts?.maxWidth ?? 800;
	const maxHeight = opts?.maxHeight ?? 600;
	const minWidth = opts?.minWidth ?? 400;
	const minHeight = opts?.minHeight ?? 300;

	let canvasWidth = imgWidth;
	let canvasHeight = imgHeight;

	if (imgWidth > maxWidth || imgHeight > maxHeight) {
		const scaleX = maxWidth / imgWidth;
		const scaleY = maxHeight / imgHeight;
		const s = Math.min(scaleX, scaleY);
		canvasWidth = imgWidth * s;
		canvasHeight = imgHeight * s;
	}

	if (imgWidth < minWidth || imgHeight < minHeight) {
		const scaleX = minWidth / imgWidth;
		const scaleY = minHeight / imgHeight;
		const s = Math.min(scaleX, scaleY);
		canvasWidth = imgWidth * s;
		canvasHeight = imgHeight * s;
	}

	return { width: Math.round(canvasWidth), height: Math.round(canvasHeight) };
}

const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
	images,
	existingAnnotations = [],
	onSave,
	readOnly = false,
	parameterContext
}) => {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [annotations, setAnnotations] = useState<ImageAnnotation[]>(existingAnnotations);
	const [mode, setMode] = useState<AnnotationMode>('none');
	const [showFullscreen, setShowFullscreen] = useState(false);

	useEffect(() => {
		setAnnotations(existingAnnotations);
	}, [existingAnnotations]);

	const [isDrawing, setIsDrawing] = useState(false);
	const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
	const [circleDraftCenter, setCircleDraftCenter] = useState<[number, number] | null>(null);
	const [circleDraftRpx, setCircleDraftRpx] = useState(0);
	const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationRegion | null>(null);
	const [commentDialog, setCommentDialog] = useState(false);
	const [comment, setComment] = useState('');
	const [category, setCategory] = useState('');
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [_imageSize, setImageSize] = useState({ width: 0, height: 0 });
	const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

	const stageRef = useRef<Konva.Stage>(null);
	const imageRef = useRef<Konva.Image>(null);
	const spacePressedRef = useRef(false);

	const currentImage = images[currentImageIndex];
	const currentImageUrl = toFileRenderUrl(currentImage?.filePath);

	const getCurrentImageAnnotations = useCallback(() => {
		return annotations.find(ann => ann.imageFileName === currentImage?.fileName)?.regions || [];
	}, [annotations, currentImage]);

	const defectSummary = countAnnotationsByCategory(annotations);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.code === 'Space' && e.target === document.body) e.preventDefault();
			if (e.code === 'Space') spacePressedRef.current = true;
		};
		const up = (e: KeyboardEvent) => {
			if (e.code === 'Space') spacePressedRef.current = false;
		};
		window.addEventListener('keydown', down);
		window.addEventListener('keyup', up);
		return () => {
			window.removeEventListener('keydown', down);
			window.removeEventListener('keyup', up);
		};
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setCircleDraftCenter(null);
				setCircleDraftRpx(0);
				setIsDrawing(false);
				setCurrentPolygon([]);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	useEffect(() => {
		if (currentImageUrl) {
			setImageLoaded(false);
			setImageError(false);
			const img = new window.Image();
			img.onload = () => {
				setImageSize({ width: img.width, height: img.height });
				const expanded = showFullscreen;
				const optimalSize = calculateCanvasSize(img.width, img.height, {
					maxWidth: expanded ? 1200 : 800,
					maxHeight: expanded ? 900 : 600
				});
				setCanvasSize(optimalSize);
				setImageLoaded(true);
				setKonvaImage(img);
			};
			img.onerror = () => {
				setImageError(true);
				setImageLoaded(false);
				setKonvaImage(null);
			};
			img.src = currentImageUrl;
		}
	}, [currentImageUrl, showFullscreen]);

	const isPanSurface = useCallback(
		(target: Konva.Node, stage: Konva.Stage | null) => {
			if (!stage) return false;
			return target === stage || target === imageRef.current;
		},
		[]
	);

	const handleStageClick = useCallback(
		(_e: unknown) => {
			if (readOnly || mode === 'none' || mode === 'pan') return;

			const stage = stageRef.current;
			if (!stage) return;

			const point = stage.getPointerPosition();
			if (!point) return;
			const stageScale = stage.scaleX();

			const x = (point.x - stage.x()) / stageScale;
			const y = (point.y - stage.y()) / stageScale;

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
					setCurrentPolygon([[x, y]]);
					setIsDrawing(true);
				} else {
					const threshold = 15 / stageScale;
					const closeToFirst =
						currentPolygon.length >= 3 &&
						Math.hypot(x - currentPolygon[0][0], y - currentPolygon[0][1]) <= threshold;
					if (closeToFirst) {
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
						setCurrentPolygon(prev => [...prev, [x, y]]);
					}
				}
			} else if (mode === 'circle') {
				if (!circleDraftCenter) {
					setCircleDraftCenter([x, y]);
					setCircleDraftRpx(4);
				} else {
					const [cx, cy] = circleDraftCenter;
					const rPx = Math.hypot(x - cx, y - cy);
					const norm = Math.min(canvasSize.width, canvasSize.height);
					const rNorm = norm > 0 ? rPx / norm : 0;
					if (rNorm < 0.002) {
						setCircleDraftCenter(null);
						setCircleDraftRpx(0);
						return;
					}
					const newAnnotation: AnnotationCircle = {
						type: 'circle',
						id: `circle-${Date.now()}`,
						cx: cx / canvasSize.width,
						cy: cy / canvasSize.height,
						radius: rNorm,
						cls: 'defect',
						comment: '',
						category: ''
					};
					setSelectedAnnotation(newAnnotation);
					setCommentDialog(true);
					setCircleDraftCenter(null);
				}
			}
		},
		[mode, readOnly, canvasSize, isDrawing, currentPolygon, circleDraftCenter]
	);

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
			onSave(updatedAnnotations);
		},
		[currentImage, getCurrentImageAnnotations, annotations, currentImageUrl, onSave]
	);

	const handleSaveAll = useCallback(() => {
		onSave(annotations);
	}, [annotations, onSave]);

	useEffect(() => {
		setIsDrawing(false);
		setCurrentPolygon([]);
		setCircleDraftCenter(null);
		setCircleDraftRpx(0);
	}, [mode]);

	const handleZoomIn = useCallback(() => {
		const stage = stageRef.current;
		if (!stage) {
			setScale(prev => Math.min(prev * 1.2, SCALE_MAX));
			return;
		}
		const pointer = stage.getPointerPosition();
		if (!pointer) {
			setScale(prev => Math.min(prev * 1.2, SCALE_MAX));
			return;
		}
		const oldScale = stage.scaleX();
		const newScale = Math.min(oldScale * 1.2, SCALE_MAX);
		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale
		};
		setScale(newScale);
		setPosition({
			x: pointer.x - mousePointTo.x * newScale,
			y: pointer.y - mousePointTo.y * newScale
		});
	}, []);

	const handleZoomOut = useCallback(() => {
		const stage = stageRef.current;
		if (!stage) {
			setScale(prev => Math.max(prev / 1.2, SCALE_MIN));
			return;
		}
		const pointer = stage.getPointerPosition();
		if (!pointer) {
			setScale(prev => Math.max(prev / 1.2, SCALE_MIN));
			return;
		}
		const oldScale = stage.scaleX();
		const newScale = Math.max(oldScale / 1.2, SCALE_MIN);
		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale
		};
		setScale(newScale);
		setPosition({
			x: pointer.x - mousePointTo.x * newScale,
			y: pointer.y - mousePointTo.y * newScale
		});
	}, []);

	const handleResetZoom = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	const handleStageMouseDown = useCallback(
		(e: Konva.KonvaEventObject<MouseEvent>) => {
			const stage = stageRef.current;
			if (!stage) return;
			const ev = e.evt;
			const target = e.target as Konva.Node;

			const onCanvas = isPanSurface(target, stage);
			const drawMode = mode === 'point' || mode === 'polygon' || mode === 'circle';

			const shouldPan =
				onCanvas &&
				(mode === 'pan' ||
					mode === 'none' ||
					ev.button === 1 ||
					(spacePressedRef.current && ev.button === 0) ||
					(drawMode && (ev.button === 1 || (spacePressedRef.current && ev.button === 0))));

			if (!shouldPan) return;

			setIsDragging(true);
			setDragStart({ x: ev.clientX - position.x, y: ev.clientY - position.y });
		},
		[position, mode, isPanSurface]
	);

	const handleStageMouseMove = useCallback(
		(e: Konva.KonvaEventObject<MouseEvent>) => {
			if (isDragging) {
				const ev = e.evt;
				setPosition({
					x: ev.clientX - dragStart.x,
					y: ev.clientY - dragStart.y
				});
			}
			if (mode === 'circle' && circleDraftCenter) {
				const stage = stageRef.current;
				if (!stage) return;
				const pointer = stage.getPointerPosition();
				if (!pointer) return;
				const sc = stage.scaleX();
				const px = (pointer.x - stage.x()) / sc;
				const py = (pointer.y - stage.y()) / sc;
				const r = Math.max(4, Math.hypot(px - circleDraftCenter[0], py - circleDraftCenter[1]));
				setCircleDraftRpx(r);
			}
		},
		[isDragging, dragStart, mode, circleDraftCenter]
	);

	const handleStageMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
		e.evt.preventDefault();
		const stage = e.target.getStage();
		if (!stage) return;
		const pointer = stage.getPointerPosition();
		if (!pointer) return;

		const oldScale = stage.scaleX();
		const scaleBy = 1.08;
		const direction = e.evt.deltaY > 0 ? -1 : 1;
		const newScale =
			direction < 0
				? Math.max(oldScale / scaleBy, SCALE_MIN)
				: Math.min(oldScale * scaleBy, SCALE_MAX);

		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale
		};

		setScale(newScale);
		setPosition({
			x: pointer.x - mousePointTo.x * newScale,
			y: pointer.y - mousePointTo.y * newScale
		});
	}, []);

	const renderAnnotation = (annotation: AnnotationRegion, index: number) => {
		const style = getDefectStyle(annotation.category);

		if (annotation.type === 'point') {
			const x = annotation.x * canvasSize.width;
			const y = annotation.y * canvasSize.height;
			return (
				<Group key={annotation.id}>
					<Group>
						<Circle
							x={x}
							y={y}
							radius={10}
							fill={style.fillSoft}
							stroke={style.stroke}
							strokeWidth={1}
							opacity={0.9}
						/>
						<Circle
							x={x}
							y={y}
							radius={9}
							fill="white"
							stroke={style.stroke}
							strokeWidth={2}
							shadowColor="rgba(0,0,0,0.25)"
							shadowBlur={3}
							shadowOffset={{ x: 0, y: 1 }}
							shadowOpacity={0.4}
						/>
						<Circle x={x} y={y} radius={7} fill="rgba(255,255,255,0.8)" stroke="none" />
						<Text
							x={x + 12}
							y={y - 8}
							text={`${index + 1}`}
							fontSize={12}
							fontWeight="bold"
							fill={style.label}
							align="center"
							verticalAlign="middle"
							width={18}
							height={12}
							onClick={() => setSelectedAnnotation(annotation)}
						/>
					</Group>
				</Group>
			);
		}

		if (annotation.type === 'polygon') {
			const points = annotation.points.flatMap(([px, py]) => [px * canvasSize.width, py * canvasSize.height]);
			const centerX = points.reduce((sum, pt, i) => (i % 2 === 0 ? sum + pt : sum), 0) / (points.length / 2);
			const centerY = points.reduce((sum, pt, i) => (i % 2 === 1 ? sum + pt : sum), 0) / (points.length / 2);

			return (
				<Group key={annotation.id}>
					<Line
						points={points}
						closed
						stroke={style.stroke}
						strokeWidth={2}
						fill={style.fillSolid}
						onClick={() => setSelectedAnnotation(annotation)}
					/>
					<Group>
						<Circle
							x={centerX}
							y={centerY}
							radius={10}
							fill={style.fillSoft}
							stroke={style.stroke}
							strokeWidth={1}
						/>
						<Circle
							x={centerX}
							y={centerY}
							radius={9}
							fill="white"
							stroke={style.stroke}
							strokeWidth={2}
							shadowColor="rgba(0,0,0,0.25)"
							shadowBlur={3}
							shadowOffset={{ x: 0, y: 1 }}
							shadowOpacity={0.4}
						/>
						<Circle x={centerX} y={centerY} radius={7} fill="rgba(255,255,255,0.8)" stroke="none" />
						<Text
							x={centerX + 12}
							y={centerY - 8}
							text={`${index + 1}`}
							fontSize={12}
							fontWeight="bold"
							fill={style.label}
							align="center"
							verticalAlign="middle"
							width={18}
							height={12}
						/>
					</Group>
				</Group>
			);
		}

		if (annotation.type === 'circle') {
			const cx = annotation.cx * canvasSize.width;
			const cy = annotation.cy * canvasSize.height;
			const r = annotation.radius * Math.min(canvasSize.width, canvasSize.height);

			return (
				<Group key={annotation.id}>
					<Circle
						x={cx}
						y={cy}
						radius={r}
						stroke={style.stroke}
						strokeWidth={2}
						fill={style.fillSolid}
						onClick={() => setSelectedAnnotation(annotation)}
					/>
					<Text
						x={cx + Math.min(r * 0.35, 28)}
						y={cy - 10}
						text={`${index + 1}`}
						fontSize={12}
						fontWeight="bold"
						fill={style.label}
					/>
				</Group>
			);
		}

		return null;
	};

	const renderCurrentPolygon = () => {
		if (!isDrawing || currentPolygon.length === 0) return null;
		const points = currentPolygon.flat();
		return (
			<Group>
				<Line points={points} stroke="#4caf50" strokeWidth={2} dash={[5, 5]} />
				{currentPolygon.map(([x, y], i) => (
					<Circle key={i} x={x} y={y} radius={4} fill="#4caf50" stroke="white" strokeWidth={1} />
				))}
			</Group>
		);
	};

	const renderCircleDraft = () => {
		if (mode !== 'circle' || !circleDraftCenter) return null;
		const [cx, cy] = circleDraftCenter;
		const r = circleDraftRpx;
		return (
			<Group>
				<Circle x={cx} y={cy} radius={r} stroke="#4caf50" strokeWidth={2} dash={[6, 4]} fill="rgba(76,175,80,0.08)" />
				<Circle x={cx} y={cy} radius={5} fill="#4caf50" stroke="white" strokeWidth={1} />
			</Group>
		);
	};

	const renderParameterHeader = (variant: 'dialog' | 'inline') => (
		<Box sx={{ mb: variant === 'dialog' ? 0 : 1 }}>
			{parameterContext && (
				<Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
					<Grid container spacing={1}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<Typography variant="caption" color="text.secondary">
								Parameter
							</Typography>
							<Typography variant="body2" fontWeight={600}>
								{parameterContext.parameterName}
								{parameterContext.fixedTableRowLabel ? ` · ${parameterContext.fixedTableRowLabel}` : ''}
							</Typography>
						</Grid>
						{parameterContext.parameterType && (
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" color="text.secondary">
									Type
								</Typography>
								<Typography variant="body2">{parameterContext.parameterType}</Typography>
							</Grid>
						)}
						{parameterContext.ctq !== undefined && (
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" color="text.secondary">
									{GATE_FIELD_LABEL}
								</Typography>
								<Typography variant="body2">
									{formatGateValueForDisplay(!!parameterContext.ctq)}
								</Typography>
							</Grid>
						)}
						{parameterContext.specification ? (
							<Grid size={{ xs: 12 }}>
								<Typography variant="caption" color="text.secondary">
									Specification
								</Typography>
								<Typography variant="body2">{parameterContext.specification}</Typography>
							</Grid>
						) : null}
						{(parameterContext.minimumAcceptanceValue !== undefined ||
							parameterContext.maximumAcceptanceValue !== undefined) ? (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Typography variant="caption" color="text.secondary">
									Range (Min-Max)
								</Typography>
								<Typography variant="body2">
									{parameterContext.minimumAcceptanceValue ?? '-'} to{' '}
									{parameterContext.maximumAcceptanceValue ?? '-'}
								</Typography>
							</Grid>
						) : null}
					</Grid>
				</Paper>
			)}
		</Box>
	);

	const renderModeButtons = () =>
		!readOnly ? (
			<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
				<Button
					variant={mode === 'pan' ? 'contained' : 'outlined'}
					size="small"
					startIcon={<PanTool />}
					onClick={() => setMode(mode === 'pan' ? 'none' : 'pan')}
				>
					Pan
				</Button>
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
					variant={mode === 'circle' ? 'contained' : 'outlined'}
					size="small"
					startIcon={<Add />}
					onClick={() => setMode(mode === 'circle' ? 'none' : 'circle')}
				>
					Circle
				</Button>
				<Button variant="contained" size="small" startIcon={<CheckCircle />} onClick={handleSaveAll} color="primary">
					Save
				</Button>
			</Box>
		) : null;

	const renderZoomControls = () => (
		<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
			<IconButton size="small" onClick={handleZoomOut} disabled={scale <= SCALE_MIN}>
				<ZoomOut />
			</IconButton>
			<Typography variant="body2" sx={{ minWidth: 56, textAlign: 'center' }}>
				{Math.round(scale * 100)}%
			</Typography>
			<IconButton size="small" onClick={handleZoomIn} disabled={scale >= SCALE_MAX}>
				<ZoomIn />
			</IconButton>
			<IconButton size="small" onClick={handleResetZoom} title="Reset zoom & pan">
				<PanTool />
			</IconButton>
		</Box>
	);

	const renderCanvasBlock = () => (
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
						{renderCircleDraft()}
					</Layer>
				</Stage>
			)}
		</Box>
	);

	const renderDefectSummary = () =>
		Object.keys(defectSummary).length > 0 ? (
			<Paper sx={{ p: 1.5, mb: 2 }} variant="outlined">
				<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
					Counts by defect type
				</Typography>
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
					{Object.entries(defectSummary)
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([cat, n]) => {
							const st = getDefectStyle(cat);
							return (
								<Chip
									key={cat}
									label={`${cat}: ${n}`}
									size="small"
									sx={{
										borderColor: st.stroke,
										color: st.label,
										backgroundColor: st.fillSoft,
										fontWeight: 500
									}}
									variant="outlined"
								/>
							);
						})}
				</Box>
			</Paper>
		) : null;

	const renderAnnotationList = () =>
		getCurrentImageAnnotations().length > 0 ? (
			<Paper sx={{ p: 2 }}>
				<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
					Annotations ({getCurrentImageAnnotations().length})
				</Typography>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					{getCurrentImageAnnotations().map((annotation, index) => {
						const st = getDefectStyle(annotation.category);
						const shapeLabel =
							annotation.type === 'point' ? 'Point' : annotation.type === 'polygon' ? 'Polygon' : 'Circle';
						return (
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
											borderRadius: annotation.type === 'polygon' ? '4px' : '50%',
											bgcolor: st.fillSolid,
											border: `2px solid ${st.stroke}`,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: st.label,
											fontSize: '12px',
											fontWeight: 'bold'
										}}
									>
										{index + 1}
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{shapeLabel} • {annotation.cls}
										</Typography>
										{annotation.category && (
											<Chip
												label={annotation.category}
												size="small"
												sx={{
													backgroundColor: st.fillSoft,
													color: st.label,
													border: `1px solid ${st.stroke}`,
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
												&ldquo;{annotation.comment}&rdquo;
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
						);
					})}
				</Box>
			</Paper>
		) : null;

	const hint =
		mode === 'circle'
			? circleDraftCenter
				? 'Click to set outer radius (Esc to cancel)'
				: 'Click center, then rim'
			: mode === 'polygon'
				? 'Click vertices; click near first point or double-click to close'
				: mode === 'point'
					? 'Click to place point'
					: mode === 'pan'
						? 'Drag to pan (or hold Space while dragging)'
						: 'Drag on image to pan, or choose Pan / hold Space';

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
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
				<Typography variant="h6">
					Image Annotation ({currentImageIndex + 1} of {images.length})
				</Typography>
				<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
					{renderModeButtons()}
					<IconButton size="small" onClick={() => setShowFullscreen(true)} title="Fullscreen">
						<Fullscreen />
					</IconButton>
				</Box>
			</Box>

			{renderParameterHeader('inline')}

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

			<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
				{hint}
			</Typography>

			<Paper sx={{ p: 2, mb: 2 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
					<Typography variant="subtitle1">Annotation Canvas</Typography>
					{renderZoomControls()}
				</Box>
				{renderCanvasBlock()}
			</Paper>

			{renderDefectSummary()}
			{renderAnnotationList()}

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

			<Dialog open={showFullscreen} onClose={() => setShowFullscreen(false)} fullScreen>
				<DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
					<Box sx={{ flex: 1 }}>
						<Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
							Image mapping — {currentImage.originalFileName}
						</Typography>
						{renderParameterHeader('dialog')}
					</Box>
					<IconButton aria-label="close" onClick={() => setShowFullscreen(false)} size="small">
						<Close />
					</IconButton>
				</DialogTitle>
				<DialogContent sx={{ pt: 0 }}>
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
					<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
						{hint}
					</Typography>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
						{renderModeButtons()}
						{renderZoomControls()}
					</Box>
					{renderCanvasBlock()}
					<Box sx={{ mt: 2 }}>{renderDefectSummary()}</Box>
					<Box sx={{ mt: 2 }}>{renderAnnotationList()}</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowFullscreen(false)}>Close</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ImageAnnotator;
