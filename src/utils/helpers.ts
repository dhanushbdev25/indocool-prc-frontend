import Swal from 'sweetalert2';

export const displayError = (error: unknown) => {
	if (error) {
		if (typeof error === 'object' && error !== null && 'data' in error) {
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text:
					(error as { data?: { message?: string; msg?: string } })?.data?.message ||
					(error as { data?: { message?: string; msg?: string } })?.data?.msg
			});
		} else {
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'An error occurred'
			});
		}
	}
};

export const formatDate = (date: Date) => {
	const options: Intl.DateTimeFormatOptions = {
		month: 'long',
		year: 'numeric'
	};

	return new Date(date).toLocaleString('en-US', options).replace(/\s/g, '');
};

type dateDiff = {
	displayText: string;
	severity: string;
};

export const isNull = (value: string | undefined | null) => {
	return typeof value === 'undefined' || value === '' || value === null;
};

export const dateDifferentiator = (claimDateFromDB: Date): dateDiff => {
	// Current date
	const currentDate = new Date();

	// Calculate the difference in milliseconds between the current date and claim date
	const timeDifference = currentDate.getTime() - claimDateFromDB.getTime();

	// Convert milliseconds to hours and days
	const hoursDifference = Math.floor(timeDifference / (1000 * 3600));
	const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

	let severity = 'low';
	let displayText = '';
	if (daysDifference < 1) {
		displayText = `${hoursDifference} ${hoursDifference === 1 ? 'hour' : 'hours'} ago`;
	} else {
		displayText = `${daysDifference} ${daysDifference === 1 ? 'day' : 'days'} ago`;
	}
	if (daysDifference > 2 && daysDifference < 8) {
		severity = 'medium';
	}
	if (daysDifference > 8) {
		severity = 'high';
	}

	return {
		displayText,
		severity
	};
};

export const addPrecisionToNumber = (value: number, precision: number): string => {
	if (typeof value !== 'number' || isNaN(value)) {
		return '0';
	}

	if (typeof precision !== 'number' || isNaN(precision) || !Number.isInteger(precision) || precision < 0) {
		throw new Error('Precision must be a non-negative integer.');
	}

	return value.toFixed(precision);
};

export const addPrecisionToInteger = (value: number, precision: number) => {
	if (typeof value !== 'number' || isNaN(value) || !Number.isInteger(value)) {
		return 0;
	}

	if (typeof precision !== 'number' || isNaN(precision) || !Number.isInteger(precision) || precision < 0) {
		throw new Error('Precision must be a non-negative integer.');
	}

	const stringValue = value.toString();
	const decimalPart = '0'.repeat(precision);
	const result = `${stringValue}.${decimalPart}`;
	return result;
};

export const formatCurrency = (value: number, locale = 'en-US', currency = 'USD') => {
	if (typeof value !== 'number' || isNaN(value) || !Number.isInteger(value) || value <= 0) {
		return '-';
	}

	const formattedCurrency = new Intl.NumberFormat(locale, {
		style: 'currency',
		currency
	}).format(value);

	return formattedCurrency;
};

export function truncateString(text: string, maxLength: number) {
	if (text.length <= maxLength) {
		return text;
	} else {
		return text.slice(0, maxLength) + '...';
	}
}

export function extractErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;

	if (
		typeof err === 'object' &&
		err !== null &&
		'data' in err &&
		typeof (err as { data?: { message?: string } }).data?.message === 'string'
	)
		return (err as { data: { message: string } }).data.message;

	return 'Something went wrong';
}
