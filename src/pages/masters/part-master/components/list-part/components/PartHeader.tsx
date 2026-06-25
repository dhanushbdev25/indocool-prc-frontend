import { MasterListPageTitle } from '../../../../../../components/masters';

interface PartHeaderProps {
	action?: React.ReactNode;
}

const PartHeader = ({ action }: PartHeaderProps) => <MasterListPageTitle title="Part Master" action={action} />;

export default PartHeader;
