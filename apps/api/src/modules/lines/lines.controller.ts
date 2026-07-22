import {
	Controller,
	Get,
	NotFoundException,
	Param,
	Query,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'
import { LineQueryDto } from './dto/line-query.dto'
import { LineRouteQueryDto } from './dto/line-route-query.dto'
import { LinesService } from './lines.service'

@Controller('lines')
export class LinesController {
	constructor(private readonly linesService: LinesService) {}

	@Get()
	@ApiOperation({ summary: 'Search lines by short/long name' })
	@ApiResponse({ status: 400, description: 'Invalid query' })
	search(@Query() query: LineQueryDto) {
		return this.linesService.search(query.query ?? '')
	}

	@Get(':id/route')
	@ApiOperation({
		summary:
			'Get the full route for a line: ordered stops with next scheduled arrival',
	})
	@ApiParam({ name: 'id', example: '4200_0' })
	@ApiResponse({ status: 404, description: 'Line not found' })
	async getRouteDetail(
		@Param('id') id: string,
		@Query() query: LineRouteQueryDto,
	) {
		const route = await this.linesService.getRouteDetail(id, query.direction)
		if (!route) {
			throw new NotFoundException(`Route for line ${id} not found`)
		}
		return route
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
