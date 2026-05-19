import MasterSummaryStrip from '../../../../../../components/masters/MasterSummaryStrip';
import type { InspectionHeader } from '../../../../../../store/api/business/inspection-master/inspection.validators';

interface SummaryCardsProps {
	headerData: InspectionHeader;
}

const SummaryCards = ({ headerData }: SummaryCardsProps) => {
	const newCount = headerData.NEW ?? 0;
	const totalInspections = headerData.ACTIVE + newCount + headerData.INACTIVE;

	const metrics = [
		{ label: 'Total', value: totalInspections },
		{ label: 'Active', value: headerData.ACTIVE },
		{ label: 'New', value: newCount },
		{ label: 'Inactive', value: headerData.INACTIVE }
	];

	return <MasterSummaryStrip metrics={metrics} />;
};

export default SummaryCards;
