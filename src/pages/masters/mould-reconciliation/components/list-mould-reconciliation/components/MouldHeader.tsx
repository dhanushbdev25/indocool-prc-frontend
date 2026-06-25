import { MasterListPageTitle } from '../../../../../../components/masters';

interface MouldHeaderProps {
	action?: React.ReactNode;
}

const MouldHeader = ({ action }: MouldHeaderProps) => (
	<MasterListPageTitle title="Mould reconciliation" action={action} />
);

export default MouldHeader;
