import { useState, useEffect, useMemo } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	Alert,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
	Grid,
	IconButton,
	Select,
	MenuItem,
	InputLabel,
	Chip,
	Checkbox,
	Paper
} from '@mui/material';
import { Add, Delete, CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import {
	OperationalDatePicker,
	OperationalDateTimePicker
} from '../../../../../../components/common/OperationalDatePicker';
import { type TimelineStep, type ExecutionData, type FormData } from '../../../../types/execution.types';
import { formatDateColumnStorageValue } from '../../../../../../utils/formatTableCellDisplay';
import { OK_NOT_OK_NEGATIVE_LABEL } from '../../../../../../utils/okNotOkLabels';
import { useFetchWorkstationsComboQuery } from '../../../../../../store/api/business/prc-execution/prc-execution.api';

const SHIFT_OPTIONS = ['Shift A', 'Shift B', 'Shift C', 'Shift G'] as const;

interface SequenceStepProps {
	step: TimelineStep;
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => void;
	/** When true, all inputs are disabled (e.g. part master template preview). */
	readOnlyOverride?: boolean;
}

// Helper function to validate measurement value against acceptance range
const validateMeasurementRange = (value: number, min: number, max: number): 'Accepted' | 'Lesser' | 'Greater' => {
	if (value < min) return 'Lesser';
	if (value > max) return 'Greater';
	return 'Accepted';
};

/** Signed delta for exact-target deviation chip (compact, trim useless trailing zeros). */
const formatSignedDeviation = (measured: number, target: number): string => {
	const delta = measured - target;
	if (!Number.isFinite(delta)) return '';
	if (delta === 0) return '0';
	const abs = Math.abs(delta);
	const dec = abs.toFixed(6).replace(/\.?0+$/, '');
	return `${delta > 0 ? '+' : '-'}${dec}`;
};

const parseOptionalNumber = (value: string | number | undefined | null): number | null => {
	if (value === undefined || value === null || value === '') return null;
	const n = typeof value === 'number' ? value : parseFloat(String(value).trim());
	return Number.isFinite(n) ? n : null;
};

const normalizeTargetValueType = (t: string | undefined): string => (typeof t === 'string' ? t.trim().toLowerCase() : '');

const isRangeOrExactTarget = (t: string | undefined): boolean => {
	const n = normalizeTargetValueType(t);
	return n === 'range' || n === 'exact value';
};

const isExactTargetValueType = (t: string | undefined): boolean => normalizeTargetValueType(t) === 'exact value';

/**
 * Numeric band for Measurement validation: prefer minValue/maxValue when both parse;
 * else minimumAcceptanceValue/maximumAcceptanceValue (sequence master often only persists acceptance).
 * For exact value, a single bound (min or max) is enough — treated as target t..t.
 */
const getNumericMeasurementBounds = (stepData: {
	targetValueType?: string;
	minValue?: string;
	maxValue?: string;
	minimumAcceptanceValue?: string;
	maximumAcceptanceValue?: string;
}): { min: number; max: number } | null => {
	const specMin = parseOptionalNumber(stepData.minValue);
	const specMax = parseOptionalNumber(stepData.maxValue);
	if (specMin !== null && specMax !== null) {
		return { min: specMin, max: specMax };
	}
	const accMin = parseOptionalNumber(stepData.minimumAcceptanceValue);
	const accMax = parseOptionalNumber(stepData.maximumAcceptanceValue);
	if (isExactTargetValueType(stepData.targetValueType)) {
		const t = accMin ?? accMax;
		if (t !== null) return { min: t, max: t };
		return null;
	}
	if (accMin !== null && accMax !== null) {
		return { min: accMin, max: accMax };
	}
	return null;
};

/** Any sequence step with range/exact target and parsable spec or acceptance bounds (Measurement, Inspection, Check, Operation, etc.). */
const isNumericRangeStepWithBounds = (stepData: {
	targetValueType?: string;
	minValue?: string;
	maxValue?: string;
	minimumAcceptanceValue?: string;
	maximumAcceptanceValue?: string;
}): boolean => {
	if (!isRangeOrExactTarget(stepData.targetValueType)) return false;
	return getNumericMeasurementBounds(stepData) !== null;
};

const buildEmptyMeasurements = (n: number) =>
	Array.from({ length: n }, (_, i) => ({ id: String(i + 1), value: '' }));

const normalizeMeasurementsToCount = (
	loaded: Array<{ id: string; value: string }>,
	n: number
): Array<{ id: string; value: string }> => {
	const out = buildEmptyMeasurements(n);
	for (let i = 0; i < Math.min(loaded.length, n); i++) {
		out[i] = { id: String(i + 1), value: loaded[i].value ?? '' };
	}
	return out;
};

const SequenceStep = ({ step, executionData, onStepComplete, readOnlyOverride }: SequenceStepProps) => {
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [acknowledgments, setAcknowledgments] = useState<Record<string, boolean>>({});

	const plantCode = executionData.plantCode ?? '';
	const { data: workstationOptions = [] } = useFetchWorkstationsComboQuery(
		{ plantCodes: plantCode ? [plantCode] : [] },
		{ skip: !plantCode }
	);

	const getOkNotOkValue = (value: unknown): string => {
		if (typeof value === 'string') return value;
		if (typeof value === 'object' && value !== null && 'value' in value) {
			const innerValue = (value as Record<string, unknown>).value;
			return typeof innerValue === 'string' ? innerValue : '';
		}
		return '';
	};

	const readApiComment = (obj: Record<string, unknown>): string => {
		const fromComments = obj.comments;
		if (typeof fromComments === 'string') return fromComments;
		const legacy = obj.notOkComment;
		return typeof legacy === 'string' ? legacy : '';
	};

	// Compute initial data from existing data
	const initialData = useMemo(() => {
		const stepData = step.stepData;
		const defaultResponsiblePersonData = [{ id: '1', role: 'l1' as const, employeeName: '', employeeCode: '' }];
		const fixedMeasurementCount =
			stepData?.multipleMeasurements && stepData.multipleMeasurementMaxCount && stepData.multipleMeasurementMaxCount > 0
				? stepData.multipleMeasurementMaxCount
				: null;

		if (!stepData)
			return {
				formData: {},
				measurements: fixedMeasurementCount ? buildEmptyMeasurements(fixedMeasurementCount) : [{ id: '1', value: '' }],
				responsiblePersonData: defaultResponsiblePersonData,
				instrumentId: ''
			};
		if (executionData.prcAggregatedSteps) {
			const existingData =
				stepData.stepGroupId && stepData.stepId
					? (executionData.prcAggregatedSteps as Record<string, Record<string, Record<string, unknown>>>)[
							stepData.prcTemplateStepId
						]?.[stepData.stepGroupId?.toString() ?? '']?.[stepData.stepId?.toString() ?? '']
					: undefined;

			if (existingData) {
				// Handle the new data structure where data is nested
				let actualData = existingData;
				if (typeof existingData === 'object' && existingData !== null && 'data' in existingData) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					actualData = (existingData as any).data;
				}

				// Extract responsible person data if it exists (at the same level as data)
				let responsiblePersonData: Array<{
					id: string;
					role: 'l1' | 'l2' | 'l3' | 'l4';
					employeeName: string;
					employeeCode: string;
				}> = defaultResponsiblePersonData;
				if (typeof existingData === 'object' && existingData !== null) {
					// Check for responsible person data at the same level as data
					if ('employeeName' in existingData && 'employeeCode' in existingData && 'role' in existingData) {
						// Single object format (backward compatibility)
						const role = existingData.role as string;
						const validRole = ['l1', 'l2', 'l3', 'l4'].includes(role) ? (role as 'l1' | 'l2' | 'l3' | 'l4') : 'l1';
						responsiblePersonData = [
							{
								id: '1',
								role: validRole,
								employeeName: (existingData.employeeName as string) || '',
								employeeCode: (existingData.employeeCode as string) || ''
							}
						];
					} else if ('responsiblePersons' in existingData && Array.isArray(existingData.responsiblePersons)) {
						// Array format (new format)
						responsiblePersonData = (
							existingData.responsiblePersons as Array<{
								id: string;
								role: string;
								employeeName: string;
								employeeCode: string;
							}>
						).map((person, index) => ({
							id: person.id || (index + 1).toString(),
							role: ['l1', 'l2', 'l3', 'l4'].includes(person.role) ? (person.role as 'l1' | 'l2' | 'l3' | 'l4') : 'l1',
							employeeName: person.employeeName || '',
							employeeCode: person.employeeCode || ''
						}));
					}
				}

				const extractedInstrumentId = (() => {
					if (typeof existingData === 'object' && existingData !== null && 'instrumentId' in existingData) {
						const value = (existingData as Record<string, unknown>).instrumentId;
						if (typeof value === 'string') return value;
					}
					if (typeof actualData === 'object' && actualData !== null && 'instrumentId' in actualData) {
						const value = (actualData as Record<string, unknown>).instrumentId;
						if (typeof value === 'string') return value;
					}
					return '';
				})();

				if (stepData.targetValueType === 'table' && Array.isArray(actualData)) {
					return {
						formData: {},
						measurements: [{ id: '1', value: '' }],
						responsiblePersonData,
						instrumentId: extractedInstrumentId,
						tableData: actualData as Array<Record<string, string>>
					};
				}

				if (stepData.multipleMeasurements && Array.isArray(actualData)) {
					// Load multiple measurements from array (primitives or { value } from saved validation objects)
					const loadedMeasurements = actualData.map((item: unknown, index: number) => {
						let raw: string | number;
						if (typeof item === 'object' && item !== null && 'value' in item) {
							const v = (item as Record<string, unknown>).value;
							raw = typeof v === 'number' || typeof v === 'string' ? v : '';
						} else {
							raw = item as string | number;
						}
						return {
							id: (index + 1).toString(),
							value: raw === '' || raw === undefined || raw === null ? '' : String(raw)
						};
					});
					const measurements =
						fixedMeasurementCount && fixedMeasurementCount > 0
							? normalizeMeasurementsToCount(loadedMeasurements, fixedMeasurementCount)
							: loadedMeasurements;
					return { formData: {}, measurements, responsiblePersonData, instrumentId: extractedInstrumentId };
				} else if (typeof actualData === 'string' || typeof actualData === 'number') {
					// Load single value directly
					return {
						formData: { value: actualData.toString() },
						measurements: [{ id: '1', value: '' }],
						responsiblePersonData,
						instrumentId: extractedInstrumentId
					};
				} else if (typeof actualData === 'object' && actualData !== null) {
					// Handle object data (like { value: "ok" })
					if ('value' in actualData) {
						const candidateValue = (actualData as Record<string, unknown>).value;
						const resolvedValue =
							typeof candidateValue === 'string'
								? candidateValue
								: typeof candidateValue === 'object' && candidateValue !== null && 'value' in candidateValue
									? String((candidateValue as Record<string, unknown>).value || '')
									: '';
						const resolvedNotOkComment = (() => {
							const fromRoot = readApiComment(actualData as Record<string, unknown>);
							if (fromRoot) return fromRoot;
							if (typeof candidateValue === 'object' && candidateValue !== null) {
								return readApiComment(candidateValue as Record<string, unknown>);
							}
							return '';
						})();
						return {
							formData: {
								value: resolvedValue,
								notOkComment: resolvedNotOkComment
							},
							measurements: [{ id: '1', value: '' }],
							responsiblePersonData,
							instrumentId: extractedInstrumentId
						};
					}
				}
			}
		}
		return {
			formData: {},
			measurements:
				stepData?.multipleMeasurements && fixedMeasurementCount && fixedMeasurementCount > 0
					? buildEmptyMeasurements(fixedMeasurementCount)
					: [{ id: '1', value: '' }],
			responsiblePersonData: defaultResponsiblePersonData,
			instrumentId: '',
			tableData: undefined as Array<Record<string, string>> | undefined
		};
	}, [executionData.prcAggregatedSteps, step]);

	const [formData, setFormData] = useState<FormData>(initialData.formData);
	const [measurements, setMeasurements] = useState<Array<{ id: string; value: string }>>(initialData.measurements);
	const [responsiblePersonData, setResponsiblePersonData] = useState<
		Array<{
			id: string;
			role: 'l1' | 'l2' | 'l3' | 'l4';
			employeeName: string;
			employeeCode: string;
		}>
	>(initialData.responsiblePersonData);
	const [instrumentId, setInstrumentId] = useState<string>(initialData.instrumentId || '');

	const initTableData = useMemo(() => {
		if (initialData.tableData) return initialData.tableData;
		const tc = step.stepData?.tableConfig;
		if (!tc || step.stepData?.targetValueType !== 'table') return undefined;
		return tc.rows.map(row => {
			const rowObj: Record<string, string> = {};
			tc.columns.forEach(col => {
				const cell = row.cells[col.name];
				rowObj[col.name] = cell?.readOnly ? cell.value : (cell?.value || '');
			});
			return rowObj;
		});
	}, [initialData.tableData, step.stepData?.tableConfig, step.stepData?.targetValueType]);

	const [tableData, setTableData] = useState<Array<Record<string, string>> | undefined>(initTableData);

	// Update form data when initial data changes
	useEffect(() => {
		setFormData(initialData.formData);
		setMeasurements(initialData.measurements);
		setResponsiblePersonData(initialData.responsiblePersonData);
		setInstrumentId(initialData.instrumentId || '');
		if (initialData.tableData) {
			setTableData(initialData.tableData);
		} else if (initTableData) {
			setTableData(initTableData);
		}
	}, [initialData, initTableData]);

	const stepData = step.stepData;
	if (!stepData) {
		return <div>Invalid step data</div>;
	}

	// Check if this specific sub-step is already filled
	const isSubStepFilled = Boolean(
		initialData &&
			(!!initialData.tableData ||
				(stepData.multipleMeasurements && initialData.measurements
					? stepData.multipleMeasurementMaxCount && stepData.multipleMeasurementMaxCount > 0
						? initialData.measurements.length === stepData.multipleMeasurementMaxCount &&
							initialData.measurements.every(
								m => m.value.trim() !== '' && !isNaN(parseFloat(m.value))
							)
						: initialData.measurements.every(
								m => m.value.trim() !== '' && !isNaN(parseFloat(m.value))
							)
					: initialData.formData && Object.keys(initialData.formData).length > 0))
	);
	const isReadOnly = Boolean(readOnlyOverride) || step.status === 'completed' || isSubStepFilled;

	// Debug logging
	console.log('SequenceStep Debug:', {
		stepId: step.stepData?.stepId,
		stepStatus: step.status,
		initialData,
		isSubStepFilled,
		isReadOnly
	});

	const handleValueChange = (value: string) => {
		setFormData(prev => ({
			...prev,
			value: value,
			...(value !== 'not ok' ? { notOkComment: '' } : {})
		}));

		// Clear error when user starts typing
		if (errors.value) {
			setErrors(prev => ({
				...prev,
				value: ''
			}));
		}

		// Clear acknowledgment when value changes (will be re-evaluated)
		if (acknowledgments.value) {
			setAcknowledgments(prev => {
				const newAcks = { ...prev };
				delete newAcks.value;
				return newAcks;
			});
		}
	};

	const handleNotOkCommentChange = (comment: string) => {
		setFormData(prev => ({
			...prev,
			notOkComment: comment
		}));

		if (errors.notOkComment) {
			setErrors(prev => ({
				...prev,
				notOkComment: ''
			}));
		}
	};

	const handleMeasurementChange = (measurementId: string, value: string) => {
		setMeasurements(prev => prev.map(m => (m.id === measurementId ? { ...m, value } : m)));

		// Clear acknowledgment when measurement value changes (will be re-evaluated)
		const acknowledgmentKey = `measurement_${measurementId}`;
		if (acknowledgments[acknowledgmentKey]) {
			setAcknowledgments(prev => {
				const newAcks = { ...prev };
				delete newAcks[acknowledgmentKey];
				return newAcks;
			});
		}

		// Clear error when user starts typing
		if (errors[`measurement_${measurementId}`]) {
			setErrors(prev => ({
				...prev,
				[`measurement_${measurementId}`]: ''
			}));
		}
	};

	const addMeasurement = () => {
		if (stepData.multipleMeasurementMaxCount && stepData.multipleMeasurementMaxCount > 0) return;
		const newId = (measurements.length + 1).toString();
		setMeasurements(prev => [...prev, { id: newId, value: '' }]);
	};

	const removeMeasurement = (measurementId: string) => {
		if (stepData.multipleMeasurementMaxCount && stepData.multipleMeasurementMaxCount > 0) return;
		if (measurements.length > 1) {
			setMeasurements(prev => prev.filter(m => m.id !== measurementId));
		}
	};

	const handleResponsiblePersonChange = (
		personId: string,
		field: 'role' | 'employeeName' | 'employeeCode',
		value: string
	) => {
		setResponsiblePersonData(prev =>
			prev.map(person => (person.id === personId ? { ...person, [field]: value } : person))
		);

		// Clear error when user starts typing
		if (errors[`responsiblePerson_${personId}_${field}`]) {
			setErrors(prev => ({
				...prev,
				[`responsiblePerson_${personId}_${field}`]: ''
			}));
		}
	};

	const addResponsiblePerson = () => {
		const newId = (responsiblePersonData.length + 1).toString();
		setResponsiblePersonData(prev => [...prev, { id: newId, role: 'l1', employeeName: '', employeeCode: '' }]);
	};

	const removeResponsiblePerson = (personId: string) => {
		if (responsiblePersonData.length > 1) {
			setResponsiblePersonData(prev => prev.filter(person => person.id !== personId));
		}
	};

	const handleAcknowledgmentChange = (key: string, acknowledged: boolean) => {
		setAcknowledgments(prev => ({
			...prev,
			[key]: acknowledged
		}));
	};

	const handleInstrumentIdChange = (value: string) => {
		setInstrumentId(value);
		if (errors.instrumentId) {
			setErrors(prev => ({
				...prev,
				instrumentId: ''
			}));
		}
	};

	const handleTableCellChange = (rowIndex: number, colName: string, value: string) => {
		setTableData(prev => {
			if (!prev) return prev;
			const updated = [...prev];
			updated[rowIndex] = { ...updated[rowIndex], [colName]: value };
			return updated;
		});
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		const ackRequiredMsg = isExactTargetValueType(stepData.targetValueType)
			? 'Please acknowledge the deviation from the exact target'
			: 'Please acknowledge the out-of-range value';

		if (stepData.targetValueType === 'table' && stepData.tableConfig && tableData) {
			stepData.tableConfig.columns.forEach(col => {
				tableData.forEach((row, rowIdx) => {
					const rowConfig = stepData.tableConfig!.rows[rowIdx];
					const cellConfig = rowConfig?.cells[col.name];
					if (cellConfig?.readOnly) return;
					const val = row[col.name];
					if (!val || val.trim() === '') {
						newErrors[`table_${rowIdx}_${col.name}`] = `Row ${rowIdx + 1}, ${col.name} is required`;
					} else if (col.type === 'number' && isNaN(parseFloat(val))) {
						newErrors[`table_${rowIdx}_${col.name}`] = `Row ${rowIdx + 1}, ${col.name} must be a number`;
					}
				});
			});
			setErrors(newErrors);
			return Object.keys(newErrors).length === 0;
		}

		const rangeStepWithBounds = isNumericRangeStepWithBounds(stepData);
		const numericBounds = getNumericMeasurementBounds(stepData);

		// For multiple measurements, only validate the measurements array
		if (stepData.multipleMeasurements) {
			if (stepData.multipleMeasurementMaxCount && stepData.multipleMeasurementMaxCount > 0) {
				if (measurements.length !== stepData.multipleMeasurementMaxCount) {
					newErrors.measurements_count = `Exactly ${stepData.multipleMeasurementMaxCount} measurements are required`;
				}
			}
			measurements.forEach((measurement, index) => {
				if (!measurement.value || measurement.value.trim() === '') {
					newErrors[`measurement_${measurement.id}`] = `Measurement ${index + 1} is required`;
				} else {
					const numValue = parseFloat(measurement.value);
					if (isNaN(numValue)) {
						newErrors[`measurement_${measurement.id}`] = `Measurement ${index + 1} must be a valid number`;
					} else if (rangeStepWithBounds && numericBounds) {
						const validationStatus = validateMeasurementRange(numValue, numericBounds.min, numericBounds.max);
						if (validationStatus !== 'Accepted' && !acknowledgments[`measurement_${measurement.id}`]) {
							newErrors[`measurement_${measurement.id}_acknowledge`] = ackRequiredMsg;
						}
					}
				}
			});
		} else {
			// For single measurements, validate the main formData.value
			if (stepData.targetValueType === 'ok/not ok') {
				const selectedValue = getOkNotOkValue(formData.value);
				const notOkComment = typeof formData.notOkComment === 'string' ? formData.notOkComment.trim() : '';

				if (!selectedValue) {
					newErrors.value = 'Please select an option';
				} else if (selectedValue === 'not ok' && !notOkComment) {
					newErrors.notOkComment = `Comment is required when ${OK_NOT_OK_NEGATIVE_LABEL} is selected`;
				}
			} else {
				if (!formData.value || (typeof formData.value === 'string' && formData.value.trim() === '')) {
					newErrors.value = 'Value is required';
				} else {
					const numValue = parseFloat(String(formData.value));
					if (isNaN(numValue)) {
						newErrors.value = 'Please enter a valid number';
					} else if (rangeStepWithBounds && numericBounds) {
						const validationStatus = validateMeasurementRange(numValue, numericBounds.min, numericBounds.max);
						if (validationStatus !== 'Accepted' && !acknowledgments.value) {
							newErrors.value_acknowledge = ackRequiredMsg;
						}
					}
				}
			}
		}

		// Validate responsible person data if required
		if (stepData.responsiblePerson) {
			responsiblePersonData.forEach((person, index) => {
				if (!person.role) {
					newErrors[`responsiblePerson_${person.id}_role`] = `Role is required for person ${index + 1}`;
				}
				if (!person.employeeName || person.employeeName.trim() === '') {
					newErrors[`responsiblePerson_${person.id}_employeeName`] =
						`Employee name is required for person ${index + 1}`;
				}
				if (!person.employeeCode || person.employeeCode.trim() === '') {
					newErrors[`responsiblePerson_${person.id}_employeeCode`] =
						`Employee code is required for person ${index + 1}`;
				}
			});
		}

		if (stepData.getInstrumentId && instrumentId.trim() === '') {
			newErrors.instrumentId = 'Instrument id is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Helper functions for validation status UI
	const getValidationStatus = (value: string | number | undefined): 'Accepted' | 'Lesser' | 'Greater' | null => {
		if (!isNumericRangeStepWithBounds(stepData)) return null;
		const bounds = getNumericMeasurementBounds(stepData);
		if (!bounds) return null;

		const numValue = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : NaN;
		if (isNaN(numValue)) return null;

		return validateMeasurementRange(numValue, bounds.min, bounds.max);
	};

	const getValidationIcon = (status: 'Accepted' | 'Lesser' | 'Greater') => {
		switch (status) {
			case 'Accepted':
				return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
			case 'Lesser':
				return <Warning sx={{ color: 'warning.main', fontSize: 20 }} />;
			case 'Greater':
				return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
		}
	};

	const getValidationChip = (
		status: 'Accepted' | 'Lesser' | 'Greater',
		ctx?: { isExact: boolean; measured: number; target: number }
	) => {
		const color = status === 'Accepted' ? 'success' : status === 'Lesser' ? 'warning' : 'error';
		if (ctx?.isExact) {
			const label =
				status === 'Accepted'
					? 'Matches target'
					: `Deviation: ${formatSignedDeviation(ctx.measured, ctx.target)}`;
			return <Chip icon={getValidationIcon(status)} label={label} color={color} size="small" variant="outlined" />;
		}
		const label = `Range: ${status}`;
		return <Chip icon={getValidationIcon(status)} label={label} color={color} size="small" variant="outlined" />;
	};

	// Helper function to get validation background color
	const getValidationBackgroundColor = (status: 'Accepted' | 'Lesser' | 'Greater') => {
		switch (status) {
			case 'Accepted':
				return '#e8f5e8';
			case 'Lesser':
				return '#fff3e0';
			case 'Greater':
				return '#ffebee';
			default:
				return '#f5f5f5';
		}
	};

	// Helper function to get validation border color
	const getValidationBorderColor = (status: 'Accepted' | 'Lesser' | 'Greater') => {
		switch (status) {
			case 'Accepted':
				return '#4caf50';
			case 'Lesser':
				return '#ff9800';
			case 'Greater':
				return '#f44336';
			default:
				return '#e0e0e0';
		}
	};

	const handleSubmit = () => {
		if (validateForm()) {
			if (stepData.targetValueType === 'table' && tableData) {
				const formDataToSubmit: FormData = {
					data: tableData,
					stepId: stepData.stepId,
					stepGroupId: stepData.stepGroupId,
					prcTemplateStepId: stepData.prcTemplateStepId
				};
				if (stepData.responsiblePerson) {
					formDataToSubmit.responsiblePersons = responsiblePersonData.map(p => ({
						id: p.id,
						role: p.role,
						employeeName: p.employeeName,
						employeeCode: p.employeeCode
					}));
				}
				if (stepData.getInstrumentId) {
					formDataToSubmit.instrumentId = instrumentId.trim();
				}
				onStepComplete(formDataToSubmit);
				return;
			}

			let submitData: string | string[] | Record<string, unknown>;

			if (stepData.multipleMeasurements) {
				// For multiple measurements, send array directly
				submitData = measurements.map(m => m.value);
			} else if (stepData.targetValueType === 'ok/not ok') {
				const selectedValue = getOkNotOkValue(formData.value);
				const notOkComment = typeof formData.notOkComment === 'string' ? formData.notOkComment.trim() : '';
				submitData = {
					value: selectedValue,
					comments: notOkComment
				};
			} else {
				// For single values, send string directly
				submitData = String(formData.value);
			}

			// Prepare form data with responsible person data at the same level as data
			const formDataToSubmit: FormData = {
				data: submitData,
				stepId: stepData.stepId,
				stepGroupId: stepData.stepGroupId,
				prcTemplateStepId: stepData.prcTemplateStepId
			};

			// Add responsible person data at the same level as data if required
			if (stepData.responsiblePerson) {
				formDataToSubmit.responsiblePersons = responsiblePersonData.map(person => ({
					id: person.id,
					role: person.role,
					employeeName: person.employeeName,
					employeeCode: person.employeeCode
				}));
			}
			if (stepData.getInstrumentId) {
				formDataToSubmit.instrumentId = instrumentId.trim();
			}

			// Numeric range/exact steps: persist acceptance fields + validation status
			if (isNumericRangeStepWithBounds(stepData)) {
				const bounds = getNumericMeasurementBounds(stepData);
				if (stepData.multipleMeasurements) {
					const valuesWithValidation = measurements.map(m => {
						const value = parseFloat(m.value);
						if (!isNaN(value) && bounds) {
							const validationStatus = validateMeasurementRange(value, bounds.min, bounds.max);
							return {
								value: m.value,
								minimumAcceptanceValue: stepData.minimumAcceptanceValue,
								maximumAcceptanceValue: stepData.maximumAcceptanceValue,
								validationStatus: validationStatus
							};
						}
						return {
							value: m.value,
							minimumAcceptanceValue: stepData.minimumAcceptanceValue,
							maximumAcceptanceValue: stepData.maximumAcceptanceValue
						};
					});
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(formDataToSubmit as any).data = valuesWithValidation;
				} else {
					const value = parseFloat(String(formData.value));
					if (!isNaN(value) && bounds) {
						const validationStatus = validateMeasurementRange(value, bounds.min, bounds.max);
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(formDataToSubmit as any).minimumAcceptanceValue = stepData.minimumAcceptanceValue;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(formDataToSubmit as any).maximumAcceptanceValue = stepData.maximumAcceptanceValue;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(formDataToSubmit as any).validationStatus = validationStatus;
					}
				}
			}

			onStepComplete(formDataToSubmit);
		}
	};

	const renderInput = () => {
		if (stepData.targetValueType === 'table' && stepData.tableConfig && tableData) {
			const tc = stepData.tableConfig;
			return (
				<Box sx={{ overflowX: 'auto' }}>
					<Box
						component="table"
						sx={{
							width: '100%',
							borderCollapse: 'collapse',
							'& th, & td': { border: '1px solid #e0e0e0', p: 1, textAlign: 'left', fontSize: '0.875rem' },
							'& th': { backgroundColor: '#f5f5f5', fontWeight: 600 }
						}}
					>
						<thead>
							<tr>
								{tc.columns.map(col => (
									<th key={col.name}>
										{col.name}
										<Typography variant="caption" sx={{ display: 'block', color: '#999', fontWeight: 400 }}>
											{col.type}
										</Typography>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{tableData.map((row, rowIdx) => (
								<tr key={rowIdx}>
									{tc.columns.map(col => {
										const rowConfig = tc.rows[rowIdx];
										const cellConfig = rowConfig?.cells[col.name];
										const cellValue = row[col.name] || '';
										const isCellReadOnly = cellConfig?.readOnly || isReadOnly;

										if (isCellReadOnly) {
											return (
												<td key={col.name} style={{ backgroundColor: '#f9f9f9' }}>
													<Typography variant="body2" sx={{ color: '#333' }}>
														{cellValue || '-'}
													</Typography>
												</td>
											);
										}

										if (col.type === 'ok/not ok') {
											return (
												<td key={col.name}>
													<RadioGroup
														row
														value={cellValue}
														onChange={e => handleTableCellChange(rowIdx, col.name, e.target.value)}
														sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
													>
														<FormControlLabel value="ok" control={<Radio size="small" />} label="OK" />
														<FormControlLabel value="not ok" control={<Radio size="small" color="warning" />} label={OK_NOT_OK_NEGATIVE_LABEL} />
													</RadioGroup>
													{errors[`table_${rowIdx}_${col.name}`] && (
														<Typography variant="caption" color="error">
															{errors[`table_${rowIdx}_${col.name}`]}
														</Typography>
													)}
												</td>
											);
										}

										if (col.type === 'date') {
											return (
												<td key={col.name}>
													<OperationalDatePicker
														value={cellValue ? dayjs(cellValue) : null}
														onChange={newValue => {
															const formatted = formatDateColumnStorageValue(newValue);
															handleTableCellChange(rowIdx, col.name, formatted);
														}}
														slotProps={{
															textField: {
																size: 'small',
																fullWidth: true,
																variant: 'outlined',
																error: !!errors[`table_${rowIdx}_${col.name}`],
																helperText: errors[`table_${rowIdx}_${col.name}`],
																sx: { '& .MuiOutlinedInput-root': { borderRadius: '4px' } }
															}
														}}
													/>
												</td>
											);
										}

										if (col.type === 'datetime') {
											return (
												<td key={col.name}>
													<OperationalDateTimePicker
														value={cellValue ? dayjs(cellValue) : null}
														onChange={newValue => {
															const formatted = newValue ? newValue.format('YYYY-MM-DDTHH:mm') : '';
															handleTableCellChange(rowIdx, col.name, formatted);
														}}
														slotProps={{
															textField: {
																size: 'small',
																fullWidth: true,
																variant: 'outlined',
																error: !!errors[`table_${rowIdx}_${col.name}`],
																helperText: errors[`table_${rowIdx}_${col.name}`],
																sx: { '& .MuiOutlinedInput-root': { borderRadius: '4px' } }
															}
														}}
													/>
												</td>
											);
										}

										if (col.type === 'shift') {
											return (
												<td key={col.name}>
													<TextField
														select
														size="small"
														fullWidth
														value={cellValue}
														onChange={e => handleTableCellChange(rowIdx, col.name, e.target.value)}
														error={!!errors[`table_${rowIdx}_${col.name}`]}
														helperText={errors[`table_${rowIdx}_${col.name}`]}
														sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
													>
														{SHIFT_OPTIONS.map(option => (
															<MenuItem key={option} value={option}>
																{option}
															</MenuItem>
														))}
													</TextField>
												</td>
											);
										}

										if (col.type === 'workstation') {
											return (
												<td key={col.name}>
													<TextField
														select
														size="small"
														fullWidth
														value={cellValue}
														onChange={e => handleTableCellChange(rowIdx, col.name, e.target.value)}
														error={!!errors[`table_${rowIdx}_${col.name}`]}
														helperText={
															errors[`table_${rowIdx}_${col.name}`] ||
															(!plantCode ? 'No plant configured' : undefined)
														}
														disabled={isReadOnly || !plantCode}
														sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
													>
														{workstationOptions.map(option => (
															<MenuItem key={String(option.value)} value={String(option.value)}>
																{option.label}
															</MenuItem>
														))}
													</TextField>
												</td>
											);
										}

										return (
											<td key={col.name}>
												<TextField
													size="small"
													fullWidth
													type={col.type === 'number' ? 'number' : 'text'}
													value={cellValue}
													onChange={e => handleTableCellChange(rowIdx, col.name, e.target.value)}
													error={!!errors[`table_${rowIdx}_${col.name}`]}
													helperText={errors[`table_${rowIdx}_${col.name}`]}
													sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
												/>
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</Box>
				</Box>
			);
		}

		if (stepData.targetValueType === 'ok/not ok') {
			const selectedValue = getOkNotOkValue(formData.value);
			return (
				<FormControl component="fieldset" disabled={isReadOnly} fullWidth sx={{ width: '100%' }}>
					<FormLabel component="legend" sx={{ fontSize: '0.875rem', color: '#666', mb: 1 }}>
						Select Result
					</FormLabel>
					<RadioGroup
						row
						value={selectedValue}
						onChange={e => handleValueChange(e.target.value)}
						sx={{ gap: 2 }}
					>
						<FormControlLabel
							value="ok"
							control={<Radio size="small" color="success" />}
							label="OK"
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: '0.875rem',
									color: selectedValue === 'ok' ? '#2e7d32' : '#666'
								}
							}}
						/>
						<FormControlLabel
							value="not ok"
							control={<Radio size="small" color="warning" />}
							label={OK_NOT_OK_NEGATIVE_LABEL}
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: '0.875rem',
									color: selectedValue === 'not ok' ? '#ed6c02' : '#666'
								}
							}}
						/>
					</RadioGroup>
					{selectedValue === 'not ok' && (
						<TextField
							fullWidth
							multiline
							rows={3}
							label="Comments"
							placeholder={`Enter comments for ${OK_NOT_OK_NEGATIVE_LABEL}`}
							value={typeof formData.notOkComment === 'string' ? formData.notOkComment : ''}
							onChange={e => handleNotOkCommentChange(e.target.value)}
							error={!!errors.notOkComment}
							helperText={errors.notOkComment || `Required when ${OK_NOT_OK_NEGATIVE_LABEL} is selected`}
							sx={{ mt: 1.5 }}
							disabled={isReadOnly}
							required
						/>
					)}
				</FormControl>
			);
		}

		if (stepData.multipleMeasurements) {
			const fixedN =
				stepData.multipleMeasurementMaxCount && stepData.multipleMeasurementMaxCount > 0
					? stepData.multipleMeasurementMaxCount
					: null;
			const maxCount = fixedN ?? stepData.multipleMeasurementMaxCount ?? 10;
			const showMeasurementBoundsUi = isNumericRangeStepWithBounds(stepData);
			const resolvedBounds = getNumericMeasurementBounds(stepData);
			const isExactStep = isExactTargetValueType(stepData.targetValueType);
			const specMin = parseOptionalNumber(stepData.minValue);
			const specMax = parseOptionalNumber(stepData.maxValue);
			const numberInputProps =
				showMeasurementBoundsUi && resolvedBounds
					? isExactStep
						? { step: 0.01 }
						: { min: resolvedBounds.min, max: resolvedBounds.max, step: 0.01 }
					: {
							min: specMin ?? 0,
							...(specMax !== null ? { max: specMax } : {}),
							step: 0.01
						};
			const ackLabelText = isExactStep
				? 'I acknowledge the deviation from the exact target value'
				: 'I acknowledge that the measurement value is outside the acceptable range';

			return (
				<Box>
					<Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#666' }}>
						{fixedN
							? `Multiple Measurements (${fixedN} required)`
							: `Multiple Measurements (Max ${maxCount} allowed)`}
					</Typography>
					{errors.measurements_count && (
						<Alert severity="error" sx={{ mb: 1 }}>
							{errors.measurements_count}
						</Alert>
					)}
					{!fixedN && measurements.length < maxCount && !isReadOnly && (
						<Box sx={{ mb: 1.5 }}>
							<Button startIcon={<Add />} onClick={addMeasurement} variant="outlined" size="small">
								Add Measurement ({measurements.length}/{maxCount})
							</Button>
						</Box>
					)}
					{measurements.map((measurement, index) => {
						const validationStatus =
							showMeasurementBoundsUi && measurement.value ? getValidationStatus(measurement.value) : null;
						const showAcknowledgment = validationStatus && validationStatus !== 'Accepted';
						const measuredNum = measurement.value ? parseFloat(measurement.value) : NaN;
						const validationChipCtx =
							isExactStep && resolvedBounds && !Number.isNaN(measuredNum)
								? { isExact: true as const, measured: measuredNum, target: resolvedBounds.min }
								: undefined;

						return (
							<Box key={measurement.id} sx={{ mb: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
									<Typography variant="body2" sx={{ minWidth: '60px' }}>
										{index + 1}:
									</Typography>
									<TextField
										size="small"
										type="number"
										value={measurement.value}
										onChange={e => handleMeasurementChange(measurement.id, e.target.value)}
										error={!!errors[`measurement_${measurement.id}`]}
										helperText={errors[`measurement_${measurement.id}`]}
										sx={{ flex: 1 }}
										inputProps={numberInputProps}
										disabled={isReadOnly}
									/>
									{stepData.uom && stepData.uom !== 'None' && (
										<Typography variant="body2" sx={{ color: '#666', minWidth: '40px' }}>
											{stepData.uom}
										</Typography>
									)}
									{!fixedN && measurements.length > 1 && !isReadOnly && (
										<IconButton onClick={() => removeMeasurement(measurement.id)} color="error" size="small">
											<Delete />
										</IconButton>
									)}
								</Box>

								{/* Range Display and Validation */}
								{showMeasurementBoundsUi &&
									measurement.value &&
									validationStatus &&
									validationStatus !== null && (
									<Paper
										elevation={0}
										sx={{
											mt: 2,
											ml: 8,
											p: 2,
											backgroundColor: getValidationBackgroundColor(validationStatus),
											border: `1px solid ${getValidationBorderColor(validationStatus)}`,
											borderRadius: 2
										}}
									>
										<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
												{getValidationIcon(validationStatus)}
												<Box>
													<Typography variant="body2" color="text.secondary">
														{isExactStep ? 'Exact target' : 'Acceptance range'}
													</Typography>
													<Typography variant="h6" sx={{ fontWeight: 600 }}>
														{resolvedBounds
															? isExactStep
																? `${resolvedBounds.min} ${stepData.uom || ''}`.trim()
																: `${resolvedBounds.min} - ${resolvedBounds.max} ${stepData.uom || ''}`.trim()
															: ''}
													</Typography>
												</Box>
											</Box>
											{getValidationChip(validationStatus, validationChipCtx)}
										</Box>
									</Paper>
								)}

								{/* Acknowledgment checkbox for out-of-range values */}
								{showAcknowledgment && !isReadOnly && (
									<Box sx={{ mt: 2, ml: 8 }}>
										<FormControlLabel
											control={
												<Checkbox
													checked={acknowledgments[`measurement_${measurement.id}`] || false}
													onChange={e => handleAcknowledgmentChange(`measurement_${measurement.id}`, e.target.checked)}
													disabled={isReadOnly}
												/>
											}
											label={
												<Typography variant="body2" color="text.secondary">
													{ackLabelText}
												</Typography>
											}
										/>
										{errors[`measurement_${measurement.id}_acknowledge`] && (
											<Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
												{errors[`measurement_${measurement.id}_acknowledge`]}
											</Typography>
										)}
									</Box>
								)}
							</Box>
						);
					})}
				</Box>
			);
		}

		// Single value input
		const showMeasurementBoundsUiSingle = isNumericRangeStepWithBounds(stepData);
		const resolvedBoundsSingle = getNumericMeasurementBounds(stepData);
		const isExactStepSingle = isExactTargetValueType(stepData.targetValueType);
		const specMinSingle = parseOptionalNumber(stepData.minValue);
		const specMaxSingle = parseOptionalNumber(stepData.maxValue);
		const singleNumberInputProps =
			showMeasurementBoundsUiSingle && resolvedBoundsSingle
				? isExactStepSingle
					? { step: 0.01 }
					: { min: resolvedBoundsSingle.min, max: resolvedBoundsSingle.max, step: 0.01 }
				: {
						min: specMinSingle ?? 0,
						...(specMaxSingle !== null ? { max: specMaxSingle } : {}),
						step: 0.01
					};
		const validationStatus =
			showMeasurementBoundsUiSingle &&
			formData.value &&
			(typeof formData.value === 'string' || typeof formData.value === 'number')
				? getValidationStatus(formData.value)
				: null;
		const showAcknowledgment = validationStatus && validationStatus !== 'Accepted';
		const measuredNumSingle =
			formData.value === '' || formData.value === undefined || formData.value === null
				? NaN
				: parseFloat(String(formData.value));
		const validationChipCtxSingle =
			isExactStepSingle && resolvedBoundsSingle && !Number.isNaN(measuredNumSingle)
				? { isExact: true as const, measured: measuredNumSingle, target: resolvedBoundsSingle.min }
				: undefined;
		const singleAckLabelText = isExactStepSingle
			? 'I acknowledge the deviation from the exact target value'
			: 'I acknowledge that the measurement value is outside the acceptable range';

		return (
			<Box>
				<TextField
					label="Value"
					type="number"
					value={formData.value || ''}
					onChange={e => handleValueChange(e.target.value)}
					error={!!errors.value}
					helperText={errors.value}
					fullWidth
					inputProps={singleNumberInputProps}
					disabled={isReadOnly}
				/>
				{stepData.uom && stepData.uom !== 'None' && (
					<Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
						Unit: {stepData.uom}
					</Typography>
				)}

				{/* Range Display and Validation */}
				{showMeasurementBoundsUiSingle && formData.value && validationStatus !== null ? (
					<Paper
						elevation={0}
						sx={{
							mt: 2,
							p: 2,
							backgroundColor: getValidationBackgroundColor(validationStatus as 'Accepted' | 'Lesser' | 'Greater'),
							border: `1px solid ${getValidationBorderColor(validationStatus as 'Accepted' | 'Lesser' | 'Greater')}`,
							borderRadius: 2
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								{getValidationIcon(validationStatus as 'Accepted' | 'Lesser' | 'Greater')}
								<Box>
									<Typography variant="body2" color="text.secondary">
										{isExactStepSingle ? 'Exact target' : 'Acceptance range'}
									</Typography>
									<Typography variant="h6" sx={{ fontWeight: 600 }}>
										{resolvedBoundsSingle
											? isExactStepSingle
												? `${resolvedBoundsSingle.min} ${stepData.uom || ''}`.trim()
												: `${resolvedBoundsSingle.min} - ${resolvedBoundsSingle.max} ${stepData.uom || ''}`.trim()
											: ''}
									</Typography>
								</Box>
							</Box>
							{getValidationChip(validationStatus as 'Accepted' | 'Lesser' | 'Greater', validationChipCtxSingle)}
						</Box>
					</Paper>
				) : null}

				{/* Acknowledgment checkbox for out-of-range values */}
				{showAcknowledgment && !isReadOnly && (
					<Box sx={{ mt: 2 }}>
						<FormControlLabel
							control={
								<Checkbox
									checked={acknowledgments.value || false}
									onChange={e => handleAcknowledgmentChange('value', e.target.checked)}
									disabled={isReadOnly}
								/>
							}
							label={
								<Typography variant="body2" color="text.secondary">
									{singleAckLabelText}
								</Typography>
							}
						/>
						{errors.value_acknowledge && (
							<Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
								{errors.value_acknowledge}
							</Typography>
						)}
					</Box>
				)}
			</Box>
		);
	};

	return (
		<Box sx={{ p: 2, backgroundColor: 'white' }}>
			{/* Compact Step Header */}
			<Box sx={{ mb: 2 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 0.5, lineHeight: 1.3 }}>
					{step.title}
				</Typography>
				{step.description && step.description !== step.title && (
					<Typography variant="body2" sx={{ color: '#666', mb: 1.5, fontSize: '0.875rem' }}>
						{step.description}
					</Typography>
				)}
			</Box>

			{/* Enhanced Step Details */}
			<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
				<Grid container spacing={1.5}>
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
							Target Value Type
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
							{stepData.targetValueType}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
							Evaluation Method
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
							{stepData.evaluationMethod}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
							UOM
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
							{stepData.uom || 'N/A'}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
							Step Number
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
							{stepData.stepNumber ?? '-'}
						</Typography>
					</Grid>
				</Grid>

				{/* Step Notes */}
				{stepData.notes && stepData.notes.trim() && (
					<Box sx={{ mt: 1.5, p: 1, backgroundColor: '#e3f2fd', borderRadius: 0.5, border: '1px solid #bbdefb' }}>
						<Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>
							Important Notes
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#1565c0', mt: 0.5 }}>
							{stepData.notes}
						</Typography>
					</Box>
				)}
			</Box>

			{/* Input Form */}
			<Box sx={{ mb: 2 }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 1.5, fontSize: '1rem' }}>
					{stepData.parameterDescription}
				</Typography>
				{renderInput()}
			</Box>

			{/* Responsible Person Section */}
			{stepData.getInstrumentId && (
				<Box sx={{ mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', fontSize: '1rem', mb: 1.5 }}>
						Instrument id
					</Typography>
					<TextField
						fullWidth
						label="Instrument id"
						value={instrumentId}
						onChange={e => handleInstrumentIdChange(e.target.value)}
						error={!!errors.instrumentId}
						helperText={errors.instrumentId}
						disabled={isReadOnly}
					/>
				</Box>
			)}

			{/* Responsible Person Section */}
			{stepData.responsiblePerson && (
				<Box sx={{ mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', fontSize: '1rem' }}>
							Responsible Person Details
						</Typography>
						{!isReadOnly && (
							<Button
								variant="outlined"
								size="small"
								startIcon={<Add />}
								onClick={addResponsiblePerson}
								sx={{
									borderColor: '#1976d2',
									color: '#1976d2',
									'&:hover': { borderColor: '#1565c0', backgroundColor: '#e3f2fd' }
								}}
							>
								Add Person
							</Button>
						)}
					</Box>
					{responsiblePersonData.map((person, index) => (
						<Box
							key={person.id}
							sx={{ mb: 2, p: 2, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #dee2e6' }}
						>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>
									Person {index + 1}
								</Typography>
								{!isReadOnly && responsiblePersonData.length > 1 && (
									<IconButton size="small" onClick={() => removeResponsiblePerson(person.id)} sx={{ color: '#dc3545' }}>
										<Delete fontSize="small" />
									</IconButton>
								)}
							</Box>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 4 }}>
									<FormControl fullWidth error={!!errors[`responsiblePerson_${person.id}_role`]}>
										<InputLabel>Role</InputLabel>
										<Select
											value={person.role}
											onChange={e => handleResponsiblePersonChange(person.id, 'role', e.target.value)}
											label="Role"
											disabled={isReadOnly}
										>
											<MenuItem value="l1">L1</MenuItem>
											<MenuItem value="l2">L2</MenuItem>
											<MenuItem value="l3">L3</MenuItem>
											<MenuItem value="l4">L4</MenuItem>
										</Select>
										{errors[`responsiblePerson_${person.id}_role`] && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors[`responsiblePerson_${person.id}_role`]}
											</Typography>
										)}
									</FormControl>
								</Grid>
								<Grid size={{ xs: 12, sm: 4 }}>
									<TextField
										fullWidth
										label="Employee Name"
										value={person.employeeName}
										onChange={e => handleResponsiblePersonChange(person.id, 'employeeName', e.target.value)}
										error={!!errors[`responsiblePerson_${person.id}_employeeName`]}
										helperText={errors[`responsiblePerson_${person.id}_employeeName`]}
										disabled={isReadOnly}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 4 }}>
									<TextField
										fullWidth
										label="Employee Code"
										value={person.employeeCode}
										onChange={e => handleResponsiblePersonChange(person.id, 'employeeCode', e.target.value)}
										error={!!errors[`responsiblePerson_${person.id}_employeeCode`]}
										helperText={errors[`responsiblePerson_${person.id}_employeeCode`]}
										disabled={isReadOnly}
									/>
								</Grid>
							</Grid>
						</Box>
					))}
				</Box>
			)}

			{/* CTQ Warning */}
			{step.ctq && getNumericMeasurementBounds(stepData) !== null && (
				<Alert severity="warning" sx={{ mb: 2, py: 1 }}>
					{isExactTargetValueType(stepData.targetValueType)
						? 'This is a Critical to Quality (CTQ) parameter. Deviations from the exact target may require supervisor approval.'
						: 'This is a Critical to Quality (CTQ) parameter. Values outside the acceptable range may require supervisor approval.'}
				</Alert>
			)}

			{/* Validation Alert */}
			{Object.keys(errors).length > 0 && (
				<Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} icon={<ErrorIcon />}>
					Please fill in all required fields with valid values and acknowledge any deviations or out-of-range values.
				</Alert>
			)}

			{/* Submit Button */}
			{!isReadOnly && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
					<Button
						variant="contained"
						onClick={handleSubmit}
						sx={{
							backgroundColor: '#1976d2',
							'&:hover': {
								backgroundColor: '#1565c0'
							}
						}}
					>
						Complete step
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default SequenceStep;
