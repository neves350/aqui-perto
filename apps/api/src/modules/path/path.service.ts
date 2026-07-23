import { Injectable } from '@nestjs/common'
import { isAxiosError } from 'axios'
import {
	CarrisLine,
	CarrisPattern,
	CarrisPatternTripGroup,
} from 'src/common/types/carris.types'
import {
	formatAsYyyymmdd,
	toDateWithGtfsTime,
} from 'src/common/utils/gtfs-time'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import {
	PathLegDto,
	PathOptionDto,
	PathResultDto,
} from './dto/path-response.dto'
import { getEstimatedFare } from './fare.const'

const MIN_TRANSFER_MINUTES = 2
const MAX_RESULTS = 5
const PATTERN_CACHE_TTL_MS = 30 * 60 * 1000
const PATTERN_FETCH_CONCURRENCY = 5
const RATE_LIMIT_RETRIES = 3
const RATE_LIMIT_DEFAULT_BACKOFF_MS = 2000

interface TripMatch {
	departure: Date
	arrival: Date
}

interface LegCandidate {
	line: CarrisLine
	originStopId: string
	destinationStopId: string
	trip: TripMatch
}

interface PathCandidate {
	legs: LegCandidate[]
	totalMinutes: number
}

interface LinePatterns {
	line: CarrisLine
	patterns: CarrisPattern[]
}

// Lookups shared by every round of the search.
interface SearchContext {
	linePatternsById: Map<string, LinePatterns>
	stopsToLineIds: Map<string, Set<string>>
	destinationStopId: string
	dateStr: string
}

// A 2-leg journey (origin -> ... -> transfer stop) used as the seed for a 3rd leg.
interface TwoLegSeed {
	legA: LegCandidate
	legB: LegCandidate
}

@Injectable()
export class PathService {
	private patternsCache = new Map<
		string,
		{ data: CarrisPattern; fetchedAt: number }
	>()

	constructor(private readonly carrisClientService: CarrisClientService) {}

	async findPath(
		originStopId: string,
		destinationStopId: string,
		departureTime?: Date,
	): Promise<PathResultDto> {
		const referenceTime = departureTime ?? new Date()
		const dateStr = formatAsYyyymmdd(referenceTime)

		const lines = await this.carrisClientService.getLines()
		const uniquePatternIds = [
			...new Set(lines.flatMap((line) => line.pattern_ids)),
		]
		await this.warmPatternCache(uniquePatternIds)

		const linePatterns = await Promise.all(
			lines.map(async (line) => ({
				line,
				patterns: await this.getPatternsForLine(line),
			})),
		)
		const context: SearchContext = {
			linePatternsById: new Map(
				linePatterns.map((entry) => [entry.line.id, entry]),
			),
			stopsToLineIds: this.buildStopToLineIds(linePatterns),
			destinationStopId,
			dateStr,
		}

		const directCandidates = this.findDirectCandidates(
			linePatterns,
			originStopId,
			destinationStopId,
			dateStr,
			referenceTime,
		)

		const { candidates: oneTransferCandidates, seeds: twoLegSeeds } =
			this.findOneTransferCandidatesAndSeeds(
				linePatterns,
				context,
				originStopId,
				referenceTime,
			)

		const twoTransferCandidates = this.findTwoTransferCandidates(
			twoLegSeeds,
			context,
		)

		const candidates = [
			...directCandidates,
			...oneTransferCandidates,
			...twoTransferCandidates,
		]

		if (candidates.length === 0) {
			return { found: false, reason: 'no-path-found' }
		}

		const sorted = [...candidates].sort(
			(a, b) => a.totalMinutes - b.totalMinutes,
		)
		const topResults = this.dedupeBySequence(sorted).slice(0, MAX_RESULTS)

		return {
			found: true,
			results: topResults.map((candidate) => this.toOptionDto(candidate)),
		}
	}

	// Round 0: direct routes (0 transfers).
	private findDirectCandidates(
		linePatterns: LinePatterns[],
		originStopId: string,
		destinationStopId: string,
		dateStr: string,
		referenceTime: Date,
	): PathCandidate[] {
		const candidates: PathCandidate[] = []

		for (const { line, patterns } of linePatterns) {
			const trip = this.findEarliestTrip(
				patterns,
				originStopId,
				destinationStopId,
				dateStr,
				referenceTime,
			)
			if (!trip) continue

			candidates.push({
				legs: [{ line, originStopId, destinationStopId, trip }],
				totalMinutes: this.diffMinutes(trip.arrival, trip.departure),
			})
		}

		return candidates
	}

	// Round 1: 1-transfer routes, plus 2-leg seeds for Round 2.
	private findOneTransferCandidatesAndSeeds(
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
			const transferStops = this.getReachableTransferStops(
				patternsA,
				originStopId,
				stopsToLineIds,
			)

			for (const stop1 of transferStops) {
				const legATrip = this.findEarliestTrip(
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
				const notBefore = this.addMinutes(
					legATrip.arrival,
					MIN_TRANSFER_MINUTES,
				)

				for (const lineBId of stopsToLineIds.get(stop1) ?? []) {
					if (lineBId === lineA.id) continue
					const lineBEntry = linePatternsById.get(lineBId)
					if (!lineBEntry) continue
					const { line: lineB, patterns: patternsB } = lineBEntry

					const legBToDestTrip = this.findEarliestTrip(
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
							totalMinutes: this.diffMinutes(
								legBToDestTrip.arrival,
								legATrip.departure,
							),
						})
					}

					const transferStops2 = this.getReachableTransferStops(
						patternsB,
						stop1,
						stopsToLineIds,
					)
					for (const stop2 of transferStops2) {
						const legBTrip = this.findEarliestTrip(
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
	private findTwoTransferCandidates(
		seeds: TwoLegSeed[],
		context: SearchContext,
	): PathCandidate[] {
		const { linePatternsById, stopsToLineIds, destinationStopId, dateStr } =
			context
		const candidates: PathCandidate[] = []

		for (const { legA, legB } of seeds) {
			const stop2 = legB.destinationStopId
			const notBefore = this.addMinutes(legB.trip.arrival, MIN_TRANSFER_MINUTES)

			for (const lineCId of stopsToLineIds.get(stop2) ?? []) {
				if (lineCId === legB.line.id) continue
				const lineCEntry = linePatternsById.get(lineCId)
				if (!lineCEntry) continue
				const { line: lineC, patterns: patternsC } = lineCEntry

				const legCTrip = this.findEarliestTrip(
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
					totalMinutes: this.diffMinutes(legCTrip.arrival, legA.trip.departure),
				})
			}
		}

		return candidates
	}

	// Only the earliest trip per Linha+Paragem is kept: an earlier arrival
	// never yields a worse onward connection, so nothing is lost.

	/** Stops reachable, in at least one pattern, after `afterStopId`, that are also served by another line. */
	private getReachableTransferStops(
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

	private buildStopToLineIds(
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
	private dedupeBySequence(candidates: PathCandidate[]): PathCandidate[] {
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

	private toOptionDto(candidate: PathCandidate): PathOptionDto {
		return {
			legs: candidate.legs.map((leg) => this.toLegDto(leg)),
			totalTimeMinutes: candidate.totalMinutes,
			estimatedFare: this.estimateFare(candidate.legs),
		}
	}

	private estimateFare(legs: LegCandidate[]): number | undefined {
		let total = 0
		for (const leg of legs) {
			const fare = getEstimatedFare(leg.line)
			if (fare === null) return undefined
			total += fare
		}
		return Math.round(total * 100) / 100
	}

	private async getPatternsForLine(line: CarrisLine): Promise<CarrisPattern[]> {
		const patterns = await Promise.all(
			line.pattern_ids.map((patternId) => this.getCachedPattern(patternId)),
		)
		return patterns.filter(
			(pattern): pattern is CarrisPattern => pattern !== null,
		)
	}

	// The Carris API rate-limits bursts of concurrent requests (Cloudflare 429).
	// Fetching every pattern up front, throttled, means the per-line/per-pair
	// lookups below always hit the in-memory cache instead of firing requests.
	private async warmPatternCache(patternIds: string[]): Promise<void> {
		let nextIndex = 0
		const worker = async () => {
			while (nextIndex < patternIds.length) {
				const patternId = patternIds[nextIndex++]
				await this.getCachedPattern(patternId)
			}
		}

		const workerCount = Math.min(PATTERN_FETCH_CONCURRENCY, patternIds.length)
		await Promise.all(Array.from({ length: workerCount }, worker))
	}

	private async getCachedPattern(
		patternId: string,
	): Promise<CarrisPattern | null> {
		const cached = this.patternsCache.get(patternId)
		if (cached && Date.now() - cached.fetchedAt < PATTERN_CACHE_TTL_MS) {
			return cached.data
		}

		const pattern = await this.fetchPatternWithRetry(patternId)
		if (pattern) {
			this.patternsCache.set(patternId, {
				data: pattern,
				fetchedAt: Date.now(),
			})
		}
		return pattern
	}

	private async fetchPatternWithRetry(
		patternId: string,
		attempt = 0,
	): Promise<CarrisPattern | null> {
		try {
			return await this.carrisClientService.getPattern(patternId)
		} catch (error) {
			const retryAfterMs = this.getRetryAfterMs(error)
			if (retryAfterMs === null || attempt >= RATE_LIMIT_RETRIES) throw error

			await this.delay(retryAfterMs)
			return this.fetchPatternWithRetry(patternId, attempt + 1)
		}
	}

	private getRetryAfterMs(error: unknown): number | null {
		if (!isAxiosError(error) || error.response?.status !== 429) return null

		const retryAfterHeader = error.response.headers?.['retry-after']
		const retryAfterSeconds = Number(retryAfterHeader)
		return Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
			? retryAfterSeconds * 1000
			: RATE_LIMIT_DEFAULT_BACKOFF_MS
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	private findEarliestTrip(
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
				const match = this.matchTripGroup(
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

	private matchTripGroup(
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

	private toLegDto(leg: LegCandidate): PathLegDto {
		return {
			lineId: leg.line.id,
			lineName: `${leg.line.short_name} ${leg.line.long_name}`,
			originStopId: leg.originStopId,
			destinationStopId: leg.destinationStopId,
			departureTime: this.formatClock(leg.trip.departure),
			arrivalTime: this.formatClock(leg.trip.arrival),
		}
	}

	private formatClock(date: Date): string {
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${hours}:${minutes}`
	}

	private diffMinutes(later: Date, earlier: Date): number {
		return Math.round((later.getTime() - earlier.getTime()) / 60_000)
	}

	private addMinutes(date: Date, minutes: number): Date {
		return new Date(date.getTime() + minutes * 60_000)
	}
}
