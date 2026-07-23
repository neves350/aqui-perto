import {
	CarrisPattern,
	CarrisPatternTripGroup,
} from 'src/common/types/carris.types'
import { toDateWithGtfsTime } from 'src/common/utils/gtfs-time'
import {
	LegCandidate,
	LinePatterns,
	PathCandidate,
	SearchContext,
	TripMatch,
	TwoLegSeed,
} from './path-search.types'

const MIN_TRANSFER_MINUTES = 2

// Round 0: direct routes (0 transfers).
export function findDirectCandidates(
	linePatterns: LinePatterns[],
	originStopId: string,
	destinationStopId: string,
	dateStr: string,
	referenceTime: Date,
): PathCandidate[] {
	const candidates: PathCandidate[] = []

	for (const { line, patterns } of linePatterns) {
		const trip = findEarliestTrip(
			patterns,
			originStopId,
			destinationStopId,
			dateStr,
			referenceTime,
		)
		if (!trip) continue

		candidates.push({
			legs: [{ line, originStopId, destinationStopId, trip }],
			totalMinutes: diffMinutes(trip.arrival, trip.departure),
		})
	}

	return candidates
}

// Round 1: 1-transfer routes, plus 2-leg seeds for Round 2.
export function findOneTransferCandidatesAndSeeds(
	linePatterns: LinePatterns[],
	context: SearchContext,
	originStopId: string,
	referenceTime: Date,
): { candidates: PathCandidate[]; seeds: TwoLegSeed[] } {
	const { linePatternsById, stopsToLineIds, destinationStopId, dateStr } =
		context
	const candidates: PathCandidate[] = []
	const seeds: TwoLegSeed[] = []

	for (const { line: lineA, patterns: patternsA } of linePatterns) {
		const transferStops = getReachableTransferStops(
			patternsA,
			originStopId,
			stopsToLineIds,
		)

		for (const stop1 of transferStops) {
			const legATrip = findEarliestTrip(
				patternsA,
				originStopId,
				stop1,
				dateStr,
				referenceTime,
			)
			if (!legATrip) continue

			const legA: LegCandidate = {
				line: lineA,
				originStopId,
				destinationStopId: stop1,
				trip: legATrip,
			}
			const notBefore = addMinutes(legATrip.arrival, MIN_TRANSFER_MINUTES)

			for (const lineBId of stopsToLineIds.get(stop1) ?? []) {
				if (lineBId === lineA.id) continue
				const lineBEntry = linePatternsById.get(lineBId)
				if (!lineBEntry) continue
				const { line: lineB, patterns: patternsB } = lineBEntry

				const legBToDestTrip = findEarliestTrip(
					patternsB,
					stop1,
					destinationStopId,
					dateStr,
					notBefore,
				)
				if (legBToDestTrip) {
					const legB: LegCandidate = {
						line: lineB,
						originStopId: stop1,
						destinationStopId,
						trip: legBToDestTrip,
					}
					candidates.push({
						legs: [legA, legB],
						totalMinutes: diffMinutes(
							legBToDestTrip.arrival,
							legATrip.departure,
						),
					})
				}

				const transferStops2 = getReachableTransferStops(
					patternsB,
					stop1,
					stopsToLineIds,
				)
				for (const stop2 of transferStops2) {
					const legBTrip = findEarliestTrip(
						patternsB,
						stop1,
						stop2,
						dateStr,
						notBefore,
					)
					if (!legBTrip) continue

					seeds.push({
						legA,
						legB: {
							line: lineB,
							originStopId: stop1,
							destinationStopId: stop2,
							trip: legBTrip,
						},
					})
				}
			}
		}
	}

	return { candidates, seeds }
}

// Round 2: 2-transfer routes, extending the seeds collected in Round 1 with a 3rd leg.
export function findTwoTransferCandidates(
	seeds: TwoLegSeed[],
	context: SearchContext,
): PathCandidate[] {
	const { linePatternsById, stopsToLineIds, destinationStopId, dateStr } =
		context
	const candidates: PathCandidate[] = []

	for (const { legA, legB } of seeds) {
		const stop2 = legB.destinationStopId
		const notBefore = addMinutes(legB.trip.arrival, MIN_TRANSFER_MINUTES)

		for (const lineCId of stopsToLineIds.get(stop2) ?? []) {
			if (lineCId === legB.line.id) continue
			const lineCEntry = linePatternsById.get(lineCId)
			if (!lineCEntry) continue
			const { line: lineC, patterns: patternsC } = lineCEntry

			const legCTrip = findEarliestTrip(
				patternsC,
				stop2,
				destinationStopId,
				dateStr,
				notBefore,
			)
			if (!legCTrip) continue

			candidates.push({
				legs: [
					legA,
					legB,
					{
						line: lineC,
						originStopId: stop2,
						destinationStopId,
						trip: legCTrip,
					},
				],
				totalMinutes: diffMinutes(legCTrip.arrival, legA.trip.departure),
			})
		}
	}

	return candidates
}

// Only the earliest trip per Linha+Paragem is kept: an earlier arrival
// never yields a worse onward connection, so nothing is lost.

/** Stops reachable, in at least one pattern, after `afterStopId`, that are also served by another line. */
export function getReachableTransferStops(
	patterns: CarrisPattern[],
	afterStopId: string,
	stopsToLineIds: Map<string, Set<string>>,
): string[] {
	const result = new Set<string>()

	for (const pattern of patterns) {
		const afterEntry = pattern.path.find((s) => s.stop_id === afterStopId)
		if (!afterEntry) continue

		for (const stop of pattern.path) {
			if (stop.stop_sequence <= afterEntry.stop_sequence) continue
			const lineIds = stopsToLineIds.get(stop.stop_id)
			if (lineIds && lineIds.size > 1) {
				result.add(stop.stop_id)
			}
		}
	}

	return [...result]
}

export function buildStopToLineIds(
	linePatterns: LinePatterns[],
): Map<string, Set<string>> {
	const map = new Map<string, Set<string>>()

	for (const { line, patterns } of linePatterns) {
		for (const pattern of patterns) {
			for (const stop of pattern.path) {
				const lineIds = map.get(stop.stop_id) ?? new Set<string>()
				lineIds.add(line.id)
				map.set(stop.stop_id, lineIds)
			}
		}
	}

	return map
}

// Keeps the fastest candidate per distinct line sequence; input must be sorted ascending.
export function dedupeBySequence(candidates: PathCandidate[]): PathCandidate[] {
	const seen = new Set<string>()
	const result: PathCandidate[] = []

	for (const candidate of candidates) {
		const key = candidate.legs.map((leg) => leg.line.id).join('>')
		if (seen.has(key)) continue
		seen.add(key)
		result.push(candidate)
	}

	return result
}

export function findEarliestTrip(
	patterns: CarrisPattern[],
	fromStopId: string,
	toStopId: string,
	dateStr: string,
	notBefore: Date,
): TripMatch | null {
	let best: TripMatch | null = null

	for (const pattern of patterns) {
		const fromEntry = pattern.path.find((stop) => stop.stop_id === fromStopId)
		const toEntry = pattern.path.find((stop) => stop.stop_id === toStopId)
		if (!fromEntry || !toEntry) continue
		if (fromEntry.stop_sequence >= toEntry.stop_sequence) continue

		for (const tripGroup of pattern.trips) {
			const match = matchTripGroup(
				tripGroup,
				fromStopId,
				toStopId,
				dateStr,
				notBefore,
			)
			if (
				match &&
				(!best || match.departure.getTime() < best.departure.getTime())
			) {
				best = match
			}
		}
	}

	return best
}

export function matchTripGroup(
	tripGroup: CarrisPatternTripGroup,
	fromStopId: string,
	toStopId: string,
	dateStr: string,
	notBefore: Date,
): TripMatch | null {
	if (!tripGroup.valid_on.includes(dateStr)) return null

	const fromEntry = tripGroup.schedule.find(
		(stop) => stop.stop_id === fromStopId,
	)
	const toEntry = tripGroup.schedule.find((stop) => stop.stop_id === toStopId)
	if (!fromEntry || !toEntry) return null

	const departure = toDateWithGtfsTime(notBefore, fromEntry.arrival_time)
	if (departure.getTime() < notBefore.getTime()) return null

	const arrival = toDateWithGtfsTime(notBefore, toEntry.arrival_time)
	return { departure, arrival }
}

export function diffMinutes(later: Date, earlier: Date): number {
	return Math.round((later.getTime() - earlier.getTime()) / 60_000)
}

export function addMinutes(date: Date, minutes: number): Date {
	return new Date(date.getTime() + minutes * 60_000)
}
