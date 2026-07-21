import { Module } from '@nestjs/common'
import { CarrisModule } from 'src/integrations/carris/carris.module'
import { ArrivalsController } from './arrivals.controller'
import { ArrivalsService } from './arrivals.service'

@Module({
	imports: [CarrisModule],
	controllers: [ArrivalsController],
	providers: [ArrivalsService],
})
export class ArrivalsModule {}
