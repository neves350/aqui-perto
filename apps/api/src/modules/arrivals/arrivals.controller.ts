import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ArrivalsService } from './arrivals.service'
import { ArrivalQueryDto } from './dto/arrival-query.dto'

@Controller('arrivals')
export class ArrivalsController {
	constructor(private readonly arrivalsService: ArrivalsService) {}

	@Get()
	@ApiOperation({ summary: 'Get upcoming arrivals for a stop' })
	@ApiResponse({ status: 400, description: 'Invalid stopId' })
	getArrivals(@Query() query: ArrivalQueryDto) {
		return this.arrivalsService.getArrivalsForStop(query.stopId)
	}
}
