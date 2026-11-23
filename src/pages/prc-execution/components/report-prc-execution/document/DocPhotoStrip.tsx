import { useContext, useEffect, useRef, useState } from 'react';
import { useAuthenticatedFileUrl } from '../../../../../hooks/useAuthenticatedFileUrl';
import { getDefectStyle } from '../../execute-prc/components/defectAnnotationStyles';
import type { AnnotationRegion } from '../../../types/execution.types';
import { PhotoSettledContext } from './photoSettledContext';
import type { DocPhoto } from './types';

/** Numbered marks drawn over the photo in its own pixel space, so they print as crisp vectors. */
function Marks({ regions, width, height }: { regions: AnnotationRegion[]; width: number; height: number }) {
	const unit = Math.max(width, height) / 400;
	const r = 9 * unit;
	const font = 11 * unit;
	return (
		<svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
			{regions.map((region, i) => {
				const style = getDefectStyle(region.category);
				const label = String(i + 1);
				let cx: number;
				let cy: number;
				let shape: React.ReactNode = null;
				if (region.type === 'polygon' && region.points.length > 0) {
					const pts = region.points.map(([x, y]) => [x * width, y * height]);
					cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
					cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
					shape = (
						<polygon
							points={pts.map(p => p.join(',')).join(' ')}
							fill={style.fillSolid}
							fillOpacity={0.35}
							stroke={style.stroke}
							strokeWidth={2 * unit}
						/>
					);
				} else if (region.type === 'circle') {
					cx = region.cx * width;
					cy = region.cy * height;
					shape = (
						<circle
							cx={cx}
							cy={cy}
							r={region.radius * Math.min(width, height)}
							fill={style.fillSolid}
							fillOpacity={0.25}
							stroke={style.stroke}
							strokeWidth={2 * unit}
						/>
					);
				} else if (region.type === 'point') {
					cx = region.x * width;
					cy = region.y * height;
				} else {
					return null;
				}
				return (
					<g key={`${region.id}-${i}`}>
						{shape}
						<circle cx={cx} cy={cy} r={r} fill="#fff" stroke={style.stroke} strokeWidth={2 * unit} />
						<text
							x={cx}
							y={cy}
							fontSize={font}
							fontWeight={700}
							fontFamily="Arial, sans-serif"
							fill="#111"
							textAnchor="middle"
							dominantBaseline="central"
						>
							{label}
						</text>
					</g>
				);
			})}
		</svg>
	);
}

type LoadState = { status: 'loading' } | { status: 'ready'; width: number; height: number } | { status: 'failed' };

function Photo({ photo }: { photo: DocPhoto }) {
	const onSettled = useContext(PhotoSettledContext);
	const { src, loading, error } = useAuthenticatedFileUrl(photo.imageUrl);
	const [state, setState] = useState<LoadState>({ status: 'loading' });
	const reported = useRef(false);

	const settle = (next: LoadState) => {
		setState(next);
		if (!reported.current) {
			reported.current = true;
			onSettled(photo.key);
		}
	};

	useEffect(() => {
		if (!loading && (error || !src)) settle({ status: 'failed' });
		// eslint-disable-next-line react-hooks/exhaustive-deps -- settle is stable enough: it only reports once
	}, [loading, error, src]);

	const failed = state.status === 'failed';
	const ready = state.status === 'ready' ? state : null;

	return (
		<figure className="prc-doc-photo">
			{failed ? (
				<div className="prc-doc-photo-missing">Image could not be loaded: {photo.fileName}</div>
			) : (
				<div
					className="prc-doc-photo-frame"
					style={
						ready
							? {
									// Natural size, but never wider than the page or taller than one page.
									width: `${ready.width}px`,
									maxWidth: `min(100%, calc(230mm * ${ready.width / ready.height}))`
								}
							: undefined
					}
				>
					{src && (
						<img
							src={src}
							alt={photo.caption}
							onLoad={e =>
								settle({
									status: 'ready',
									width: e.currentTarget.naturalWidth || 1,
									height: e.currentTarget.naturalHeight || 1
								})
							}
							onError={() => settle({ status: 'failed' })}
						/>
					)}
					{ready && photo.regions.length > 0 && (
						<Marks regions={photo.regions} width={ready.width} height={ready.height} />
					)}
				</div>
			)}
			<figcaption>{photo.caption}</figcaption>
			{photo.legend.length > 0 && (
				<ul className="prc-doc-legend">
					{photo.legend.map(line => (
						<li key={line}>{line}</li>
					))}
				</ul>
			)}
		</figure>
	);
}

export function DocPhotoStrip({ photos, defects }: { photos: DocPhoto[]; defects?: string }) {
	return (
		<>
			{photos.length > 0 && (
				<div className="prc-doc-photos">
					{photos.map(photo => (
						<Photo key={photo.key} photo={photo} />
					))}
				</div>
			)}
			{defects && <div className="prc-doc-defects">{defects}</div>}
		</>
	);
}
