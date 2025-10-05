async function downloadFile(blob: Blob, fileName: string) {
	if (!(blob instanceof Blob)) {
		throw new Error('Corrupted data received');
	}

	const url = URL.createObjectURL(blob);
	const downloadLink = document.createElement('a');
	downloadLink.href = url;
	downloadLink.download = fileName;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
	URL.revokeObjectURL(url);
}

export default downloadFile;
