import { Test, TestingModule } from '@nestjs/testing'
import { mockCarris } from 'src/__mocks__/carris.mock'
import { CarrisLine, CarrisPattern } from 'src/common/types/carris.types'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import { CarrisPatternRepository } from './helpers/carris-pattern.repository'
import { PathService } from './path.service'

function buildLine(overrides: Partial<CarrisLine>): CarrisLine {
	return {
		id: 'line-1',
		short_name: '1001',
		long_name: 'Test Line',
		color: '#3D85C6',
		text_color: '#FFFFFF',
		route_ids: [],
		pattern_ids: ['pattern-1'],
		...overrides,
	}
}

function buildPattern(overrides: Partial<CarrisPattern>): CarrisPattern {
	return {
		id: 'pattern-1',
		line_id: 'line-1',
		route_id: 'route-1',
		direction_id: 0,
		shape_id: 'shape-1',
		headsign: 'Destination',
		path: [],
		trips: [],
		...overrides,
	}
}

const TODAY = '20260723'
const REFERENCE_TIME = new Date('2026-07-23T08:00:00')

describe('PathService', () => {
	let service: PathService
	let patternsById: Record<string, CarrisPattern>

	beforeEach(async () => {
		jest.clearAllMocks()
		patternsById = {}

		mockCarris.getPattern.mockImplementation(
			async (patternId: string) => patternsById[patternId] ?? null,
		)

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PathService,
				CarrisPatternRepository,
				{ provide: CarrisClientService, useValue: mockCarris },
			],
		}).compile()

		service = module.get<PathService>(PathService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('findPath', () => {
		it('finds a direct route when one line covers origin and destination', async () => {
			const line = buildLine({ id: 'L1', pattern_ids: ['P1'] })
			patternsById.P1 = buildPattern({
				id: 'P1',
				line_id: 'L1',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'B', stop_sequence: 2, distance: 500 },
					{ stop_id: 'C', stop_sequence: 3, distance: 1000 },
				],
				trips: [
					{
						trip_ids: ['T1'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'B', stop_sequence: 2, arrival_time: '08:10:00' },
							{ stop_id: 'C', stop_sequence: 3, arrival_time: '08:20:00' },
						],
					},
				],
			})
			mockCarris.getLines.mockResolvedValue([line])

			const result = await service.findPath('A', 'C', REFERENCE_TIME)

			expect(result.found).toBe(true)
			expect(result.results).toHaveLength(1)
			const option = result.results?.[0]
			expect(option?.legs).toHaveLength(1)
			expect(option?.legs[0]).toMatchObject({
				lineId: 'L1',
				originStopId: 'A',
				destinationStopId: 'C',
				departureTime: '08:00',
				arrivalTime: '08:20',
			})
			expect(option?.totalTimeMinutes).toBe(20)
		})

		it('prefers a faster 1-transfer route over a slower direct route', async () => {
			const directLine = buildLine({ id: 'DIRECT', pattern_ids: ['PD'] })
			const legALine = buildLine({ id: 'LEGA', pattern_ids: ['PA'] })
			const legBLine = buildLine({ id: 'LEGB', pattern_ids: ['PB'] })

			patternsById.PD = buildPattern({
				id: 'PD',
				line_id: 'DIRECT',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'D', stop_sequence: 2, distance: 5000 },
				],
				trips: [
					{
						trip_ids: ['TD'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'D', stop_sequence: 2, arrival_time: '09:00:00' },
						],
					},
				],
			})
			patternsById.PA = buildPattern({
				id: 'PA',
				line_id: 'LEGA',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'B', stop_sequence: 2, distance: 500 },
				],
				trips: [
					{
						trip_ids: ['TA'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'B', stop_sequence: 2, arrival_time: '08:10:00' },
						],
					},
				],
			})
			patternsById.PB = buildPattern({
				id: 'PB',
				line_id: 'LEGB',
				path: [
					{ stop_id: 'B', stop_sequence: 1, distance: 0 },
					{ stop_id: 'D', stop_sequence: 2, distance: 500 },
				],
				trips: [
					{
						trip_ids: ['TB'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'B', stop_sequence: 1, arrival_time: '08:15:00' },
							{ stop_id: 'D', stop_sequence: 2, arrival_time: '08:30:00' },
						],
					},
				],
			})

			mockCarris.getLines.mockResolvedValue([directLine, legALine, legBLine])

			const result = await service.findPath('A', 'D', REFERENCE_TIME)

			expect(result.found).toBe(true)
			const fastest = result.results?.[0]
			expect(fastest?.totalTimeMinutes).toBe(30)
			expect(fastest?.legs).toHaveLength(2)
			expect(fastest?.legs[0]).toMatchObject({
				lineId: 'LEGA',
				originStopId: 'A',
				destinationStopId: 'B',
			})
			expect(fastest?.legs[1]).toMatchObject({
				lineId: 'LEGB',
				originStopId: 'B',
				destinationStopId: 'D',
			})
		})

		it('rejects a transfer that does not respect the minimum transfer margin', async () => {
			const legALine = buildLine({ id: 'LEGA', pattern_ids: ['PA'] })
			const legBLine = buildLine({ id: 'LEGB', pattern_ids: ['PB'] })

			patternsById.PA = buildPattern({
				id: 'PA',
				line_id: 'LEGA',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'B', stop_sequence: 2, distance: 500 },
				],
				trips: [
					{
						trip_ids: ['TA'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'B', stop_sequence: 2, arrival_time: '08:10:00' },
						],
					},
				],
			})
			patternsById.PB = buildPattern({
				id: 'PB',
				line_id: 'LEGB',
				path: [
					{ stop_id: 'B', stop_sequence: 1, distance: 0 },
					{ stop_id: 'D', stop_sequence: 2, distance: 500 },
				],
				trips: [
					{
						// departs only 1 minute after arrival at B (below the 2 min margin)
						trip_ids: ['TB-tight'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'B', stop_sequence: 1, arrival_time: '08:11:00' },
							{ stop_id: 'D', stop_sequence: 2, arrival_time: '08:20:00' },
						],
					},
					{
						// respects the margin
						trip_ids: ['TB-ok'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'B', stop_sequence: 1, arrival_time: '08:12:00' },
							{ stop_id: 'D', stop_sequence: 2, arrival_time: '08:25:00' },
						],
					},
				],
			})

			mockCarris.getLines.mockResolvedValue([legALine, legBLine])

			const result = await service.findPath('A', 'D', REFERENCE_TIME)

			expect(result.found).toBe(true)
			expect(result.results?.[0]?.legs[1]).toMatchObject({
				departureTime: '08:12',
				arrivalTime: '08:25',
			})
		})

		it('ignores trips not valid on the requested date', async () => {
			const line = buildLine({ id: 'L1', pattern_ids: ['P1'] })
			patternsById.P1 = buildPattern({
				id: 'P1',
				line_id: 'L1',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'C', stop_sequence: 2, distance: 1000 },
				],
				trips: [
					{
						trip_ids: ['T-other-day'],
						service_ids: ['S1'],
						valid_on: ['20260101'],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'C', stop_sequence: 2, arrival_time: '08:20:00' },
						],
					},
				],
			})
			mockCarris.getLines.mockResolvedValue([line])

			const result = await service.findPath('A', 'C', REFERENCE_TIME)

			expect(result.found).toBe(false)
			expect(result.reason).toBe('no-path-found')
		})

		it('ignores trips that already departed before the requested departure time', async () => {
			const line = buildLine({ id: 'L1', pattern_ids: ['P1'] })
			patternsById.P1 = buildPattern({
				id: 'P1',
				line_id: 'L1',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'C', stop_sequence: 2, distance: 1000 },
				],
				trips: [
					{
						trip_ids: ['T-past'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '07:00:00' },
							{ stop_id: 'C', stop_sequence: 2, arrival_time: '07:20:00' },
						],
					},
					{
						trip_ids: ['T-future'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:30:00' },
							{ stop_id: 'C', stop_sequence: 2, arrival_time: '08:50:00' },
						],
					},
				],
			})
			mockCarris.getLines.mockResolvedValue([line])

			const result = await service.findPath('A', 'C', REFERENCE_TIME)

			expect(result.found).toBe(true)
			expect(result.results?.[0]?.legs[0]).toMatchObject({
				departureTime: '08:30',
				arrivalTime: '08:50',
			})
		})

		it('returns found: false with an explicit reason when there is no combination up to 2 transfers', async () => {
			const line = buildLine({ id: 'L1', pattern_ids: ['P1'] })
			patternsById.P1 = buildPattern({
				id: 'P1',
				line_id: 'L1',
				path: [
					{ stop_id: 'X', stop_sequence: 1, distance: 0 },
					{ stop_id: 'Y', stop_sequence: 2, distance: 1000 },
				],
				trips: [
					{
						trip_ids: ['T1'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'X', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'Y', stop_sequence: 2, arrival_time: '08:20:00' },
						],
					},
				],
			})
			mockCarris.getLines.mockResolvedValue([line])

			const result = await service.findPath('A', 'C', REFERENCE_TIME)

			expect(result).toEqual({
				found: false,
				reason: 'no-path-found',
			})
		})

		it('finds a 2-transfer route when no direct or 1-transfer combination exists', async () => {
			const legALine = buildLine({ id: 'LEGA', pattern_ids: ['PA'] })
			const legBLine = buildLine({ id: 'LEGB', pattern_ids: ['PB'] })
			const legCLine = buildLine({ id: 'LEGC', pattern_ids: ['PC'] })

			patternsById.PA = buildPattern({
				id: 'PA',
				line_id: 'LEGA',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'B', stop_sequence: 2, distance: 500 },
				],
				trips: [
					{
						trip_ids: ['TA'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'B', stop_sequence: 2, arrival_time: '08:10:00' },
						],
					},
				],
			})
			patternsById.PB = buildPattern({
				id: 'PB',
				line_id: 'LEGB',
				path: [
					{ stop_id: 'B', stop_sequence: 1, distance: 0 },
					{ stop_id: 'C', stop_sequence: 2, distance: 500 },
				],
				trips: [
					{
						trip_ids: ['TB'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'B', stop_sequence: 1, arrival_time: '08:12:00' },
							{ stop_id: 'C', stop_sequence: 2, arrival_time: '08:20:00' },
						],
					},
				],
			})
			patternsById.PC = buildPattern({
				id: 'PC',
				line_id: 'LEGC',
				path: [
					{ stop_id: 'C', stop_sequence: 1, distance: 0 },
					{ stop_id: 'D', stop_sequence: 2, distance: 500 },
				],
				trips: [
					{
						trip_ids: ['TC'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'C', stop_sequence: 1, arrival_time: '08:22:00' },
							{ stop_id: 'D', stop_sequence: 2, arrival_time: '08:30:00' },
						],
					},
				],
			})

			mockCarris.getLines.mockResolvedValue([legALine, legBLine, legCLine])

			const result = await service.findPath('A', 'D', REFERENCE_TIME)

			expect(result.found).toBe(true)
			const option = result.results?.[0]
			expect(option?.totalTimeMinutes).toBe(30)
			expect(option?.legs).toHaveLength(3)
			expect(option?.legs.map((leg) => leg.lineId)).toEqual([
				'LEGA',
				'LEGB',
				'LEGC',
			])
		})

		it('returns at most 5 results, ordered by total time', async () => {
			const arrivalTimes = [
				'08:10:00',
				'08:11:00',
				'08:12:00',
				'08:13:00',
				'08:14:00',
				'08:15:00',
				'08:16:00',
			]
			const lines = arrivalTimes.map((arrivalTime, i) => {
				const lineId = `L${i}`
				const patternId = `P${i}`
				patternsById[patternId] = buildPattern({
					id: patternId,
					line_id: lineId,
					path: [
						{ stop_id: 'A', stop_sequence: 1, distance: 0 },
						{ stop_id: 'C', stop_sequence: 2, distance: 1000 },
					],
					trips: [
						{
							trip_ids: [`T${i}`],
							service_ids: ['S1'],
							valid_on: [TODAY],
							schedule: [
								{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
								{ stop_id: 'C', stop_sequence: 2, arrival_time: arrivalTime },
							],
						},
					],
				})
				return buildLine({ id: lineId, pattern_ids: [patternId] })
			})
			mockCarris.getLines.mockResolvedValue(lines)

			const result = await service.findPath('A', 'C', REFERENCE_TIME)

			expect(result.found).toBe(true)
			expect(result.results).toHaveLength(5)
			expect(result.results?.map((option) => option.totalTimeMinutes)).toEqual(
				[10, 11, 12, 13, 14],
			)
		})

		it('deduplicates candidates that use the same sequence of lines, keeping only the fastest', async () => {
			const legALine = buildLine({ id: 'LEGA', pattern_ids: ['PA'] })
			const legBLine = buildLine({ id: 'LEGB', pattern_ids: ['PB1', 'PB2'] })

			patternsById.PA = buildPattern({
				id: 'PA',
				line_id: 'LEGA',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'B', stop_sequence: 2, distance: 500 },
					{ stop_id: 'E', stop_sequence: 3, distance: 1500 },
				],
				trips: [
					{
						trip_ids: ['TA'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'B', stop_sequence: 2, arrival_time: '08:10:00' },
							{ stop_id: 'E', stop_sequence: 3, arrival_time: '08:25:00' },
						],
					},
				],
			})
			patternsById.PB1 = buildPattern({
				id: 'PB1',
				line_id: 'LEGB',
				path: [
					{ stop_id: 'B', stop_sequence: 1, distance: 0 },
					{ stop_id: 'D', stop_sequence: 2, distance: 500 },
				],
				trips: [
					{
						trip_ids: ['TB1'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'B', stop_sequence: 1, arrival_time: '08:12:00' },
							{ stop_id: 'D', stop_sequence: 2, arrival_time: '08:20:00' },
						],
					},
				],
			})
			patternsById.PB2 = buildPattern({
				id: 'PB2',
				line_id: 'LEGB',
				path: [
					{ stop_id: 'E', stop_sequence: 1, distance: 0 },
					{ stop_id: 'D', stop_sequence: 2, distance: 500 },
				],
				trips: [
					{
						trip_ids: ['TB2'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'E', stop_sequence: 1, arrival_time: '08:30:00' },
							{ stop_id: 'D', stop_sequence: 2, arrival_time: '08:45:00' },
						],
					},
				],
			})

			mockCarris.getLines.mockResolvedValue([legALine, legBLine])

			const result = await service.findPath('A', 'D', REFERENCE_TIME)

			expect(result.found).toBe(true)
			const sameSequence = result.results?.filter(
				(option) =>
					option.legs.map((leg) => leg.lineId).join('>') === 'LEGA>LEGB',
			)
			expect(sameSequence).toHaveLength(1)
			expect(sameSequence?.[0].totalTimeMinutes).toBe(20)
		})

		it('caches patterns so the same pattern is not fetched more than once per line', async () => {
			const line = buildLine({ id: 'L1', pattern_ids: ['P1'] })
			patternsById.P1 = buildPattern({
				id: 'P1',
				line_id: 'L1',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'C', stop_sequence: 2, distance: 1000 },
				],
				trips: [
					{
						trip_ids: ['T1'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'C', stop_sequence: 2, arrival_time: '08:20:00' },
						],
					},
				],
			})
			mockCarris.getLines.mockResolvedValue([line])

			await service.findPath('A', 'C', REFERENCE_TIME)
			await service.findPath('A', 'C', REFERENCE_TIME)

			expect(mockCarris.getPattern).toHaveBeenCalledTimes(1)
		})

		it('retries after a 429 rate-limit response from the Carris API', async () => {
			const line = buildLine({ id: 'L1', pattern_ids: ['P1'] })
			patternsById.P1 = buildPattern({
				id: 'P1',
				line_id: 'L1',
				path: [
					{ stop_id: 'A', stop_sequence: 1, distance: 0 },
					{ stop_id: 'C', stop_sequence: 2, distance: 1000 },
				],
				trips: [
					{
						trip_ids: ['T1'],
						service_ids: ['S1'],
						valid_on: [TODAY],
						schedule: [
							{ stop_id: 'A', stop_sequence: 1, arrival_time: '08:00:00' },
							{ stop_id: 'C', stop_sequence: 2, arrival_time: '08:20:00' },
						],
					},
				],
			})
			const rateLimitError = Object.assign(new Error('Rate limited'), {
				isAxiosError: true,
				response: { status: 429, headers: { 'retry-after': '0.001' } },
			})
			mockCarris.getPattern.mockImplementationOnce(() =>
				Promise.reject(rateLimitError),
			)
			mockCarris.getLines.mockResolvedValue([line])

			const result = await service.findPath('A', 'C', REFERENCE_TIME)

			expect(result.found).toBe(true)
			expect(mockCarris.getPattern).toHaveBeenCalledTimes(2)
		})

		it('limits concurrent pattern fetches to avoid rate-limiting the Carris API', async () => {
			const patternIds = Array.from({ length: 12 }, (_, i) => `P${i}`)
			const line = buildLine({ id: 'L1', pattern_ids: patternIds })
			mockCarris.getLines.mockResolvedValue([line])

			let concurrent = 0
			let maxConcurrent = 0
			mockCarris.getPattern.mockImplementation(async (patternId: string) => {
				concurrent++
				maxConcurrent = Math.max(maxConcurrent, concurrent)
				await new Promise((resolve) => setTimeout(resolve, 5))
				concurrent--
				return buildPattern({
					id: patternId,
					line_id: 'L1',
					path: [],
					trips: [],
				})
			})

			await service.findPath('A', 'C', REFERENCE_TIME)

			expect(mockCarris.getPattern).toHaveBeenCalledTimes(12)
			expect(maxConcurrent).toBeLessThanOrEqual(5)
		})
	})
})
