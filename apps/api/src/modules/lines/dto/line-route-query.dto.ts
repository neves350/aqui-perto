import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional } from 'class-validator'

export class LineRouteQueryDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@ApiPropertyOptional({
		description: 'Direction id to select among the line patterns',
		example: 0,
	})
	direction?: number
}
