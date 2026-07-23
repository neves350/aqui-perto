import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PathQueryDto } from './dto/path-query.dto'
import { PathResultDto } from './dto/path-response.dto'
import { PathService } from './path.service'

@Controller('path')
export class PathController {
	constructor(private readonly pathService: PathService) {}

	@Get()
	@ApiOperation({ summary: 'Plan a trip between two stops (up to 2 transfers)' })
	@ApiResponse({
		status: 400,
		description: 'originStopId and destinationStopId must differ',
	})
	find(@Query() query: PathQueryDto): Promise<PathResultDto> {
		if (query.originStopId === query.destinationStopId) {
			throw new BadRequestException(
				'originStopId and destinationStopId must differ',
			)
		}

		return this.pathService.findPath(
			query.originStopId,
			query.destinationStopId,
			query.departureTime ? new Date(query.departureTime) : undefined,
		)
	}
}
