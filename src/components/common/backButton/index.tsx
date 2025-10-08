import { ArrowLeftOutlined } from '@ant-design/icons';
import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const BackNavigationButton = () => {
	const navigate = useNavigate();

	const handleBackClick = () => {
		navigate(-1); // Navigate to the previous route
	};

	return (
		<Grid size={{ xs: 12 }} color="primary.main" onClick={handleBackClick} style={{ cursor: 'pointer' }}>
			<ArrowLeftOutlined /> Back
		</Grid>
	);
};

export default BackNavigationButton;
