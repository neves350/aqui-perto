import { Injectable } from '@nestjs/common'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import {
	LineDetailResponseDto,
	LineResponseDto,
	LineRouteResponseDto,
} from './dto/line-response.dto'

@Injectable()
export class LinesService {
	constructor(private readonly carrisClientService: CarrisClientService) {}

	async search(query: string): Promise<LineResponseDto[]> {
		const lines = await this.carrisClientService.getLines()
		const normalizedQuery = query.toLowerCase()

		return lines
			.filter(
				(line) =>
					line.short_name.toLowerCase().includes(normalizedQuery) ||
					line.long_name.toLowerCase().includes(normalizedQuery),
			)
			.map((line) => ({
				id: line.id,
				shortName: line.short_name,
				longName: line.long_name,
				color: line.color,
				textColor: line.text_color,
			}))
	}

	async findById(id: string): Promise<LineDetailResponseDto | null> {
		const line = await this.carrisClientService.getLineById(id)
		if (!line) return null

		const patterns = await Promise.all(
			line.pattern_ids.map((patternId) =>
				this.carrisClientService.getPattern(patternId),
			),
		)

		return {
			id: line.id,
			shortName: line.short_name,
			longName: line.long_name,
			color: line.color,
			textColor: line.text_color,
			patterns: patterns
				.filter((pattern) => pattern !== null)
				.map((pattern) => ({
					id: pattern.id,
					headsign: pattern.headsign,
					directionId: pattern.direction_id,
					path: pattern.path.map((stop) => ({
						stopId: stop.stop_id,
						sequence: stop.stop_sequence,
					})),
					trips: pattern.trips.map((trip) => ({
						tripIds: trip.trip_ids,
						schedule: trip.schedule.map((stop) => ({
							stopId: stop.stop_id,
							sequence: stop.stop_sequence,
							arrivalTime: stop.arrival_time,
						})),
					})),
				})),
		}
	}

	async getRouteDetail(id: string): Promise<LineRouteResponseDto | null> {
		const line = await this.carrisClientService.getLineById(id)
		if (!line) return null

		const patternId = line.pattern_ids[0]
		const pattern = patternId
			? await this.carrisClientService.getPattern(patternId)
			: null
		if (!pattern) return null

		const stops = await this.carrisClientService.getStops()
		const stopById = new Map(stops.map((stop) => [stop.id, stop]))

		const now = new Date()
		const today = this.formatAsYyyymmdd(now)
		const tripGroupsToday = pattern.trips.filter((trip) =>
			trip.valid_on.includes(today),
		)
		const arrivalTimesByStopId = new Map<string, string[]>()
		for (const tripGroup of tripGroupsToday) {
			for (const entry of tripGroup.schedule) {
				const times = arrivalTimesByStopId.get(entry.stop_id)
				if (times) {
					times.push(entry.arrival_time)
				} else {
					arrivalTimesByStopId.set(entry.stop_id, [entry.arrival_time])
				}
			}
		}

		return {
			id: line.id,
			shortName: line.short_name,
			longName: line.long_name,
			color: line.color,
			textColor: line.text_color,
			stops: [...pattern.path]
				.sort((a, b) => a.stop_sequence - b.stop_sequence)
				.map((pathStop) => {
					const stop = stopById.get(pathStop.stop_id)
					const nextArrival = this.findNextArrival(
						arrivalTimesByStopId.get(pathStop.stop_id) ?? [],
						now,
					)

					return {
						stopId: pathStop.stop_id,
						name: stop?.long_name ?? '',
						sequence: pathStop.stop_sequence,
						lat: stop?.lat ?? 0,
						lon: stop?.lon ?? 0,
						minutesUntilArrival: nextArrival
							? Math.round((nextArrival.date.getTime() - now.getTime()) / 60_000)
							: null,
						scheduledArrival: nextArrival ? nextArrival.time.slice(0, 5) : null,
					}
				}),
		}
	}

	private findNextArrival(
		arrivalTimes: string[],
		now: Date,
	): { time: string; date: Date } | null {
		return (
			arrivalTimes
				.map((time) => ({ time, date: this.toTodayDate(time, now) }))
				.filter((candidate) => candidate.date.getTime() >= now.getTime())
				.sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null
		)
	}

	private formatAsYyyymmdd(date: Date): string {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}${month}${day}`
	}

	private toTodayDate(arrivalTime: string, reference: Date): Date {
		const [hours, minutes, seconds] = arrivalTime.split(':').map(Number)
		const date = new Date(reference)
		date.setHours(hours, minutes, seconds, 0)
		return date
	}
}
