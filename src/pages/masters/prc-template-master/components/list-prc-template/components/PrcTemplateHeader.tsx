import { MasterListPageTitle } from '../../../../../../components/masters';

interface PrcTemplateHeaderProps {
	action?: React.ReactNode;
}

const PrcTemplateHeader = ({ action }: PrcTemplateHeaderProps) => (
	<MasterListPageTitle title="PRC Template Master" action={action} />
);

export default PrcTemplateHeader;
