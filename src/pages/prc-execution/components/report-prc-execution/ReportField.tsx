import type React from 'react';
import { Box, Typography } from '@mui/material';

/** A read-only label above its value, as used in the PRC report header. */
export function ReportField({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Box sx={{ minWidth: 0 }}>
			<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
				{label}
			</Typography>
			<Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
				{children}
			</Typography>
		</Box>
	);
}
