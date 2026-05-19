import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MasterListPageTitle } from '../../../../../../components/masters';

const PrcTemplateHeader = () => {
	const navigate = useNavigate();

	return (
		<MasterListPageTitle
			title="PRC Template Master"
			description="Control which PRC templates are catalogue-ready and keep step counts aligned with manufacturing."
			action={
				<Button
					variant="contained"
					size="medium"
					startIcon={<AddIcon />}
					onClick={() => navigate('/prc-template-master/create-prc-template')}
					sx={{ textTransform: 'none', borderRadius: 1 }}
				>
					Add Template
				</Button>
			}
		/>
	);
};

export default PrcTemplateHeader;
