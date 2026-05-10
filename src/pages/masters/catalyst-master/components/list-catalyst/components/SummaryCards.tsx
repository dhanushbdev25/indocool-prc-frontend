import MasterSummaryStrip from '../../../../../../components/masters/MasterSummaryStrip';

interface SummaryCardsProps {
	headerData: {
		ACTIVE: number;
		INACTIVE: number;
	};
}

const SummaryCards = ({ headerData }: SummaryCardsProps) => {
	const totalCharts = headerData.ACTIVE + headerData.INACTIVE;

	const metrics = [
		{ label: 'Total charts', value: totalCharts },
		{ label: 'Active', value: headerData.ACTIVE },
		{ label: 'Inactive', value: headerData.INACTIVE }
	];

	return <MasterSummaryStrip metrics={metrics} />;
};

export default SummaryCards;
