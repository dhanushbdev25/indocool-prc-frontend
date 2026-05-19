import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MasterListPageTitle } from '../../../../../../components/masters';

const CatalystHeader = () => {
	const navigate = useNavigate();

	return (
		<MasterListPageTitle
			title="Catalyst Mixing Master"
			description="Configure catalyst charts, suppliers, and temperature and humidity envelopes for batches."
			action={
				<Button
					variant="contained"
					size="medium"
					startIcon={<AddIcon />}
					onClick={() => navigate('/catalyst-master/create-catalyst')}
					sx={{ textTransform: 'none', borderRadius: 1 }}
				>
					Add Chart
				</Button>
			}
		/>
	);
};

export default CatalystHeader;
