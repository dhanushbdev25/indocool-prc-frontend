import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MasterListPageTitle } from '../../../../../../components/masters';

const SequenceHeader = () => {
	const navigate = useNavigate();

	return (
		<MasterListPageTitle
			title="Process Sequence Master"
			description="Search and filter layout and ISP sequences with categories, items, and status at a glance."
			action={
				<Button
					variant="contained"
					size="medium"
					startIcon={<AddIcon />}
					onClick={() => navigate('/sequence-master/create-sequence')}
					sx={{ textTransform: 'none', borderRadius: 1 }}
				>
					Add Sequence
				</Button>
			}
		/>
	);
};

export default SequenceHeader;
