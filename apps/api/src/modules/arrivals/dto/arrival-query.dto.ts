import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class ArrivalQueryDto {
	@IsString()
	@IsNotEmpty({ message: 'stopId must not be empty' })
	@ApiProperty({
		description: 'Id of the stop to fetch upcoming arrivals for',
		example: '070001',
	})
	stopId!: string
}
