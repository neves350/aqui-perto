import { Test, TestingModule } from '@nestjs/testing'
import { mockCarris } from 'src/__mocks__/carris.mock'
import { CarrisLine, CarrisPattern } from 'src/common/types/carris.types'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
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
			expect(result.legs).toHaveLength(1)
			expect(result.legs?.[0]).toMatchObject({
				lineId: 'L1',
				originStopId: 'A',
				destinationStopId: 'C',
				departureTime: '08:00',
				arrivalTime: '08:20',
			})
			expect(result.totalTimeMinutes).toBe(20)
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
			expect(result.totalTimeMinutes).toBe(30)
			expect(result.legs).toHaveLength(2)
			expect(result.legs?.[0]).toMatchObject({
				lineId: 'LEGA',
				originStopId: 'A',
				destinationStopId: 'B',
			})
			expect(result.legs?.[1]).toMatchObject({
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
			expect(result.legs?.[1]).toMatchObject({
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
			expect(result.reason).toBe('no-0-1-transfer-combination')
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
			expect(result.legs?.[0]).toMatchObject({
				departureTime: '08:30',
				arrivalTime: '08:50',
			})
		})

		it('returns found: false with an explicit reason when there is no direct or 1-transfer combination', async () => {
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
				reason: 'no-0-1-transfer-combination',
			})
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
