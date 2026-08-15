import { useMemo } from 'react';
import {
	useFetchCustomersQuery,
	useFetchCustomerVariantComboQuery
} from '../store/api/business/part-master/part.api';
import type { FilterComboOption } from '../components/masters/filters/FilterAutocomplete';

interface UseCustomerVariantOptionsArgs {
	/** Currently selected customers — names ('name' mode, ILIKE pages) or codes ('code' mode). */
	selectedCustomers: string[];
	mode: 'name' | 'code';
}

interface CustomerVariantOptionsResult {
	/** label = variant name, value = customerVariantId as string. Empty until exactly one customer is selected. */
	options: FilterComboOption[];
	disabled: boolean;
	placeholder?: string;
	isLoading: boolean;
}

/**
 * Variant options for a customer-dependent Variant filter.
 * The variantCombo API accepts a single customerCode, so options load only when
 * exactly one customer is selected (same gating pattern as units → workstation).
 */
export const useCustomerVariantOptions = ({
	selectedCustomers,
	mode
}: UseCustomerVariantOptionsArgs): CustomerVariantOptionsResult => {
	// Needed in 'name' mode to translate the selected customer name to its code.
	const { data: customersData } = useFetchCustomersQuery(undefined, { skip: mode !== 'name' });

	const customerCode = useMemo(() => {
		if (selectedCustomers.length !== 1) return null;
		const selected = selectedCustomers[0].trim();
		if (!selected) return null;
		if (mode === 'code') return selected;
		const match = (customersData?.data ?? []).find(row => row.label.trim() === selected);
		return match ? String(match.value) : null;
	}, [selectedCustomers, mode, customersData]);

	const { data: variantData, isLoading } = useFetchCustomerVariantComboQuery(
		{ customerCode: customerCode ?? '' },
		{ skip: !customerCode }
	);

	const options = useMemo<FilterComboOption[]>(() => {
		if (!customerCode) return [];
		return (variantData?.data ?? [])
			.map(row => ({ label: row.label, value: String(row.value) }))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [customerCode, variantData]);

	const disabled = !customerCode;
	const placeholder = !customerCode
		? 'Select a single customer first'
		: isLoading
			? 'Loading…'
			: undefined;

	return { options, disabled, placeholder, isLoading };
};
