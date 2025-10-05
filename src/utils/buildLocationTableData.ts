import { LocationData } from '../store/api/business/merchandise/getProductByIdParser';

function buildLocationPaths(data: LocationData) {
	const { countries, zones, subzones, states, lgas } = data;

	const mapById = <T extends { id: number }>(arr: T[]): Record<number, T> => {
		return arr.reduce(
			(acc, item) => {
				acc[item.id] = item;
				return acc;
			},
			{} as Record<number, T>
		);
	};

	const countryMap = mapById(countries);
	const zoneMap = mapById(zones);
	const subzoneMap = mapById(subzones);
	const stateMap = mapById(states);

	const result = [];

	for (const lga of lgas) {
		const state = stateMap[lga.parentId];
		if (!state) continue;

		const subzone = subzoneMap[state.parentId];
		if (!subzone) continue;

		const zone = zoneMap[subzone.parentId];
		if (!zone) continue;

		const country = countryMap[zone.parentId];
		if (!country) continue;

		result.push({
			country: country.label.trim(),
			zone: zone.label.trim(),
			subzone: subzone.label.trim(),
			state: state.label.trim(),
			lga: lga.label.trim()
		});
	}

	return result;
}
export default buildLocationPaths;

export type ViewTableData = ReturnType<typeof buildLocationPaths>;
