export function dateFormater(date: Date | null | undefined, separator: string) {
	if (date) {
		let day: string | number = date?.getDate();
		// add +1 to month because getMonth() returns month from 0 to 11
		let month: string | number = date?.getMonth() + 1;
		const year = date?.getFullYear();

		// show date and month in two digits
		// if month is less than 10, add a 0 before it
		if (day < 10) {
			day = '0' + day.toString();
		}
		if (month < 10) {
			month = '0' + month.toString();
		}
		if (day && year && month && separator) return day + separator + month + separator + year;
		else return '';
	} else return '';
	// now we have day, month and year
	// use the separator to join them
}
