import { styled } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import './index.css';
interface StyledTabProps {
	label: string;
}

export const DateTabs = styled(Tabs)({
	alignItems: 'center'
});

export const DateTab = styled((props: StyledTabProps) => (
	<Tab disableRipple {...props} style={{ minWidth: '24px !important' }} />
))(({ theme }) => ({
	textTransform: 'none',
	minHeight: '32px !important',
	minWidth: '54px !important',
	padding: '0% !important',
	fontSize: '16px',
	color: 'black',
	[theme.breakpoints.up('sm')]: {},
	fontWeight: theme.typography.fontWeightRegular,
	marginRight: theme.spacing(1),
	fontFamily: [
		'-apple-system',
		'BlinkMacSystemFont',
		'"Segoe UI"',
		'Roboto',
		'"Helvetica Neue"',
		'Arial',
		'sans-serif',
		'"Apple Color Emoji"',
		'"Segoe UI Emoji"',
		'"Segoe UI Symbol"'
	].join(','),
	'&:hover': {
		opacity: 1
	},
	'&.Mui-selected': {
		background: '#2E2C5E',
		border: '1px solid #2E2C5E',
		borderRadius: '8px',
		color: 'white',
		fontWeight: theme.typography.fontWeightMedium
	},
	'&.Mui-focusVisible': {
		backgroundColor: '#d1eaff'
	}
}));
