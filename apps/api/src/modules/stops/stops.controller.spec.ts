import { BadRequestException } from '@nestjs/common'
import { StopsController } from './stops.controller'
import { StopsService } from './stops.service'

describe('StopsController', () => {
	let stopsService: jest.Mocked<StopsService>
	let controller: StopsController

	beforeEach(() => {
		stopsService = {
			search: jest.fn(),
			findNearby: jest.fn(),
			findById: jest.fn(),
		} as unknown as jest.Mocked<StopsService>

		controller = new StopsController(stopsService)
	})

	describe('find', () => {
		it('searches by name when a non-empty query is given', () => {
			controller.find({ query: 'Espanha' })

			expect(stopsService.search).toHaveBeenCalledWith('Espanha')
			expect(stopsService.findNearby).not.toHaveBeenCalled()
		})

		it('searches by name when an empty query is given, to list all stops', () => {
			controller.find({ query: '' })

			expect(stopsService.search).toHaveBeenCalledWith('')
			expect(stopsService.findNearby).not.toHaveBeenCalled()
		})

		it('falls back to proximity search when no query is given', () => {
			controller.find({ lat: 38.7223, lon: -9.1393, radius: 400 })

			expect(stopsService.findNearby).toHaveBeenCalledWith(
				38.7223,
				-9.1393,
				400,
			)
			expect(stopsService.search).not.toHaveBeenCalled()
		})

		it('rejects a request with neither a query nor lat/lon', () => {
			expect(() => controller.find({})).toThrow(BadRequestException)
		})
	})
})
