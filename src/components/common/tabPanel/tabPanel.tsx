import { Grid } from '@mui/material';

const TabPanel = (props: any) => {
	const { children, value, index, ...other } = props;

	return (
		<Grid
			item
			role="tabpanel"
			hidden={value !== index}
			id={`tabpanel-${index}`}
			aria-labelledby={`tab-${index}`}
			{...other}
		>
			{value === index && (
				<Grid container sx={{ p: 3 }}>
					{children}
				</Grid>
			)}
		</Grid>
	);
};

export default TabPanel;
