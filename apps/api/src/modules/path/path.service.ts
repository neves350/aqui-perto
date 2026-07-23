import { Injectable } from '@nestjs/common'
import { formatAsYyyymmdd } from 'src/common/utils/gtfs-time'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import { PathResultDto } from './dto/path-response.dto'
import { CarrisPatternRepository } from './helpers/carris-pattern.repository'
import { toOptionDto } from './helpers/path.mapper'
import {
	buildStopToLineIds,
	dedupeBySequence,
	findDirectCandidates,
	findOneTransferCandidatesAndSeeds,
	findTwoTransferCandidates,
} from './helpers/path-finder'
import { LinePatterns, SearchContext } from './helpers/path-search.types'

const MAX_RESULTS = 5

@Injectable()
export class PathService {
	constructor(
		private readonly carrisClientService: CarrisClientService,
		private readonly carrisPatternRepository: CarrisPatternRepository,
	) {}

	async findPath(
		originStopId: string,
		destinationStopId: string,
		departureTime?: Date,
	): Promise<PathResultDto> {
		const referenceTime = departureTime ?? new Date()
		const dateStr = formatAsYyyymmdd(referenceTime)

		const linePatterns = await this.loadLinePatterns()
		const context: SearchContext = {
			linePatternsById: new Map(
				linePatterns.map((entry) => [entry.line.id, entry]),
			),
			stopsToLineIds: buildStopToLineIds(linePatterns),
			destinationStopId,
			dateStr,
		}

		const directCandidates = findDirectCandidates(
			linePatterns,
			originStopId,
			destinationStopId,
			dateStr,
			referenceTime,
		)

		const { candidates: oneTransferCandidates, seeds: twoLegSeeds } =
			findOneTransferCandidatesAndSeeds(
				linePatterns,
				context,
				originStopId,
				referenceTime,
			)

		const twoTransferCandidates = findTwoTransferCandidates(
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
		const topResults = dedupeBySequence(sorted).slice(0, MAX_RESULTS)

		return {
			found: true,
			results: topResults.map((candidate) => toOptionDto(candidate)),
		}
	}

	private async loadLinePatterns(): Promise<LinePatterns[]> {
		const lines = await this.carrisClientService.getLines()
		const uniquePatternIds = [
			...new Set(lines.flatMap((line) => line.pattern_ids)),
		]
		await this.carrisPatternRepository.warmPatternCache(uniquePatternIds)

		return Promise.all(
			lines.map(async (line) => ({
				line,
				patterns: await this.carrisPatternRepository.getPatternsForLine(line),
			})),
		)
	}
}
