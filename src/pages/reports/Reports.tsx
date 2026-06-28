import { useCallback, useMemo, useState } from 'react';
import { Box, LinearProgress, Stack } from '@mui/material';
import {
	useFetchAvailableReportsQuery,
	useLazyFetchReportQuery
} from '../../store/api/business/reports/reports.api';
import { useDashboardDateRange } from '../dashboard/hooks/useDashboardDateRange';
import { DashboardErrorBanner } from '../dashboard/components/DashboardErrorBanner';
import { ReportsPageHeader } from './components/ReportsPageHeader';
import { ReportsTabStrip } from './components/ReportsTabStrip';
import { ReportsFilterBar } from './components/ReportsFilterBar';
import { ReportTable } from './components/ReportTable';
import { ReportEmptyPrompt } from './components/ReportEmptyPrompt';
import { ReportsAvailableSkeleton } from './components/ReportsAvailableSkeleton';
import { ReportTableSkeleton } from './components/ReportTableSkeleton';

const Reports = () => {
	const availableQuery = useFetchAvailableReportsQuery();
	const reports = useMemo(() => availableQuery.data ?? [], [availableQuery.data]);

	// The user's explicit pick — null until they click a tab. The displayed
	// selection is derived: if the picked code is missing (initial load or a
	// list refresh dropped it), fall back to the first available report.
	const [userPickedCode, setUserPickedCode] = useState<string | null>(null);
	const selectedCode = useMemo(() => {
		if (userPickedCode && reports.some(r => r.code === userPickedCode)) return userPickedCode;
		return reports[0]?.code ?? '';
	}, [reports, userPickedCode]);

	const {
		from,
		to,
		isReady,
		draftPreset,
		draftPresetLabel,
		draftDisplayLabel,
		draftCustomFrom,
		draftCustomTo,
		setDraftPreset,
		setDraftCustomRange,
		applyDraft: applyDateRangeDraft
	} = useDashboardDateRange();

	const [triggerFetchReport, reportQuery] = useLazyFetchReportQuery();

	const handleGenerate = useCallback(() => {
		if (!selectedCode || !isReady) return;
		applyDateRangeDraft();
		triggerFetchReport({ reportType: selectedCode, from, to });
	}, [selectedCode, isReady, applyDateRangeDraft, triggerFetchReport, from, to]);

	// The lazy query result represents the most recent trigger. Only render its
	// data when it matches the active tab — otherwise the user is looking at a
	// freshly selected tab they haven't generated yet.
	const activeArgs = reportQuery.originalArgs;
	const isActiveTabResult = activeArgs?.reportType === selectedCode;
	const data = isActiveTabResult ? reportQuery.data : undefined;
	const isInitialLoading = isActiveTabResult && reportQuery.isFetching && !data;
	const isRefetching = isActiveTabResult && reportQuery.isFetching && !!data;
	const isError = isActiveTabResult && reportQuery.isError;

	const canGenerate = Boolean(selectedCode) && isReady && !reportQuery.isFetching;

	const renderContent = () => {
		if (!selectedCode) {
			return (
				<ReportEmptyPrompt
					title="No report selected"
					message="Pick a report tab above to begin."
				/>
			);
		}
		if (isError) {
			return <DashboardErrorBanner onRetry={handleGenerate} />;
		}
		if (isInitialLoading) {
			return <ReportTableSkeleton />;
		}
		if (!data) {
			return <ReportEmptyPrompt />;
		}
		return (
			<Box sx={{ position: 'relative' }}>
				{isRefetching ? (
					<LinearProgress
						sx={{
							position: 'absolute',
							top: -8,
							left: 0,
							right: 0,
							borderRadius: 999,
							height: 3,
							zIndex: 1
						}}
					/>
				) : null}
				<ReportTable
					header={data.header}
					detail={data.detail}
					exportTitle={`report-${selectedCode.toLowerCase().replace(/_/g, '-')}`}
				/>
			</Box>
		);
	};

	const renderTabsOrSkeleton = () => {
		if (availableQuery.isLoading) return <ReportsAvailableSkeleton />;
		if (availableQuery.isError) return <DashboardErrorBanner onRetry={availableQuery.refetch} />;
		if (reports.length === 0) {
			return (
				<ReportEmptyPrompt
					title="No reports available"
					message="Your account doesn't have any reports yet. Contact your administrator if you expected to see some."
				/>
			);
		}
		return (
			<ReportsTabStrip reports={reports} selectedCode={selectedCode} onSelect={setUserPickedCode} />
		);
	};

	return (
		<Box component="article" sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
			<ReportsPageHeader />
			<Stack>
				{renderTabsOrSkeleton()}

				{reports.length > 0 ? (
					<>
						<ReportsFilterBar
							preset={draftPreset}
							presetLabel={draftPresetLabel}
							displayLabel={draftDisplayLabel}
							customFrom={draftCustomFrom}
							customTo={draftCustomTo}
							onPresetChange={setDraftPreset}
							onCustomRangeChange={setDraftCustomRange}
							onGenerate={handleGenerate}
							canGenerate={canGenerate}
							isFetching={!!isActiveTabResult && reportQuery.isFetching}
						/>
						{renderContent()}
					</>
				) : null}
			</Stack>
		</Box>
	);
};

export default Reports;
