import { Backdrop, useTheme } from '@mui/material';
import { MutatingDots } from 'react-loader-spinner';
interface BackdropLoaderprops {
	openStates: boolean;
}
function BackdropLoader({ openStates }: Readonly<BackdropLoaderprops>) {
	const theme = useTheme();
	return (
		<Backdrop sx={{ color: '#fff', zIndex: () => 9999 }} open={openStates}>
			<MutatingDots
				visible={openStates}
				height="100"
				width="100"
				color={theme.palette.secondary.main}
				secondaryColor={theme.palette.secondary.main}
				radius="12.5"
				ariaLabel="mutating-dots-loading"
				wrapperStyle={{}}
				wrapperClass=""
			/>
		</Backdrop>
	);
}

export default BackdropLoader;
