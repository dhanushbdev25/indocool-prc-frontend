import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Group, Text } from 'react-konva';
import { Box } from '@mui/material';
import type { AnnotationRegion } from '../../types/execution.types';
import { getDefectStyle } from '../execute-prc/components/defectAnnotationStyles';

const DEFAULT_MAX = 900;

function KonvaAnnotationShapes({
	annotations,
	canvasWidth,
	canvasHeight
}: {
	annotations: AnnotationRegion[];
	canvasWidth: number;
	canvasHeight: number;
}) {
	return (
		<>
			{annotations.map((annotation, index) => {
				const style = getDefectStyle(annotation.category);

				if (annotation.type === 'point') {
					const x = annotation.x * canvasWidth;
					const y = annotation.y * canvasHeight;
					return (
						<Group key={`${annotation.id}-${index}`}>
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
								fontStyle="bold"
								fontFamily="Arial"
								fill={style.label}
								align="center"
								verticalAlign="middle"
								width={18}
								height={12}
							/>
						</Group>
					);
				}

				if (annotation.type === 'polygon' && annotation.points.length > 0) {
					const points = annotation.points.flatMap(([px, py]) => [px * canvasWidth, py * canvasHeight]);
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
									x={point[0] * canvasWidth}
									y={point[1] * canvasHeight}
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
								fontStyle="bold"
								fontFamily="Arial"
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
					const cx = annotation.cx * canvasWidth;
					const cy = annotation.cy * canvasHeight;
					const r = annotation.radius * Math.min(canvasWidth, canvasHeight);
					return (
						<Group key={`${annotation.id}-${index}`}>
							<Circle x={cx} y={cy} radius={r} stroke={style.stroke} strokeWidth={2} fill={style.fillSolid} />
							<Text
								x={cx + Math.min(r * 0.35, 28)}
								y={cy - 10}
								text={`${index + 1}`}
								fontSize={12}
								fontStyle="bold"
								fontFamily="Arial"
								fill={style.label}
							/>
						</Group>
					);
				}

				return null;
			})}
		</>
	);
}

export interface InspectionAnnotatedImageRasterProps {
	imageUrl: string;
	annotations: AnnotationRegion[];
	maxWidth?: number;
	onRasterReady: (dataUrl: string | null, error?: string) => void;
}

/**
 * Off-screen Konva composite → PNG data URL for print/PDF-stable inspection diagrams.
 */
const InspectionAnnotatedImageRaster: React.FC<InspectionAnnotatedImageRasterProps> = ({
	imageUrl,
	annotations,
	maxWidth = DEFAULT_MAX,
	onRasterReady
}) => {
	const stageRef = useRef<any>(null);
	const onReadyRef = useRef(onRasterReady);
	onReadyRef.current = onRasterReady;

	const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
	const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);

	useEffect(() => {
		setHtmlImage(null);
		setDims(null);
		if (!imageUrl) {
			onReadyRef.current(null, 'No image URL');
			return;
		}

		const img = new Image();
		let cancelled = false;

		img.onload = () => {
			if (cancelled) return;
			const aspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
			let w = Math.min(maxWidth, img.naturalWidth || maxWidth);
			if (!Number.isFinite(w) || w <= 0) w = maxWidth;
			const h = Math.round(w * aspect);
			setDims({ w: Math.round(w), h });
			setHtmlImage(img);
		};

		img.onerror = () => {
			if (cancelled) return;
			onReadyRef.current(null, 'Failed to load image');
		};

		img.src = imageUrl;

		return () => {
			cancelled = true;
		};
	}, [imageUrl, maxWidth]);

	useEffect(() => {
		if (!dims || !htmlImage || !stageRef.current) return;

		const id = window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				try {
					const stage = stageRef.current;
					if (!stage) return;
					const url = stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png', quality: 1 });
					onReadyRef.current(url);
				} catch (e) {
					const msg = e instanceof Error ? e.message : 'Canvas export failed';
					onReadyRef.current(null, msg);
				}
			});
		});

		return () => window.cancelAnimationFrame(id);
	}, [dims, htmlImage, annotations]);

	if (!dims || !htmlImage) {
		return null;
	}

	return (
		<Box
			className="prc-report-raster-host"
			sx={{
				position: 'fixed',
				left: -12000,
				top: 0,
				width: dims.w,
				height: dims.h,
				overflow: 'hidden',
				opacity: 0,
				pointerEvents: 'none',
				zIndex: -1
			}}
			aria-hidden
		>
			<Stage ref={stageRef} width={dims.w} height={dims.h} listening={false}>
				<Layer>
					<KonvaImage image={htmlImage} width={dims.w} height={dims.h} listening={false} />
					<KonvaAnnotationShapes annotations={annotations} canvasWidth={dims.w} canvasHeight={dims.h} />
				</Layer>
			</Stage>
		</Box>
	);
};

export default InspectionAnnotatedImageRaster;
