// material-ui
import { Box } from '@mui/material';

// asset
import authBG from './authBG.jpg'; // make sure the image exists and path is correct

// ==============================|| AUTH BACKGROUND TILE ||============================== //

const AuthBackground = () => {
	return (
		<Box
			sx={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				width: '100%',
				height: '100%',
				backgroundImage: `url(${authBG})`,
				backgroundRepeat: 'repeat', // repeat image as tiles
				backgroundSize: '665px 383px', // scale down each tile to 100x100px
				backgroundPosition: 'top left',
				zIndex: -1
			}}
		/>
	);
};

export default AuthBackground;
