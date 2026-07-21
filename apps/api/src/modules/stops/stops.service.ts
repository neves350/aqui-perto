import { Injectable } from '@nestjs/common'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import { StopResponseDto } from './dto/stop-response.dto'

const EARTH_RADIUS_METERS = 6371000

@Injectable()
export class StopsService {
	constructor(private readonly carrisClientService: CarrisClientService) {}

	async findNearby(
		lat: number,
		lon: number,
		radiusMeters = 400,
	): Promise<StopResponseDto[]> {
		const stops = await this.carrisClientService.getStops()

		return stops
			.map((stop) => ({
				id: stop.id,
				name: stop.long_name,
				lat: stop.lat,
				lon: stop.lon,
				distanceMeters: this.haversineDistance(lat, lon, stop.lat, stop.lon),
			}))
			.filter((stop) => stop.distanceMeters <= radiusMeters)
			.sort((a, b) => a.distanceMeters - b.distanceMeters)
	}

	async search(query: string): Promise<StopResponseDto[]> {
		const stops = await this.carrisClientService.getStops()
		const normalizedQuery = query.toLowerCase()

		return stops
			.filter((stop) => stop.long_name.toLowerCase().includes(normalizedQuery))
			.map((stop) => ({
				id: stop.id,
				name: stop.long_name,
				lat: stop.lat,
				lon: stop.lon,
			}))
	}

	async findById(id: string): Promise<StopResponseDto | null> {
		const stop = await this.carrisClientService.getStopById(id)
		if (!stop) return null

		return {
			id: stop.id,
			name: stop.long_name,
			lat: stop.lat,
			lon: stop.lon,
		}
	}

	private haversineDistance(
		lat1: number,
		lon1: number,
		lat2: number,
		lon2: number,
	): number {
		const toRad = (degrees: number) => (degrees * Math.PI) / 180

		const deltaLat = toRad(lat2 - lat1)
		const deltaLon = toRad(lon2 - lon1)

		const a =
			Math.sin(deltaLat / 2) ** 2 +
			Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

		return EARTH_RADIUS_METERS * c
	}
}
