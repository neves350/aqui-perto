import { LinesController } from './lines.controller'
import { LinesService } from './lines.service'

describe('LinesController', () => {
	let linesService: jest.Mocked<LinesService>
	let controller: LinesController

	beforeEach(() => {
		linesService = {
			search: jest.fn(),
			findById: jest.fn(),
			getRouteDetail: jest.fn(),
		} as unknown as jest.Mocked<LinesService>

		controller = new LinesController(linesService)
	})

	describe('search', () => {
		it('searches with the given query', () => {
			controller.search({ query: '758' })

			expect(linesService.search).toHaveBeenCalledWith('758')
		})

		it('searches with an empty string when the query is omitted, to list all lines', () => {
			controller.search({})

			expect(linesService.search).toHaveBeenCalledWith('')
		})
	})
})
