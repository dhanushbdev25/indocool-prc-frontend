import { Button, styled } from '@mui/material';

export const StyledButton = styled(Button)(() => ({
	padding: '10px 16px',
	borderRadius: '4px',
	backgroundColor: '#141414',
	textTransform: 'capitalize',
	fontFamily: 'Public Sans, sans-serif',
	fontWeight: 400,
	fontSize: '16px',
	lineHeight: '24px',
	letterSpacing: 0,
	textAlign: 'center',
	color: '#ffffff',

	'&:hover': {
		backgroundColor: '#333'
	}
}));
