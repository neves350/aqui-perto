import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsLatitude, IsLongitude, IsOptional, IsPositive } from 'class-validator'

export class StopQueryDto {
	@Type(() => Number)
	@IsLatitude({ message: 'lat must be a valid latitude' })
	@ApiProperty({
		description: 'Latitude of the reference point',
		example: 38.7223,
	})
	lat: number

	@Type(() => Number)
	@IsLongitude({ message: 'lon must be a valid longitude' })
	@ApiProperty({
		description: 'Longitude of the reference point',
		example: -9.1393,
	})
	lon: number

	@IsOptional()
	@Type(() => Number)
	@IsPositive({ message: 'radius must be a positive number' })
	@ApiPropertyOptional({
		description: 'Search radius in meters',
		example: 400,
		default: 400,
	})
	radius?: number = 400
}
