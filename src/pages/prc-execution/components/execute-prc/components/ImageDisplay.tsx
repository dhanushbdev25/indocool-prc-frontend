import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Group, Text } from 'react-konva';
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
import { ZoomIn, ZoomOut, Fullscreen, Image as ImageIcon, PanTool } from '@mui/icons-material';
import { type AnnotationRegion } from '../../../types/execution.types';
import { getDefectStyle } from './defectAnnotationStyles';

interface ImageDisplayProps {
	imageUrl: string;
	imageFileName: string;
	originalFileName: string;
	annotations: AnnotationRegion[];
	readOnly?: boolean;
	showAnnotations?: boolean;
}

const SCALE_MIN = 0.25;
const SCALE_MAX = 5;

const ImageDisplay: React.FC<ImageDisplayProps> = ({
	imageUrl,
	imageFileName: _imageFileName,
	originalFileName,
	annotations,
	readOnly: _readOnly = true,
	showAnnotations = true
}) => {
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 });
	const [fullscreenCanvasSize, setFullscreenCanvasSize] = useState({ width: 800, height: 600 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [showFullscreen, setShowFullscreen] = useState(false);

	const stageInlineRef = useRef<Konva.Stage>(null);
	const stageFullRef = useRef<Konva.Stage>(null);
	const imageInlineRef = useRef<Konva.Image>(null);
	const imageFullRef = useRef<Konva.Image>(null);

	useEffect(() => {
		if (!imageUrl) {
			const timeoutId = setTimeout(() => {
				setImageError(true);
				setImageLoaded(false);
				setKonvaImage(null);
			}, 0);
			return () => clearTimeout(timeoutId);
		}

		const resetTimeoutId = setTimeout(() => {
			setImageLoaded(false);
			setImageError(false);
			setKonvaImage(null);
		}, 0);

		const img = new Image();
		let isMounted = true;

		img.onload = () => {
			if (!isMounted) return;
			setKonvaImage(img);
			setImageLoaded(true);
			setImageError(false);

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

			const fsMaxW = typeof window !== 'undefined' ? Math.min(1200, window.innerWidth - 48) : 1200;
			const fsMaxH = typeof window !== 'undefined' ? Math.min(900, window.innerHeight - 200) : 900;
			let fw = fsMaxW;
			let fh = fw / aspectRatio;
			if (fh > fsMaxH) {
				fh = fsMaxH;
				fw = fh * aspectRatio;
			}
			setFullscreenCanvasSize({ width: Math.round(fw), height: Math.round(fh) });
		};

		img.onerror = () => {
			if (!isMounted) return;
			setImageError(true);
			setImageLoaded(false);
		};

		img.src = imageUrl;

		return () => {
			clearTimeout(resetTimeoutId);
			isMounted = false;
		};
	}, [imageUrl]);

	const isPanSurface = useCallback((target: Konva.Node, stage: Konva.Stage | null, imageRef: React.RefObject<Konva.Image | null>) => {
		if (!stage) return false;
		return target === stage || target === imageRef.current;
	}, []);

	const handleZoomIn = useCallback(() => {
		const stage = showFullscreen ? stageFullRef.current : stageInlineRef.current;
		if (!stage || !imageLoaded) {
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
	}, [imageLoaded, showFullscreen]);

	const handleZoomOut = useCallback(() => {
		const stage = showFullscreen ? stageFullRef.current : stageInlineRef.current;
		if (!stage || !imageLoaded) {
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
	}, [imageLoaded, showFullscreen]);

	const handleResetView = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	const handleStageMouseDown = (
		e: Konva.KonvaEventObject<MouseEvent>,
		stage: Konva.Stage | null,
		imageRef: React.RefObject<Konva.Image | null>
	) => {
		if (!stage) return;
		if (!isPanSurface(e.target as Konva.Node, stage, imageRef)) return;
		setIsDragging(true);
		setDragStart({ x: e.evt.clientX - position.x, y: e.evt.clientY - position.y });
	};

	const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
		if (!isDragging) return;
		setPosition({
			x: e.evt.clientX - dragStart.x,
			y: e.evt.clientY - dragStart.y
		});
	};

	const handleStageMouseUp = () => {
		setIsDragging(false);
	};

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
			direction < 0 ? Math.max(oldScale / scaleBy, SCALE_MIN) : Math.min(oldScale * scaleBy, SCALE_MAX);
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

	const renderAnnotationForCanvas = (
		annotation: AnnotationRegion,
		index: number,
		canvas: { width: number; height: number }
	) => {
		if (!showAnnotations) return null;
		const style = getDefectStyle(annotation.category);

		if (annotation.type === 'point') {
			const x = annotation.x * canvas.width;
			const y = annotation.y * canvas.height;
			return (
				<Group key={`${annotation.id}-${index}`}>
					<Group>
						<Circle x={x} y={y} radius={10} fill={style.fillSoft} stroke={style.stroke} strokeWidth={1} />
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
						/>
					</Group>
				</Group>
			);
		}

		if (annotation.type === 'polygon' && annotation.points.length > 0) {
			const points = annotation.points.flatMap(([px, py]) => [px * canvas.width, py * canvas.height]);
			const centerX = points.reduce((sum, pt, i) => (i % 2 === 0 ? sum + pt : sum), 0) / (points.length / 2);
			const centerY = points.reduce((sum, pt, i) => (i % 2 === 1 ? sum + pt : sum), 0) / (points.length / 2);

			return (
				<Group key={`${annotation.id}-${index}`}>
					<Line
						points={points}
						stroke={style.stroke}
						strokeWidth={2}
						fill={style.fillSolid}
						closed
						opacity={0.9}
					/>
					{annotation.points.map((point, pointIndex) => (
						<Circle
							key={pointIndex}
							x={point[0] * canvas.width}
							y={point[1] * canvas.height}
							radius={4}
							fill={style.stroke}
							stroke="#ffffff"
							strokeWidth={1}
							opacity={0.9}
						/>
					))}
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
			);
		}

		if (annotation.type === 'circle') {
			const cx = annotation.cx * canvas.width;
			const cy = annotation.cy * canvas.height;
			const r = annotation.radius * Math.min(canvas.width, canvas.height);
			return (
				<Group key={`${annotation.id}-${index}`}>
					<Circle x={cx} y={cy} radius={r} stroke={style.stroke} strokeWidth={2} fill={style.fillSolid} />
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

	const zoomControls = (forFullscreen: boolean) => (
		<Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: forFullscreen ? 2 : 1, alignItems: 'center' }}>
			<IconButton onClick={handleZoomOut} size="small" disabled={scale <= SCALE_MIN}>
				<ZoomOut fontSize={forFullscreen ? 'medium' : 'small'} />
			</IconButton>
			<Typography variant={forFullscreen ? 'body2' : 'caption'} sx={{ alignSelf: 'center', minWidth: 48, textAlign: 'center' }}>
				{Math.round(scale * 100)}%
			</Typography>
			<IconButton onClick={handleZoomIn} size="small" disabled={scale >= SCALE_MAX}>
				<ZoomIn fontSize={forFullscreen ? 'medium' : 'small'} />
			</IconButton>
			<IconButton onClick={handleResetView} size="small" title="Reset zoom & pan">
				<PanTool fontSize={forFullscreen ? 'medium' : 'small'} />
			</IconButton>
		</Box>
	);

	const renderStage = (cw: number, ch: number, stageRef: React.RefObject<Konva.Stage | null>, imageRef: React.RefObject<Konva.Image | null>) => (
		<Stage
			ref={stageRef}
			width={cw}
			height={ch}
			scaleX={scale}
			scaleY={scale}
			x={position.x}
			y={position.y}
			onMouseDown={e => handleStageMouseDown(e, stageRef.current, imageRef)}
			onMouseMove={handleStageMouseMove}
			onMouseUp={handleStageMouseUp}
			onWheel={handleWheel}
			draggable={false}
		>
			<Layer>
				<KonvaImage ref={imageRef} image={konvaImage || undefined} width={cw} height={ch} />
				{annotations.map((annotation, index) => renderAnnotationForCanvas(annotation, index, { width: cw, height: ch }))}
			</Layer>
		</Stage>
	);

	const renderFullscreenContent = () => (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
				<ImageIcon color="primary" />
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					{originalFileName}
				</Typography>
				<Chip
					label={`${annotations.length} regions`}
					size="small"
					sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontSize: '0.7rem' }}
				/>
				<Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
					Drag to pan · Wheel to zoom
				</Typography>
			</Box>

			<Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
				<Box
					sx={{
						border: '1px solid #e0e0e0',
						borderRadius: 1,
						overflow: 'hidden',
						background: '#fafafa'
					}}
				>
					{!imageLoaded && !imageError && (
						<Box sx={{ width: 400, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
							<Typography>Loading image...</Typography>
						</Box>
					)}
					{imageError && (
						<Box sx={{ width: 400, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
							<Typography color="error">Failed to load image</Typography>
						</Box>
					)}
					{imageLoaded && renderStage(fullscreenCanvasSize.width, fullscreenCanvasSize.height, stageFullRef, imageFullRef)}
				</Box>
			</Box>
			{zoomControls(true)}
		</Box>
	);

	return (
		<Box>
			<Paper
				variant="outlined"
				sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
					<ImageIcon color="primary" fontSize="small" />
					<Typography variant="body2" sx={{ fontWeight: 500, color: '#333', flex: 1 }}>
						{originalFileName}
					</Typography>
					<Chip
						label={`${annotations.length} regions`}
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
					{imageLoaded && renderStage(canvasSize.width, canvasSize.height, stageInlineRef, imageInlineRef)}
				</Box>

				{zoomControls(false)}
				<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
					Drag to pan · Wheel to zoom
				</Typography>
			</Paper>

			<Dialog open={showFullscreen} onClose={() => setShowFullscreen(false)} fullScreen>
				<DialogTitle>{originalFileName}</DialogTitle>
				<DialogContent sx={{ p: 2 }}>{renderFullscreenContent()}</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowFullscreen(false)}>Close</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ImageDisplay;
