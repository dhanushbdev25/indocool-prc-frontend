import { styled } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import './index.css';
interface StyledTabProps {
	label: string;
	status: number;
}

export const AntTabs = styled(Tabs)({});

export const AntTab = styled((props: StyledTabProps) => (
	<Tab
		disableRipple
		{...props}
		style={{
			background: props?.status === 2 ? 'white' : '#EFEFEF'
		}}
	/>
))(({ theme }) => ({
	textTransform: 'none',
	minHeight: '32px !important',
	minWidth: '72px !important',
	padding: '0% !important',
	fontSize: '14px',
	fontWeight: theme.typography.fontWeightBold,
	marginRight: theme.spacing(1),
	boxShadow: '0px 0px 0px 0px rgba(117,110,110,0.75)',
	border: '1px solid white',
	borderRadius: '20px',
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
		background: '#D4D2FE !important',
		fontSize: '14px',
		color: 'black',
		border: '1px solid #D4D2FE',
		fontWeight: theme.typography.fontWeightBold
	},
	'&.Mui-focusVisible': {
		backgroundColor: '#d1eaff'
	}
}));
