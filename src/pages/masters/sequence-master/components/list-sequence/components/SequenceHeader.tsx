import { MasterListPageTitle } from '../../../../../../components/masters';

interface SequenceHeaderProps {
	action?: React.ReactNode;
}

const SequenceHeader = ({ action }: SequenceHeaderProps) => (
	<MasterListPageTitle title="Process Sequence Master" action={action} />
);

export default SequenceHeader;
