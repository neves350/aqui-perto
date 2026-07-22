import {
	BadRequestException,
	Controller,
	Get,
	NotFoundException,
	Param,
	Query,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'
import { StopQueryDto } from './dto/stop-query.dto'
import { StopsService } from './stops.service'

@Controller('stops')
export class StopsController {
	constructor(private readonly stopsService: StopsService) {}

	@Get()
	@ApiOperation({ summary: 'Find stops by name, or near a given point' })
	@ApiResponse({ status: 400, description: 'Invalid query, or missing lat/lon' })
	find(@Query() query: StopQueryDto) {
		if (query.query !== undefined) {
			return this.stopsService.search(query.query)
		}

		if (query.lat === undefined || query.lon === undefined) {
			throw new BadRequestException(
				'Either "query" or both "lat" and "lon" must be provided',
			)
		}

		return this.stopsService.findNearby(query.lat, query.lon, query.radius)
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a stop by id' })
	@ApiParam({ name: 'id', example: '070001' })
	@ApiResponse({ status: 404, description: 'Stop not found' })
	async findById(@Param('id') id: string) {
		const stop = await this.stopsService.findById(id)
		if (!stop) {
			throw new NotFoundException(`Stop ${id} not found`)
		}
		return stop
	}
}
