import PropTypes from 'prop-types';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { Box, useMediaQuery } from '@mui/material';
import SimpleBar from 'simplebar-react';

// root style
const RootStyle = styled('div')({
	flexGrow: 1,
	height: '100%',
	overflow: 'hidden'
});

// scroll bar wrapper
const SimpleBarStyle = styled(SimpleBar)(({ theme }) => ({
	maxHeight: '100%',
	'& .simplebar-scrollbar': {
		'&:before': {
			backgroundColor: alpha(theme.palette.grey[500], 0.48)
		},
		'&.simplebar-visible:before': {
			opacity: 1
		}
	},
	'& .simplebar-track.simplebar-vertical': {
		width: 10
	},
	'& .simplebar-track.simplebar-horizontal .simplebar-scrollbar': {
		height: 6
	},
	'& .simplebar-mask': {
		zIndex: 'inherit'
	}
}));

export default function SimpleBarScroll({ children, sx, ...other }: any) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	if (isMobile) {
		return (
			<Box sx={{ overflowX: 'auto', ...sx }} {...other}>
				{children}
			</Box>
		);
	}

	return (
		<RootStyle>
			<SimpleBarStyle timeout={500} clickOnTrack={false} sx={sx} {...other}>
				{children}
			</SimpleBarStyle>
		</RootStyle>
	);
}

SimpleBarScroll.propTypes = {
	children: PropTypes.node,
	sx: PropTypes.object
};
