import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
	IsLatitude,
	IsLongitude,
	IsOptional,
	IsPositive,
	IsString,
} from 'class-validator'

export class StopQueryDto {
	@IsOptional()
	@Type(() => Number)
	@IsLatitude({ message: 'lat must be a valid latitude' })
	@ApiPropertyOptional({
		description: 'Latitude of the reference point (required unless "query" is given)',
		example: 38.7223,
	})
	lat?: number

	@IsOptional()
	@Type(() => Number)
	@IsLongitude({ message: 'lon must be a valid longitude' })
	@ApiPropertyOptional({
		description: 'Longitude of the reference point (required unless "query" is given)',
		example: -9.1393,
	})
	lon?: number

	@IsOptional()
	@Type(() => Number)
	@IsPositive({ message: 'radius must be a positive number' })
	@ApiPropertyOptional({
		description: 'Search radius in meters',
		example: 400,
		default: 400,
	})
	radius?: number = 400

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description: 'Search stops by name instead of proximity',
		example: 'Espanha',
	})
	query?: string
}
