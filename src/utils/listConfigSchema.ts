import * as yup from 'yup';
import { LIST_ITEM_TYPE_OPTIONS, hasListItemRange } from './listConfig';
import type { ListConfig } from '../types/list-config.types';

const optionalBound = yup.mixed<string | number>().nullable().optional();

const listItemSchema = yup.object({
	id: yup.string().required(),
	// Label rules live in getListItemProblems so they surface on the list as a whole and on the row.
	label: yup.string().default(''),
	type: yup
		.string()
		.required('Input type is required')
		.oneOf(
			LIST_ITEM_TYPE_OPTIONS.map(option => option.value),
			'Invalid input type'
		),
	required: yup.boolean().default(true),
	readOnly: yup.boolean().default(false),
	defaultValue: yup.string().nullable().optional(),
	minimumAcceptanceValue: optionalBound,
	maximumAcceptanceValue: optionalBound
});

/**
 * Item-level problems the field schema cannot express, as one message per offending index. Kept
 * separate so the editor can show each message next to its row.
 */
export const getListItemProblems = (config: ListConfig | null | undefined): Record<number, string> => {
	const problems: Record<number, string> = {};
	const seen = new Map<string, number>();
	(config?.items ?? []).forEach((item, index) => {
		const label = (item.label ?? '').trim();
		if (!label) {
			problems[index] = 'Label is required';
			return;
		}
		const key = label.toLowerCase();
		if (seen.has(key)) {
			problems[index] = `Duplicate label "${label}"`;
			return;
		}
		seen.set(key, index);
		if (item.readOnly && !String(item.defaultValue ?? '').trim()) {
			problems[index] = 'A read-only item needs a value';
			return;
		}
		if (item.type === 'number') {
			for (const bound of [item.minimumAcceptanceValue, item.maximumAcceptanceValue]) {
				if (bound !== null && bound !== undefined && bound !== '' && !Number.isFinite(Number(bound))) {
					problems[index] = 'Min and max must be numbers';
					return;
				}
			}
			if (hasListItemRange(item)) {
				const min = item.minimumAcceptanceValue;
				const max = item.maximumAcceptanceValue;
				if (min !== '' && min != null && max !== '' && max != null && Number(min) > Number(max)) {
					problems[index] = 'Minimum value cannot be greater than maximum value';
					return;
				}
			}
			const def = String(item.defaultValue ?? '').trim();
			if (def && !Number.isFinite(Number(def))) {
				problems[index] = 'Default value must be a number';
			}
		}
	});
	return problems;
};

/** Optional list config; becomes required (with at least one valid item) when `isList` holds. */
export const buildListConfigSchema = (typeField: string, listTypeValue = 'list') =>
	yup
		.object({
			items: yup.array(listItemSchema).default([])
		})
		.nullable()
		.default(null)
		.when(typeField, {
			is: listTypeValue,
			then: schema =>
				schema
					.nonNullable('List configuration is required')
					.required('List configuration is required')
					.test('has-items', 'At least one list item is required', value => (value?.items?.length ?? 0) > 0)
					.test('valid-items', 'Fix the highlighted list items', function (value) {
						const problems = getListItemProblems(value as ListConfig | null);
						const first = Object.entries(problems)[0];
						if (!first) return true;
						return this.createError({ message: `Item ${Number(first[0]) + 1}: ${first[1]}` });
					}),
			otherwise: schema => schema.nullable().optional()
		});
