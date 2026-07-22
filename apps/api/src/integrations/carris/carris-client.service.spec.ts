import { HttpService } from '@nestjs/axios'
import { Test, TestingModule } from '@nestjs/testing'
import { of } from 'rxjs'
import { CarrisShape } from 'src/common/types/carris.types'
import { CarrisClientService } from './carris-client.service'

const SHAPE: CarrisShape = {
	id: '1_A6RA0',
	extension: 1234,
	geojson: {
		type: 'LineString',
		coordinates: [
			[-9.220572, 38.734436],
			[-9.22055, 38.73442],
		],
	},
}

describe('CarrisClientService', () => {
	let service: CarrisClientService
	let httpGet: jest.Mock

	beforeEach(async () => {
		httpGet = jest.fn()

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CarrisClientService,
				{ provide: HttpService, useValue: { get: httpGet } },
			],
		}).compile()

		service = module.get<CarrisClientService>(CarrisClientService)
	})

	describe('getShape', () => {
		it('requests /shapes/:id and returns the shape', async () => {
			httpGet.mockReturnValue(of({ data: SHAPE }))

			const result = await service.getShape('1_A6RA0')

			expect(httpGet).toHaveBeenCalledWith('/shapes/1_A6RA0')
			expect(result).toEqual(SHAPE)
		})

		it('caches by shape_id so a repeated call does not hit HTTP again', async () => {
			httpGet.mockReturnValue(of({ data: SHAPE }))

			await service.getShape('1_A6RA0')
			await service.getShape('1_A6RA0')

			expect(httpGet).toHaveBeenCalledTimes(1)
		})

		it('makes a separate request for a different shape_id', async () => {
			const otherShape: CarrisShape = { ...SHAPE, id: '2_B7SB1' }
			httpGet.mockReturnValueOnce(of({ data: SHAPE }))
			httpGet.mockReturnValueOnce(of({ data: otherShape }))

			await service.getShape('1_A6RA0')
			const result = await service.getShape('2_B7SB1')

			expect(httpGet).toHaveBeenCalledTimes(2)
			expect(httpGet).toHaveBeenNthCalledWith(2, '/shapes/2_B7SB1')
			expect(result).toEqual(otherShape)
		})
	})
})
