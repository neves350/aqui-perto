import { Injectable } from '@nestjs/common'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import { LineDetailResponseDto, LineResponseDto } from './dto/line-response.dto'

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
}