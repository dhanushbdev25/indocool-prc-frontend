import { MasterListPageTitle } from '../../../../../../components/masters';

interface InspectionHeaderProps {
	action?: React.ReactNode;
}

const InspectionHeader = ({ action }: InspectionHeaderProps) => (
	<MasterListPageTitle title="Inspection Master" action={action} />
);

export default InspectionHeader;
