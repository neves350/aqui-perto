import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import {
	CarrisArrival,
	CarrisLine,
	CarrisPattern,
	CarrisStop,
} from 'src/common/types/carris.types'

const STATIC_CACHE_TTL_MS = 30 * 60 * 1000

@Injectable()
export class CarrisClientService {
	private readonly logger = new Logger(CarrisClientService.name)

	private stopsCache: { data: CarrisStop[]; fetchedAt: number } | null = null
	private linesCache: { data: CarrisLine[]; fetchedAt: number } | null = null

	constructor(private readonly httpService: HttpService) {}

	async getStops(): Promise<CarrisStop[]> {
		if (this.stopsCache && Date.now() - this.stopsCache.fetchedAt < STATIC_CACHE_TTL_MS) {
			return this.stopsCache.data
		}

		const { data } = await firstValueFrom(
			this.httpService.get<CarrisStop[]>('/stops'),
		)
		this.stopsCache = { data, fetchedAt: Date.now() }
		return data
	}

	async getStopById(id: string): Promise<CarrisStop | null> {
		const stops = await this.getStops()
		return stops.find((stop) => stop.id === id) ?? null
	}

	async getLines(): Promise<CarrisLine[]> {
		if (this.linesCache && Date.now() - this.linesCache.fetchedAt < STATIC_CACHE_TTL_MS) {
			return this.linesCache.data
		}

		const { data } = await firstValueFrom(
			this.httpService.get<CarrisLine[]>('/lines'),
		)
		this.linesCache = { data, fetchedAt: Date.now() }
		return data
	}

	async getLineById(id: string): Promise<CarrisLine | null> {
		const lines = await this.getLines()
		return lines.find((line) => line.id === id) ?? null
	}

	async getPattern(patternId: string): Promise<CarrisPattern | null> {
		const { data } = await firstValueFrom(
			this.httpService.get<CarrisPattern[]>(`/patterns/${patternId}`),
		)
		return data[0] ?? null
	}

	async getArrivalsByStop(stopId: string): Promise<CarrisArrival[]> {
		const { data } = await firstValueFrom(
			this.httpService.get<CarrisArrival[]>(`/arrivals/by_stop/${stopId}`),
		)
		return data
	}
}
