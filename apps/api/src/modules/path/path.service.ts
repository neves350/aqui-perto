import { Injectable } from '@nestjs/common'
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
import { PathLegDto, PathResultDto } from './dto/path-response.dto'
import { getEstimatedFare } from './fare.const'

const MIN_TRANSFER_MINUTES = 2
const PATTERN_CACHE_TTL_MS = 30 * 60 * 1000

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
		const linePatterns = await Promise.all(
			lines.map(async (line) => ({
				line,
				patterns: await this.getPatternsForLine(line),
			})),
		)

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

		const stopIdsByLineId = new Map(
			linePatterns.map(({ line, patterns }) => [
				line.id,
				this.collectStopIds(patterns),
			]),
		)

		for (const { line: lineA, patterns: patternsA } of linePatterns) {
			const stopsA = stopIdsByLineId.get(lineA.id) ?? new Set<string>()

			for (const { line: lineB, patterns: patternsB } of linePatterns) {
				if (lineA.id === lineB.id) continue
				const stopsB = stopIdsByLineId.get(lineB.id) ?? new Set<string>()

				const transferStopIds = [...stopsA].filter((stopId) =>
					stopsB.has(stopId),
				)

				for (const transferStopId of transferStopIds) {
					const legATrip = this.findEarliestTrip(
						patternsA,
						originStopId,
						transferStopId,
						dateStr,
						referenceTime,
					)
					if (!legATrip) continue

					const legBNotBefore = this.addMinutes(
						legATrip.arrival,
						MIN_TRANSFER_MINUTES,
					)
					const legBTrip = this.findEarliestTrip(
						patternsB,
						transferStopId,
						destinationStopId,
						dateStr,
						legBNotBefore,
					)
					if (!legBTrip) continue

					candidates.push({
						legs: [
							{
								line: lineA,
								originStopId,
								destinationStopId: transferStopId,
								trip: legATrip,
							},
							{
								line: lineB,
								originStopId: transferStopId,
								destinationStopId,
								trip: legBTrip,
							},
						],
						totalMinutes: this.diffMinutes(
							legBTrip.arrival,
							legATrip.departure,
						),
					})
				}
			}
		}

		if (candidates.length === 0) {
			return { found: false, reason: 'no-0-1-transfer-combination' }
		}

		const best = candidates.reduce((fastest, candidate) =>
			candidate.totalMinutes < fastest.totalMinutes ? candidate : fastest,
		)

		return {
			found: true,
			legs: best.legs.map((leg) => this.toLegDto(leg)),
			totalTimeMinutes: best.totalMinutes,
			estimatedFare: this.estimateFare(best.legs),
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

	private async getCachedPattern(
		patternId: string,
	): Promise<CarrisPattern | null> {
		const cached = this.patternsCache.get(patternId)
		if (cached && Date.now() - cached.fetchedAt < PATTERN_CACHE_TTL_MS) {
			return cached.data
		}

		const pattern = await this.carrisClientService.getPattern(patternId)
		if (pattern) {
			this.patternsCache.set(patternId, {
				data: pattern,
				fetchedAt: Date.now(),
			})
		}
		return pattern
	}

	private collectStopIds(patterns: CarrisPattern[]): Set<string> {
		const stopIds = new Set<string>()
		for (const pattern of patterns) {
			for (const stop of pattern.path) {
				stopIds.add(stop.stop_id)
			}
		}
		return stopIds
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
