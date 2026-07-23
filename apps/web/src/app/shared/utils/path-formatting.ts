interface LegTimes {
	departureTime: string
	arrivalTime: string
}

function parseMinutesOfDay(time: string): number {
	const [hours, minutes] = time.split(':').map(Number)
	return hours * 60 + minutes
}

export function formatFare(fare: number | undefined): string | null {
	return fare === undefined ? null : fare.toFixed(2).replace('.', ',')
}

export function legDurationMinutes(leg: LegTimes): number {
	const departure = parseMinutesOfDay(leg.departureTime)
	const arrival = parseMinutesOfDay(leg.arrivalTime)
	return arrival >= departure
		? arrival - departure
		: arrival + 24 * 60 - departure
}

export function transferCount(legs: LegTimes[]): number {
	return Math.max(legs.length - 1, 0)
}
