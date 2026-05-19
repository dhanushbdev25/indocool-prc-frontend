import MasterSummaryStrip from '../../../../../../components/masters/MasterSummaryStrip';

interface MouldSummaryCardsProps {
	totalMoulds: number;
	dueCount: number;
	notDueCount: number;
}

const MouldSummaryCards = ({ totalMoulds, dueCount, notDueCount }: MouldSummaryCardsProps) => {
	const metrics = [
		{ label: 'Total moulds', value: totalMoulds },
		{ label: 'Due for reconciliation', value: dueCount },
		{ label: 'Not due', value: notDueCount }
	];

	return <MasterSummaryStrip metrics={metrics} />;
};

export default MouldSummaryCards;
