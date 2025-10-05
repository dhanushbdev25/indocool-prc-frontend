import { styled, Grid, Typography, Box, Card } from '@mui/material';

export const CustomCard = styled(Card)({
	borderRadius: '8px',
	color: '#FFFFFF',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	flex: '1 0 0'
});

export const CardBox = styled(Box)({
	display: 'flex',
	flexDirection: 'column',
	alignItems: ' flex-start',
	gap: '12px',
	alignSelf: 'stretch'
});

export const CardUtilis = styled(Grid)({
	fontFamily: 'Roboto',
	fontSize: '14px',
	fontStyle: 'normal',
	fontWeight: '600',
	lineHeight: 'normal',
	letterSpacing: '0.014px',
	color: '#FFF',
	marginTop: '12px'
});

export const CardRequestContainer = styled(Grid)({
	backgroundColor: '#FFF',
	borderRadius: '8px',
	display: 'flex',
	padding: ' 6px',
	justifyContent: 'center',
	alignItems: 'center',
	gap: '4px'
});

export const CardRequestData = styled(Grid)({
	display: 'flex',
	padding: '  2px',
	height: '18px',
	justifyContent: 'center',
	alignItems: 'center',
	fontSize: '11px',
	gap: '6px',
	borderRadius: ' 4px',
	color: 'black',
	background: 'rgba(110, 110, 110, 0.14)'
});

export const CardRequestItem = styled(Typography)({
	color: '#505050',
	fontFamily: 'Roboto',
	fontSize: '11px',
	fontStyle: 'normal',
	fontWeight: ' 500',
	lineHeight: 'normal'
});

export const CardTotalRequest = styled(Typography)({
	color: ' #FFF',
	fontFamily: 'Roboto',
	fontSize: '32px',
	fontStyle: 'normal',
	fontWeight: 800,
	lineHeight: '32px'
});

export const CardHeader = styled(Typography)({
	alignSelf: 'stretch',
	fontFamily: 'Roboto',
	fontSize: '16px',
	fontStyle: 'normal',
	fontWeight: 600,
	lineHeight: 'normal',
	letterSpacing: '0.024px',
	color: 'rgba(255, 255, 255, 0.90)'
});

export const CardIcon = styled(Typography)({
	borderRadius: '10.667px',
	background: 'rgba(137, 187, 255, 0.14)',
	display: 'flex',
	width: '40px',
	height: '40px',
	padding: '1.333px 10.667px',
	justifyContent: 'center',
	alignItems: 'center',
	gap: '13.333px',
	flexShrink: '0',
	marginBottom: '20px'
});
