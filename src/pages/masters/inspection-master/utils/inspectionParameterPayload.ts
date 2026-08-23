import { sortByNumericOrder } from '../../../../utils/orderedRecords';
import { normalizeCriticalityTag, resolveCriticality, toCriticalityFields } from '../../../../utils/criticality';
import type { InspectionFormData } from '../components/create-inspection/schemas';
import type {
	InspectionParameter,
	InspectionParameterRequest
} from '../../../../store/api/business/inspection-master/inspection.validators';

export type InspectionParameterFormValues = NonNullable<InspectionFormData['inspectionParameters']>[number];

const optionalString = (value: string | number | null | undefined): string | undefined =>
	value != null && value !== '' ? String(value) : undefined;

/**
 * API parameter rows -> form values.
 *
 * Keeps the database `id` on each row. The update endpoint deletes and re-inserts
 * every parameter, so a payload without ids makes Postgres assign new primary keys
 * and orphans everything that referenced the old ones.
 */
export const toInspectionParameterFormValues = (
	parameters: readonly InspectionParameter[]
): InspectionParameterFormValues[] =>
	// Cast at the boundary: the Yup-inferred form type narrows tableConfig column
	// types more tightly than the API type does, the same mismatch the rest of this
	// screen works around with casts.
	sortByNumericOrder(parameters).map((param, index) => ({
		...(param.id != null ? { id: param.id } : {}),
		order: index + 1,
		parameterName: param.parameterName,
		specification: param.specification ?? '',
		minimumAcceptanceValue: param.minimumAcceptanceValue ?? '',
		maximumAcceptanceValue: param.maximumAcceptanceValue ?? '',
		type: param.type,
		files: param.files || {},
		columns: (param.columns || []).map(col => ({
			name: col.name,
			type: col.type,
			defaultValue: col.defaultValue ?? '',
			minimumAcceptanceValue: col.minimumAcceptanceValue ?? '',
			maximumAcceptanceValue: col.maximumAcceptanceValue ?? ''
		})),
		tableConfig: param.tableConfig || undefined,
		role: param.role,
		ctq: param.ctq,
		criticalityTag: normalizeCriticalityTag(param.criticalityTag),
		getInstrumentId: param.getInstrumentId ?? false
	})) as InspectionParameterFormValues[];

/**
 * Clone creates a brand new inspection through the create endpoint, which honours
 * an explicit id just as update does. Carrying the source ids over would try to
 * insert rows that already exist, so they have to go.
 */
export const stripInspectionParameterIds = (
	parameters: readonly InspectionParameterFormValues[]
): InspectionParameterFormValues[] =>
	parameters.map(param => {
		const { id: _id, ...withoutId } = param;
		return withoutId;
	});

/** Form values -> update/create request payload. */
export const toInspectionParameterRequests = (
	parameters: readonly InspectionParameterFormValues[]
): InspectionParameterRequest[] =>
	parameters.map((param, index) => ({
		...(param.id != null ? { id: param.id } : {}),
		order: index + 1,
		parameterName: param.parameterName,
		specification: param.specification ?? undefined,
		minimumAcceptanceValue: optionalString(param.minimumAcceptanceValue as string | number | null | undefined),
		maximumAcceptanceValue: optionalString(param.maximumAcceptanceValue as string | number | null | undefined),
		type: param.type,
		files: param.files || {},
		columns: (param.columns || []).map(col => ({
			name: col.name,
			type: col.type,
			defaultValue: optionalString(col.defaultValue as string | number | null | undefined),
			minimumAcceptanceValue: optionalString(col.minimumAcceptanceValue as string | number | null | undefined),
			maximumAcceptanceValue: optionalString(col.maximumAcceptanceValue as string | number | null | undefined)
		})),
		tableConfig: param.tableConfig || undefined,
		role: param.role,
		// Sent as an explicit null (not omitted) so clearing a tag actually clears the column.
		...toCriticalityFields(resolveCriticality(param)),
		getInstrumentId: param.getInstrumentId ?? false
	})) as InspectionParameterRequest[];
