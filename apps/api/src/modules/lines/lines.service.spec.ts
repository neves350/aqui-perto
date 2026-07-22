import { Test, TestingModule } from '@nestjs/testing'
import { mockCarris } from 'src/__mocks__/carris.mock'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import { LinesService } from './lines.service'

describe('LinesService', () => {
	let service: LinesService

	beforeEach(async () => {
		jest.clearAllMocks()

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LinesService,
				{ provide: CarrisClientService, useValue: mockCarris },
			],
		}).compile()

		service = module.get<LinesService>(LinesService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('search', () => {
		it('matches by short_name case-insensitively', async () => {
			mockCarris.getLines.mockResolvedValue([
				{
					id: '4200_0',
					short_name: '758',
					long_name: 'Alameda - Odivelas',
					color: '#FF0000',
					text_color: '#FFFFFF',
					route_ids: [],
					pattern_ids: [],
				},
			])

			const result = await service.search('758')

			expect(result).toHaveLength(1)
			expect(result[0].id).toBe('4200_0')
		})

		it('matches by long_name case-insensitively', async () => {
			mockCarris.getLines.mockResolvedValue([
				{
					id: '4200_0',
					short_name: '758',
					long_name: 'Alameda - Odivelas',
					color: '#FF0000',
					text_color: '#FFFFFF',
					route_ids: [],
					pattern_ids: [],
				},
			])

			const result = await service.search('odivelas')

			expect(result).toHaveLength(1)
			expect(result[0].id).toBe('4200_0')
		})

		it('excludes lines that do not match the query', async () => {
			mockCarris.getLines.mockResolvedValue([
				{
					id: '4200_0',
					short_name: '758',
					long_name: 'Alameda - Odivelas',
					color: '#FF0000',
					text_color: '#FFFFFF',
					route_ids: [],
					pattern_ids: [],
				},
			])

			const result = await service.search('999')

			expect(result).toHaveLength(0)
		})
	})

	describe('findById', () => {
		it('returns null when the line does not exist', async () => {
			mockCarris.getLineById.mockResolvedValue(null)

			const result = await service.findById('missing')

			expect(result).toBeNull()
		})

		it('maps the line and its patterns to the domain DTO', async () => {
			mockCarris.getLineById.mockResolvedValue({
				id: '4200_0',
				short_name: '758',
				long_name: 'Alameda - Odivelas',
				color: '#FF0000',
				text_color: '#FFFFFF',
				route_ids: ['route1'],
				pattern_ids: ['pattern1'],
			})
			mockCarris.getPattern.mockResolvedValue({
				id: 'pattern1',
				line_id: '4200_0',
				route_id: 'route1',
				direction_id: 0,
				headsign: 'Odivelas',
				path: [{ stop_id: 'stopA', stop_sequence: 1, distance: 0 }],
				trips: [
					{
						schedule: [
							{ stop_id: 'stopA', stop_sequence: 1, arrival_time: '08:00:00' },
						],
						trip_ids: ['trip1'],
						service_ids: ['service1'],
						valid_on: ['20260721'],
					},
				],
			})

			const result = await service.findById('4200_0')

			expect(result).toEqual({
				id: '4200_0',
				shortName: '758',
				longName: 'Alameda - Odivelas',
				color: '#FF0000',
				textColor: '#FFFFFF',
				patterns: [
					{
						id: 'pattern1',
						headsign: 'Odivelas',
						directionId: 0,
						path: [{ stopId: 'stopA', sequence: 1 }],
						trips: [
							{
								tripIds: ['trip1'],
								schedule: [
									{ stopId: 'stopA', sequence: 1, arrivalTime: '08:00:00' },
								],
							},
						],
					},
				],
			})
		})
	})

	describe('getRouteDetail', () => {
		afterEach(() => {
			jest.useRealTimers()
		})

		it('returns null when the line does not exist', async () => {
			mockCarris.getLineById.mockResolvedValue(null)

			const result = await service.getRouteDetail('missing')

			expect(result).toBeNull()
		})

		it('returns null when the line has no valid pattern', async () => {
			mockCarris.getLineById.mockResolvedValue({
				id: '4200_0',
				short_name: '758',
				long_name: 'Alameda - Odivelas',
				color: '#FF0000',
				text_color: '#FFFFFF',
				route_ids: ['route1'],
				pattern_ids: ['pattern1'],
			})
			mockCarris.getPattern.mockResolvedValue(null)

			const result = await service.getRouteDetail('4200_0')

			expect(result).toBeNull()
		})

		it('sets minutesUntilArrival and scheduledArrival to null when there is no arrival today', async () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-07-22T10:00:00'))

			mockCarris.getLineById.mockResolvedValue({
				id: '4200_0',
				short_name: '758',
				long_name: 'Alameda - Odivelas',
				color: '#FF0000',
				text_color: '#FFFFFF',
				route_ids: ['route1'],
				pattern_ids: ['pattern1'],
			})
			mockCarris.getPattern.mockResolvedValue({
				id: 'pattern1',
				line_id: '4200_0',
				route_id: 'route1',
				direction_id: 0,
				headsign: 'Odivelas',
				path: [{ stop_id: 'stopA', stop_sequence: 1, distance: 0 }],
				trips: [
					{
						schedule: [
							{ stop_id: 'stopA', stop_sequence: 1, arrival_time: '08:00:00' },
						],
						trip_ids: ['trip1'],
						service_ids: ['service1'],
						valid_on: ['20260721'],
					},
				],
			})
			mockCarris.getStops.mockResolvedValue([
				{
					id: 'stopA',
					long_name: 'Alameda',
					short_name: null,
					lat: 38.736,
					lon: -9.136,
					line_ids: [],
					route_ids: [],
					pattern_ids: [],
				},
			])

			const result = await service.getRouteDetail('4200_0')

			expect(result?.stops).toEqual([
				{
					stopId: 'stopA',
					name: 'Alameda',
					sequence: 1,
					lat: 38.736,
					lon: -9.136,
					minutesUntilArrival: null,
					scheduledArrival: null,
				},
			])
		})

		it('returns the ordered stops with minutes/time until the next scheduled arrival', async () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-07-22T10:00:00'))

			mockCarris.getLineById.mockResolvedValue({
				id: '4200_0',
				short_name: '758',
				long_name: 'Alameda - Odivelas',
				color: '#FF0000',
				text_color: '#FFFFFF',
				route_ids: ['route1'],
				pattern_ids: ['pattern1'],
			})
			mockCarris.getPattern.mockResolvedValue({
				id: 'pattern1',
				line_id: '4200_0',
				route_id: 'route1',
				direction_id: 0,
				headsign: 'Odivelas',
				path: [
					{ stop_id: 'stopB', stop_sequence: 2, distance: 100 },
					{ stop_id: 'stopA', stop_sequence: 1, distance: 0 },
				],
				trips: [
					{
						schedule: [
							{ stop_id: 'stopA', stop_sequence: 1, arrival_time: '10:05:00' },
							{ stop_id: 'stopB', stop_sequence: 2, arrival_time: '10:15:00' },
						],
						trip_ids: ['trip1'],
						service_ids: ['service1'],
						valid_on: ['20260722'],
					},
				],
			})
			mockCarris.getStops.mockResolvedValue([
				{
					id: 'stopA',
					long_name: 'Alameda',
					short_name: null,
					lat: 38.736,
					lon: -9.136,
					line_ids: [],
					route_ids: [],
					pattern_ids: [],
				},
				{
					id: 'stopB',
					long_name: 'Odivelas',
					short_name: null,
					lat: 38.791,
					lon: -9.183,
					line_ids: [],
					route_ids: [],
					pattern_ids: [],
				},
			])

			const result = await service.getRouteDetail('4200_0')

			expect(result).toEqual({
				id: '4200_0',
				shortName: '758',
				longName: 'Alameda - Odivelas',
				color: '#FF0000',
				textColor: '#FFFFFF',
				stops: [
					{
						stopId: 'stopA',
						name: 'Alameda',
						sequence: 1,
						lat: 38.736,
						lon: -9.136,
						minutesUntilArrival: 5,
						scheduledArrival: '10:05',
					},
					{
						stopId: 'stopB',
						name: 'Odivelas',
						sequence: 2,
						lat: 38.791,
						lon: -9.183,
						minutesUntilArrival: 15,
						scheduledArrival: '10:15',
					},
				],
			})
		})

		it('picks the soonest upcoming arrival across all trip groups valid today, not just the first', async () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-07-22T10:00:00'))

			mockCarris.getLineById.mockResolvedValue({
				id: '4200_0',
				short_name: '758',
				long_name: 'Alameda - Odivelas',
				color: '#FF0000',
				text_color: '#FFFFFF',
				route_ids: ['route1'],
				pattern_ids: ['pattern1'],
			})
			mockCarris.getPattern.mockResolvedValue({
				id: 'pattern1',
				line_id: '4200_0',
				route_id: 'route1',
				direction_id: 0,
				headsign: 'Odivelas',
				path: [{ stop_id: 'stopA', stop_sequence: 1, distance: 0 }],
				trips: [
					{
						schedule: [
							{ stop_id: 'stopA', stop_sequence: 1, arrival_time: '20:00:00' },
						],
						trip_ids: ['trip-evening'],
						service_ids: ['service1'],
						valid_on: ['20260722'],
					},
					{
						schedule: [
							{ stop_id: 'stopA', stop_sequence: 1, arrival_time: '08:00:00' },
						],
						trip_ids: ['trip-past'],
						service_ids: ['service1'],
						valid_on: ['20260722'],
					},
					{
						schedule: [
							{ stop_id: 'stopA', stop_sequence: 1, arrival_time: '10:05:00' },
						],
						trip_ids: ['trip-next'],
						service_ids: ['service1'],
						valid_on: ['20260722'],
					},
				],
			})
			mockCarris.getStops.mockResolvedValue([
				{
					id: 'stopA',
					long_name: 'Alameda',
					short_name: null,
					lat: 38.736,
					lon: -9.136,
					line_ids: [],
					route_ids: [],
					pattern_ids: [],
				},
			])

			const result = await service.getRouteDetail('4200_0')

			expect(result?.stops).toEqual([
				{
					stopId: 'stopA',
					name: 'Alameda',
					sequence: 1,
					lat: 38.736,
					lon: -9.136,
					minutesUntilArrival: 5,
					scheduledArrival: '10:05',
				},
			])
		})
	})
})
