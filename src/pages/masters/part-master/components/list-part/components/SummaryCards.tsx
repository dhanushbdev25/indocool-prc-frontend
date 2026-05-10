import MasterSummaryStrip from '../../../../../../components/masters/MasterSummaryStrip';

interface SummaryCardsProps {
	headerData: {
		ACTIVE: number;
		NEW: number;
		INACTIVE: number;
	};
}

const SummaryCards = ({ headerData }: SummaryCardsProps) => {
	const totalParts = headerData.ACTIVE + headerData.NEW + headerData.INACTIVE;

	const metrics = [
		{ label: 'Total', value: totalParts },
		{ label: 'Active', value: headerData.ACTIVE },
		{ label: 'New', value: headerData.NEW },
		{ label: 'Inactive', value: headerData.INACTIVE }
	];

	return <MasterSummaryStrip metrics={metrics} />;
};

export default SummaryCards;
