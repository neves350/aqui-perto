import { Injectable } from '@nestjs/common'
import { isAxiosError } from 'axios'
import { CarrisLine, CarrisPattern } from 'src/common/types/carris.types'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'

const PATTERN_CACHE_TTL_MS = 30 * 60 * 1000
const PATTERN_FETCH_CONCURRENCY = 5
const RATE_LIMIT_RETRIES = 3
const RATE_LIMIT_DEFAULT_BACKOFF_MS = 2000

@Injectable()
export class CarrisPatternRepository {
	private patternsCache = new Map<
		string,
		{ data: CarrisPattern; fetchedAt: number }
	>()

	constructor(private readonly carrisClientService: CarrisClientService) {}

	async getPatternsForLine(line: CarrisLine): Promise<CarrisPattern[]> {
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
	async warmPatternCache(patternIds: string[]): Promise<void> {
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
}
