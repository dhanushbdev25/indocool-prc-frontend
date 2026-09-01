import { type TimelineStep } from '../types/execution.types';

export type ExecutionRoleKind = 'production' | 'quality' | 'other';

/**
 * Maps the currently selected role name to an execution access kind.
 * Role names are backend-defined strings; comparison is case-insensitive.
 * Centralized here so the matched strings are trivial to adjust.
 */
export const getExecutionRoleKind = (roleName?: string): ExecutionRoleKind => {
	const normalized = (roleName ?? '').toLowerCase();
	if (normalized === 'production') return 'production';
	if (normalized === 'quality') return 'quality';
	return 'other';
};

/**
 * A quality-approved inspection is an inspection step whose master config
 * requires sign-off by Quality (`approveByQuality === true`).
 */
const isQualityApprovedInspection = (step: TimelineStep): boolean =>
	step.type === 'inspection' && step.inspectionMetadata?.approveByQuality === true;

// REVERTED: a sequence step containing any CTQ sub-step used to count as quality-approved here,
// which made the whole step read-only for the Production role and editable only by Quality.
// Restore this branch to bring that restriction back.
// const isQualityApprovedInspection = (step: TimelineStep): boolean => {
// return 	(step.type === 'inspection' && step.inspectionMetadata?.approveByQuality === true ) || (step.type === 'sequence' && (step.stepGroup?.steps?.some((step : any) => step.ctq)) === true);
// }
/**
 * Determines whether the current role may edit (enter data for) a given step.
 * - Production: all steps except quality-approved inspections.
 * - Quality: only quality-approved inspections.
 * - Other roles (admin, supervisor, etc.): no role-based restriction.
 */
export const canEditStepForRole = (step: TimelineStep, roleName?: string): boolean => {
	const kind = getExecutionRoleKind(roleName);
	if (kind === 'other') return true;

	if (kind === 'production') {
		return !isQualityApprovedInspection(step);
	}

	// kind === 'quality'
	return isQualityApprovedInspection(step);
};
