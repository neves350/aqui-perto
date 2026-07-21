import { Test, TestingModule } from '@nestjs/testing'
import { mockCarris } from 'src/__mocks__/carris.mock'
import { CarrisClientService } from 'src/integrations/carris/carris-client.service'
import { StopsService } from './stops.service'

const REFERENCE_POINT = { lat: 38.7223, lon: -9.1393 } // Lisbon

describe('StopsService', () => {
	let service: StopsService

	beforeEach(async () => {
		jest.clearAllMocks()

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				StopsService,
				{ provide: CarrisClientService, useValue: mockCarris },
			],
		}).compile()

		service = module.get<StopsService>(StopsService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('findNearby', () => {
		it('includes stops inside the radius', async () => {
			mockCarris.getStops.mockResolvedValue([
				{
					id: 'near',
					long_name: 'Nearby Stop',
					lat: REFERENCE_POINT.lat + 0.001, // ~111m
					lon: REFERENCE_POINT.lon,
				},
			])

			const result = await service.findNearby(
				REFERENCE_POINT.lat,
				REFERENCE_POINT.lon,
				400,
			)

			expect(result).toHaveLength(1)
			expect(result[0].id).toBe('near')
		})

		it('excludes stops outside the radius', async () => {
			mockCarris.getStops.mockResolvedValue([
				{
					id: 'far',
					long_name: 'Far Stop',
					lat: REFERENCE_POINT.lat + 0.01, // ~1100m
					lon: REFERENCE_POINT.lon,
				},
			])

			const result = await service.findNearby(
				REFERENCE_POINT.lat,
				REFERENCE_POINT.lon,
				400,
			)

			expect(result).toHaveLength(0)
		})

		it('includes stops exactly at the radius boundary', async () => {
			const radiusMeters = 400
			const deltaLat = radiusMeters / 111320 // ~meters per degree of latitude

			mockCarris.getStops.mockResolvedValue([
				{
					id: 'boundary',
					long_name: 'Boundary Stop',
					lat: REFERENCE_POINT.lat + deltaLat,
					lon: REFERENCE_POINT.lon,
				},
			])

			const result = await service.findNearby(
				REFERENCE_POINT.lat,
				REFERENCE_POINT.lon,
				radiusMeters + 1, // margin for formula rounding
			)

			expect(result).toHaveLength(1)
			expect(result[0].id).toBe('boundary')
		})
	})

	describe('search', () => {
		it('matches by long_name case-insensitively', async () => {
			mockCarris.getStops.mockResolvedValue([
				{
					id: 'abc',
					long_name: 'Praça de Espanha',
					lat: 38.7223,
					lon: -9.1548,
				},
			])

			const result = await service.search('espanha')

			expect(result).toHaveLength(1)
			expect(result[0].id).toBe('abc')
		})

		it('excludes stops that do not match the query', async () => {
			mockCarris.getStops.mockResolvedValue([
				{
					id: 'abc',
					long_name: 'Praça de Espanha',
					lat: 38.7223,
					lon: -9.1548,
				},
			])

			const result = await service.search('odivelas')

			expect(result).toHaveLength(0)
		})
	})

	describe('findById', () => {
		it('returns null when the stop does not exist', async () => {
			mockCarris.getStopById.mockResolvedValue(null)

			const result = await service.findById('missing')

			expect(result).toBeNull()
		})

		it('maps the stop to the domain DTO', async () => {
			mockCarris.getStopById.mockResolvedValue({
				id: 'abc',
				long_name: 'Praça de Espanha',
				lat: 38.7223,
				lon: -9.1548,
			})

			const result = await service.findById('abc')

			expect(result).toEqual({
				id: 'abc',
				name: 'Praça de Espanha',
				lat: 38.7223,
				lon: -9.1548,
			})
		})
	})
})
