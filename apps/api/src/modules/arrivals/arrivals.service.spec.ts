import { Test, TestingModule } from '@nestjs/testing'
import { mockCarris } from 'src/__mocks__/carris.mock'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import { ArrivalsService } from './arrivals.service'

describe('ArrivalsService', () => {
	let service: ArrivalsService

	beforeEach(async () => {
		jest.clearAllMocks()

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ArrivalsService,
				{ provide: CarrisClientService, useValue: mockCarris },
			],
		}).compile()

		service = module.get<ArrivalsService>(ArrivalsService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('getArrivalsForStop', () => {
		const now = Math.floor(Date.now() / 1000)

		beforeEach(() => {
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
		})

		it('filters out arrivals that already passed', async () => {
			mockCarris.getArrivalsByStop.mockResolvedValue([
				{
					line_id: '4200_0',
					pattern_id: 'pattern1',
					route_id: 'route1',
					trip_id: 'trip-past',
					headsign: 'Odivelas',
					stop_sequence: 1,
					scheduled_arrival: '00:00:00',
					scheduled_arrival_unix: now - 3600,
					estimated_arrival: null,
					estimated_arrival_unix: null,
					observed_arrival: null,
					observed_arrival_unix: null,
					vehicle_id: null,
				},
			])

			const result = await service.getArrivalsForStop('070001')

			expect(result).toHaveLength(0)
		})

		it('orders future arrivals by scheduled_arrival_unix ascending', async () => {
			mockCarris.getArrivalsByStop.mockResolvedValue([
				{
					line_id: '4200_0',
					pattern_id: 'pattern1',
					route_id: 'route1',
					trip_id: 'trip-later',
					headsign: 'Odivelas',
					stop_sequence: 1,
					scheduled_arrival: '10:00:00',
					scheduled_arrival_unix: now + 1200,
					estimated_arrival: null,
					estimated_arrival_unix: null,
					observed_arrival: null,
					observed_arrival_unix: null,
					vehicle_id: null,
				},
				{
					line_id: '4200_0',
					pattern_id: 'pattern1',
					route_id: 'route1',
					trip_id: 'trip-sooner',
					headsign: 'Odivelas',
					stop_sequence: 1,
					scheduled_arrival: '09:00:00',
					scheduled_arrival_unix: now + 600,
					estimated_arrival: null,
					estimated_arrival_unix: null,
					observed_arrival: null,
					observed_arrival_unix: null,
					vehicle_id: null,
				},
			])

			const result = await service.getArrivalsForStop('070001')

			expect(result.map((arrival) => arrival.tripId)).toEqual([
				'trip-sooner',
				'trip-later',
			])
		})

		it('maps to the domain DTO with scheduled type and HH:MM arrival time', async () => {
			mockCarris.getArrivalsByStop.mockResolvedValue([
				{
					line_id: '4200_0',
					pattern_id: 'pattern1',
					route_id: 'route1',
					trip_id: 'trip1',
					headsign: 'Odivelas',
					stop_sequence: 1,
					scheduled_arrival: '09:05:00',
					scheduled_arrival_unix: now + 600,
					estimated_arrival: '09:03:00',
					estimated_arrival_unix: now + 480,
					observed_arrival: null,
					observed_arrival_unix: null,
					vehicle_id: null,
				},
			])

			const result = await service.getArrivalsForStop('070001')

			expect(result).toEqual([
				{
					tripId: 'trip1',
					lineId: '4200_0',
					lineName: '758 Odivelas',
					arrivalTime: '09:05',
					type: 'scheduled',
				},
			])
		})

		it('limits the number of results returned', async () => {
			mockCarris.getArrivalsByStop.mockResolvedValue(
				Array.from({ length: 15 }, (_, i) => ({
					line_id: '4200_0',
					pattern_id: 'pattern1',
					route_id: 'route1',
					trip_id: `trip-${i}`,
					headsign: 'Odivelas',
					stop_sequence: 1,
					scheduled_arrival: '09:00:00',
					scheduled_arrival_unix: now + 60 * (i + 1),
					estimated_arrival: null,
					estimated_arrival_unix: null,
					observed_arrival: null,
					observed_arrival_unix: null,
					vehicle_id: null,
				})),
			)

			const result = await service.getArrivalsForStop('070001')

			expect(result).toHaveLength(10)
		})
	})
})
