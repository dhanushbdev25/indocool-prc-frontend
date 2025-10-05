import { Box, Typography } from '@mui/material';

const DisplayError = ({ name }: { name: string }) => {
	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				color: 'red'
			}}
		>
			<Typography>Error loading {name}.</Typography>
		</Box>
	);
};

const Loading = ({ name }: { name: string }) => {
	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}
		>
			<Typography>Loading {name}...</Typography>
		</Box>
	);
};
export { Loading, DisplayError };
