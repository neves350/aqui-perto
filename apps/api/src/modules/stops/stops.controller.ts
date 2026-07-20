import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'
import { StopQueryDto } from './dto/stop-query.dto'
import { StopsService } from './stops.service'

@Controller('stops')
export class StopsController {
	constructor(private readonly stopsService: StopsService) {}

	@Get()
	@ApiOperation({ summary: 'Find stops near a given point' })
	@ApiResponse({ status: 400, description: 'Invalid lat/lon/radius' })
	findNearby(@Query() query: StopQueryDto) {
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
