import { Module } from '@nestjs/common'
import { CarrisModule } from 'src/integrations/carris/carris.module'
import { LinesController } from './lines.controller'
import { LinesService } from './lines.service'

@Module({
	imports: [CarrisModule],
	controllers: [LinesController],
	providers: [LinesService],
})
export class LinesModule {}
