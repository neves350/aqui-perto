import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import {
	CarrisArrival,
	CarrisLine,
	CarrisPattern,
	CarrisShape,
	CarrisStop,
} from 'src/common/types/carris.types'

const STATIC_CACHE_TTL_MS = 30 * 60 * 1000

@Injectable()
export class CarrisClientService {
	private readonly logger = new Logger(CarrisClientService.name)

	private stopsCache = new Map<string, { data: CarrisStop[]; fetchedAt: number }>()
	private linesCache = new Map<string, { data: CarrisLine[]; fetchedAt: number }>()
	private shapesCache = new Map<string, { data: CarrisShape; fetchedAt: number }>()

	constructor(private readonly httpService: HttpService) {}

	private async getCached<T>(
		cache: Map<string, { data: T; fetchedAt: number }>,
		key: string,
		fetch: () => Promise<T>,
	): Promise<T> {
		const cached = cache.get(key)
		if (cached && Date.now() - cached.fetchedAt < STATIC_CACHE_TTL_MS) {
			return cached.data
		}

		const data = await fetch()
		cache.set(key, { data, fetchedAt: Date.now() })
		return data
	}

	async getStops(): Promise<CarrisStop[]> {
		return this.getCached(this.stopsCache, 'all', async () => {
			const { data } = await firstValueFrom(
				this.httpService.get<CarrisStop[]>('/stops'),
			)
			return data
		})
	}

	async getStopById(id: string): Promise<CarrisStop | null> {
		const stops = await this.getStops()
		return stops.find((stop) => stop.id === id) ?? null
	}

	async getLines(): Promise<CarrisLine[]> {
		return this.getCached(this.linesCache, 'all', async () => {
			const { data } = await firstValueFrom(
				this.httpService.get<CarrisLine[]>('/lines'),
			)
			return data
		})
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

	async getShape(shapeId: string): Promise<CarrisShape> {
		return this.getCached(this.shapesCache, shapeId, async () => {
			const { data } = await firstValueFrom(
				this.httpService.get<CarrisShape>(`/shapes/${shapeId}`),
			)
			return data
		})
	}

	async getArrivalsByStop(stopId: string): Promise<CarrisArrival[]> {
		const { data } = await firstValueFrom(
			this.httpService.get<CarrisArrival[]>(`/arrivals/by_stop/${stopId}`),
		)
		return data
	}
}
