import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class LineQueryDto {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description:
			'Search query matched against line short/long name. Omit (or leave empty) to list all lines.',
		example: '758',
	})
	query?: string
}
