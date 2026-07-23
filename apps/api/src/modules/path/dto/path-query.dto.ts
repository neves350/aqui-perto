import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class PathQueryDto {
	@IsString()
	@IsNotEmpty({ message: 'originStopId must not be empty' })
	@ApiProperty({ description: 'Id of the origin stop', example: '070001' })
	originStopId!: string

	@IsString()
	@IsNotEmpty({ message: 'destinationStopId must not be empty' })
	@ApiProperty({ description: 'Id of the destination stop', example: '070002' })
	destinationStopId!: string

	@IsOptional()
	@IsISO8601({}, { message: 'departureTime must be a valid ISO 8601 date' })
	@ApiPropertyOptional({
		description: 'Departure time (defaults to now)',
		example: '2026-07-23T08:00:00',
	})
	departureTime?: string
}
