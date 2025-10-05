import { useTheme } from '@mui/material/styles';
import { Box, Grid, Stack } from '@mui/material';
import DrawerHeaderStyled from './DrawerHeaderStyled';
import { useNavigate } from 'react-router-dom';
import Logo from '../../../components/common/logo/Logo';

const DrawerHeader = ({ open }: { open: boolean }) => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<DrawerHeaderStyled theme={theme} open={open}>
			<Box sx={{}}>
				<Stack
					direction="row"
					spacing={1}
					alignItems="center"
					sx={{ cursor: 'pointer' }}
					onClick={() => {
						navigate('/');
					}}
				>
					<Logo
						sx={{
							py: 1.5,
							display: 'inline-flex'
						}}
					/>
					<Grid
						sx={{
							fontSize: '20px',
							fontWeight: 800
						}}
					>
						Digitalisation
					</Grid>
				</Stack>
			</Box>
		</DrawerHeaderStyled>
	);
};

export default DrawerHeader;
