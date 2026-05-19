import MasterSummaryStrip from '../../../../../../components/masters/MasterSummaryStrip';
import type { PrcTemplateHeader } from '../../../../../../store/api/business/prc-template/prc-template.validators';

interface SummaryCardsProps {
	headerData: PrcTemplateHeader;
}

const SummaryCards = ({ headerData }: SummaryCardsProps) => {
	const totalTemplates = headerData.ACTIVE + headerData.NEW + headerData.INACTIVE;

	const metrics = [
		{ label: 'Total', value: totalTemplates },
		{ label: 'Active', value: headerData.ACTIVE },
		{ label: 'New', value: headerData.NEW },
		{ label: 'Inactive', value: headerData.INACTIVE }
	];

	return <MasterSummaryStrip metrics={metrics} />;
};

export default SummaryCards;
