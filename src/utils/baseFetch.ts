async function baseFetch(endpoint: string, controller: AbortController, token: string) {
	const response = await fetch(`${process.env.API_BASE_URL}${endpoint}`, {
		signal: controller.signal,
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		throw new Error(`Download failed. Status: ${response.status}`);
	}
	return response;
}

export default baseFetch;
