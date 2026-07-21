import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class LineQueryDto {
	@IsString()
	@IsNotEmpty({ message: 'query must not be empty' })
	@ApiProperty({
		description: 'Search query matched against line short/long name',
		example: '758',
	})
	query!: string
}
