import {
	Controller,
	Get,
	NotFoundException,
	Param,
	Query,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'
import { LineQueryDto } from './dto/line-query.dto'
import { LinesService } from './lines.service'

@Controller('lines')
export class LinesController {
	constructor(private readonly linesService: LinesService) {}

	@Get()
	@ApiOperation({ summary: 'Search lines by short/long name' })
	@ApiResponse({ status: 400, description: 'Invalid query' })
	search(@Query() query: LineQueryDto) {
		return this.linesService.search(query.query)
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get a line by id, including its patterns and schedules',
	})
	@ApiParam({ name: 'id', example: '4200_0' })
	@ApiResponse({ status: 404, description: 'Line not found' })
	async findById(@Param('id') id: string) {
		const line = await this.linesService.findById(id)
		if (!line) {
			throw new NotFoundException(`Line ${id} not found`)
		}
		return line
	}
}
