import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MasterListPageTitle } from '../../../../../../components/masters';

const PartHeader = () => {
	const navigate = useNavigate();

	return (
		<MasterListPageTitle
			title="Part Master"
			description="Browse part numbers, BOM detail, layup and model attributes, and mould health in one place."
			action={
				<Button
					variant="contained"
					size="medium"
					startIcon={<AddIcon />}
					onClick={() => navigate('/part-master/create-part')}
					sx={{ textTransform: 'none', borderRadius: 1 }}
				>
					Create Part
				</Button>
			}
		/>
	);
};

export default PartHeader;
