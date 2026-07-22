import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { LineQueryDto } from './line-query.dto'

describe('LineQueryDto', () => {
	it('accepts an empty query, to allow listing all lines', async () => {
		const dto = plainToInstance(LineQueryDto, { query: '' })

		const errors = await validate(dto)

		expect(errors).toHaveLength(0)
	})

	it('accepts a missing query, to allow listing all lines', async () => {
		const dto = plainToInstance(LineQueryDto, {})

		const errors = await validate(dto)

		expect(errors).toHaveLength(0)
	})
})
