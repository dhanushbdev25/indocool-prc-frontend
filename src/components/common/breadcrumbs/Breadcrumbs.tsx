import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { generateBreadcrumbs } from '../../../routes/screenHelpers';

interface BreadcrumbsProps {
	permissions: string[];
}

const Breadcrumbs = React.memo(({ permissions: _permissions }: BreadcrumbsProps) => {
	const location = useLocation();

	// Memoize breadcrumb generation to avoid recalculation on every render
	const breadcrumbItems = useMemo(() => generateBreadcrumbs(location.pathname), [location.pathname]);

	if (breadcrumbItems.length === 0) {
		return null;
	}

	return (
		<Box sx={{ mb: 2 }}>
			<MuiBreadcrumbs
				separator={<NavigateNextIcon fontSize="small" />}
				aria-label="breadcrumb"
				sx={{
					'& .MuiBreadcrumbs-separator': {
						color: '#94a3b8',
						fontSize: '16px'
					}
				}}
			>
				{breadcrumbItems.map((item, index) => {
					const isLast = index === breadcrumbItems.length - 1;

					if (isLast || !item.path) {
						// Last item or main module (no path) - not clickable
						return (
							<Typography
								key={`${item.text}-${index}`}
								sx={{
									color: isLast ? '#334155' : '#64748b',
									fontSize: '14px',
									fontWeight: isLast ? 500 : 400,
									letterSpacing: '-0.01em'
								}}
							>
								{item.text}
							</Typography>
						);
					}

					// Clickable breadcrumb item
					return (
						<Link
							key={`${item.text}-${index}`}
							to={item.path}
							style={{
								textDecoration: 'none',
								color: '#64748b',
								fontSize: '14px',
								fontWeight: 400,
								letterSpacing: '-0.01em',
								transition: 'color 0.2s ease'
							}}
							onMouseEnter={e => {
								e.currentTarget.style.color = '#334155';
							}}
							onMouseLeave={e => {
								e.currentTarget.style.color = '#64748b';
							}}
						>
							{item.text}
						</Link>
					);
				})}
			</MuiBreadcrumbs>
		</Box>
	);
});

Breadcrumbs.displayName = 'Breadcrumbs';

export default Breadcrumbs;
