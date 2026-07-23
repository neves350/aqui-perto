import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PathController } from './path.controller'
import { PathService } from './path.service'

describe('PathController', () => {
	let controller: PathController
	const pathService = { findPath: jest.fn() }

	beforeEach(async () => {
		jest.clearAllMocks()

		const module: TestingModule = await Test.createTestingModule({
			controllers: [PathController],
			providers: [{ provide: PathService, useValue: pathService }],
		}).compile()

		controller = module.get<PathController>(PathController)
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})

	describe('find', () => {
		it('throws a BadRequestException when origin and destination are the same', () => {
			expect(() =>
				controller.find({ originStopId: 'A', destinationStopId: 'A' }),
			).toThrow(BadRequestException)
			expect(pathService.findPath).not.toHaveBeenCalled()
		})

		it('delegates to PathService.findPath with parsed departureTime', async () => {
			pathService.findPath.mockResolvedValue({ found: false })

			await controller.find({
				originStopId: 'A',
				destinationStopId: 'B',
				departureTime: '2026-07-23T08:00:00',
			})

			expect(pathService.findPath).toHaveBeenCalledWith(
				'A',
				'B',
				new Date('2026-07-23T08:00:00'),
			)
		})

		it('passes undefined departureTime when not provided', async () => {
			pathService.findPath.mockResolvedValue({ found: false })

			await controller.find({ originStopId: 'A', destinationStopId: 'B' })

			expect(pathService.findPath).toHaveBeenCalledWith('A', 'B', undefined)
		})
	})
})
