export function getDirectionalLongName(
	longName: string,
	headsign: string,
): string {
	const parts = longName.split(' - ')
	if (parts.length !== 2 || parts.some((part) => part.trim() === '')) {
		return longName
	}
	if (/via|circular/i.test(longName)) {
		return longName
	}

	const [first, second] = parts
	if (headsign.trim() === second.trim()) return longName
	if (headsign.trim() === first.trim()) return `${second} - ${first}`
	return longName
}
