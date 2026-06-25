import { MasterListPageTitle } from '../../../../../../components/masters';

interface CatalystHeaderProps {
	action?: React.ReactNode;
}

const CatalystHeader = ({ action }: CatalystHeaderProps) => (
	<MasterListPageTitle title="Catalyst Mixing Master" action={action} />
);

export default CatalystHeader;
