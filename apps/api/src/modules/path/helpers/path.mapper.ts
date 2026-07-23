import { PathLegDto, PathOptionDto } from '../dto/path-response.dto'
import { getEstimatedFare } from '../fare.const'
import { LegCandidate, PathCandidate } from './path-search.types'

export function toOptionDto(candidate: PathCandidate): PathOptionDto {
	return {
		legs: candidate.legs.map((leg) => toLegDto(leg)),
		totalTimeMinutes: candidate.totalMinutes,
		estimatedFare: estimateFare(candidate.legs),
	}
}

export function estimateFare(legs: LegCandidate[]): number | undefined {
	let total = 0
	for (const leg of legs) {
		const fare = getEstimatedFare(leg.line)
		if (fare === null) return undefined
		total += fare
	}
	return Math.round(total * 100) / 100
}

export function toLegDto(leg: LegCandidate): PathLegDto {
	return {
		lineId: leg.line.id,
		lineName: `${leg.line.short_name} ${leg.line.long_name}`,
		originStopId: leg.originStopId,
		destinationStopId: leg.destinationStopId,
		departureTime: formatClock(leg.trip.departure),
		arrivalTime: formatClock(leg.trip.arrival),
	}
}

export function formatClock(date: Date): string {
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')
	return `${hours}:${minutes}`
}
