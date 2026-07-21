import { Injectable } from '@nestjs/common'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import { ArrivalResponseDto } from './dto/arrival-response.dto'

const DEFAULT_LIMIT = 10

@Injectable()
export class ArrivalsService {
	constructor(private readonly carrisClientService: CarrisClientService) {}

	async getArrivalsForStop(
		stopId: string,
		limit = DEFAULT_LIMIT,
	): Promise<ArrivalResponseDto[]> {
		const [arrivals, lines] = await Promise.all([
			this.carrisClientService.getArrivalsByStop(stopId),
			this.carrisClientService.getLines(),
		])

		const lineShortNameById = new Map(
			lines.map((line) => [line.id, line.short_name]),
		)
		const nowUnix = Math.floor(Date.now() / 1000)

		return arrivals
			.filter(
				(arrival) =>
					arrival.scheduled_arrival_unix !== null &&
					arrival.scheduled_arrival_unix >= nowUnix,
			)
			.sort((a, b) => a.scheduled_arrival_unix! - b.scheduled_arrival_unix!)
			.slice(0, limit)
			.map((arrival) => {
				const shortName = lineShortNameById.get(arrival.line_id)
				return {
					tripId: arrival.trip_id,
					lineId: arrival.line_id,
					lineName: shortName
						? `${shortName} ${arrival.headsign}`
						: arrival.headsign,
					arrivalTime: arrival.scheduled_arrival!.slice(0, 5),
					type: 'scheduled' as const,
				}
			})
	}
}
