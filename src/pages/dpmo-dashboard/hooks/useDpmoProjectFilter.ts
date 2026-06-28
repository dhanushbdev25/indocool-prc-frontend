import { useCallback, useMemo, useState } from 'react';

/**
 * Single-project filter with a draft/applied split for the Project-wise DPMO tab.
 *
 * Mirrors the draft/applied pattern used by useDashboardEntityFilters, but for one project.
 */
export const useDpmoProjectFilter = () => {
	const [appliedProject, setAppliedProject] = useState<string>('');
	const [draftProject, setDraftProject] = useState<string>('');

	const applyDraft = useCallback(() => {
		setAppliedProject(draftProject);
	}, [draftProject]);

	const resetDraft = useCallback(() => {
		setDraftProject(appliedProject);
	}, [appliedProject]);

	const clearAll = useCallback(() => {
		setAppliedProject('');
		setDraftProject('');
	}, []);

	const isDirty = useMemo(() => draftProject !== appliedProject, [draftProject, appliedProject]);
	const hasActiveFilters = appliedProject.length > 0;

	return {
		appliedProject,
		draftProject,
		setDraftProject,
		applyDraft,
		resetDraft,
		clearAll,
		isDirty,
		hasActiveFilters
	};
};
