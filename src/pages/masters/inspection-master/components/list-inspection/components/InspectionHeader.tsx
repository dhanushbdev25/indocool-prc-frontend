import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MasterListPageTitle } from '../../../../../../components/masters';

const InspectionHeader = () => {
	const navigate = useNavigate();

	return (
		<MasterListPageTitle
			title="Inspection Master"
			description="Maintain inspection definitions, parameters, and approve-by-production flags for the shop floor."
			action={
				<Button
					variant="contained"
					size="medium"
					startIcon={<AddIcon />}
					onClick={() => navigate('/inspection-master/create-inspection')}
					sx={{ textTransform: 'none', borderRadius: 1 }}
				>
					Add Inspection
				</Button>
			}
		/>
	);
};

export default InspectionHeader;
