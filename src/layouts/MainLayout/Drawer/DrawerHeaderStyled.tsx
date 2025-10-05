import { styled } from '@mui/material/styles';
import { Box, BoxProps } from '@mui/material';

// ==============================|| DRAWER HEADER - STYLED ||============================== //

interface DrawerHeaderStyledProps extends BoxProps<any> {
	open: boolean;
}

const DrawerHeaderStyled = styled(Box, {
	shouldForwardProp: prop => prop !== 'open'
})<DrawerHeaderStyledProps>(({ theme, open }) => ({
	...theme.mixins.toolbar,
	background: '#012B64',
	boxShadow: '0px 0px 20px 0px rgba(0, 0, 0, 0.03)',
	borderRadius: '0px !important',
	display: 'flex',
	alignItems: 'center',
	justifyContent: open ? 'flex-start' : 'center',
	color: open ? 'white' : 'transparent',
	transition: 'all 0.3s ease',
	paddingLeft: theme.spacing(open ? 3 : 0)
}));

export default DrawerHeaderStyled;
